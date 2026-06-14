import "dotenv/config";

import { extractProductPattern } from "../lib/ai/extract-product-pattern";
import { createSupabaseServiceClient } from "../lib/supabase/server";
import type { Insert, Row } from "../lib/types/database";
import { writeErrorLog } from "../lib/scrapers/error-log";

interface EnrichArgs {
  limit: number;
  dryRun: boolean;
  force: boolean;
}

interface EnrichStats {
  analyzed: number;
  inserted: number;
  good: number;
  maybe: number;
  bad: number;
  errors: number;
}

function parseArgs(argv: string[]): EnrichArgs {
  let limit = 100;
  let dryRun = false;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      dryRun = true;
    } else if (argument === "--force") {
      force = true;
    } else if (argument === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      limit = value;
      index += 1;
    }
  }

  return { limit, dryRun, force };
}

async function loadProducts(
  limit: number,
  force: boolean,
): Promise<Array<Row<"products"> & { category: string | null }>> {
  const supabase = createSupabaseServiceClient();
  let excludedProductIds = new Set<string>();

  if (!force) {
    const { data, error } = await supabase
      .from("product_patterns")
      .select("product_id");
    if (error) {
      throw new Error(`Unable to load existing patterns: ${error.message}`);
    }
    excludedProductIds = new Set(data.map((pattern) => pattern.product_id));
  }

  const scanLimit = Math.max(limit * 5, limit);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_blocked", false)
    .order("created_at", { ascending: true })
    .limit(scanLimit);
  if (productsError) {
    throw new Error(`Unable to load products: ${productsError.message}`);
  }

  const selected = products
    .filter((product) => !excludedProductIds.has(product.id))
    .slice(0, limit);
  if (selected.length === 0) {
    return [];
  }

  const { data: rankings, error: rankingsError } = await supabase
    .from("product_rankings")
    .select("product_id,category,created_at")
    .in(
      "product_id",
      selected.map((product) => product.id),
    )
    .order("created_at", { ascending: false });
  if (rankingsError) {
    throw new Error(`Unable to load product rankings: ${rankingsError.message}`);
  }

  const categories = new Map<string, string | null>();
  for (const ranking of rankings) {
    if (!categories.has(ranking.product_id)) {
      categories.set(ranking.product_id, ranking.category);
    }
  }

  return selected.map((product) => ({
    ...product,
    category: categories.get(product.id) ?? null,
  }));
}

async function main() {
  const { limit, dryRun, force } = parseArgs(process.argv.slice(2));
  const products = await loadProducts(limit, force);
  const supabase = dryRun ? null : createSupabaseServiceClient();
  const stats: EnrichStats = {
    analyzed: 0,
    inserted: 0,
    good: 0,
    maybe: 0,
    bad: 0,
    errors: 0,
  };

  for (const product of products) {
    try {
      const pattern = await extractProductPattern({
        name: product.name,
        domain: product.domain,
        website_url: product.website_url,
        tagline: product.tagline,
        description: product.description,
        product_scale: product.product_scale,
        category: product.category,
      });

      stats.analyzed += 1;
      stats[pattern.solo_founder_fit] += 1;

      if (!dryRun) {
        const insert: Insert<"product_patterns"> = {
          product_id: product.id,
          ...pattern,
        };
        const { error } = await supabase!.from("product_patterns").insert(insert);
        if (error) {
          throw new Error(`Unable to insert product pattern: ${error.message}`);
        }
        stats.inserted += 1;
      }
    } catch (error) {
      stats.errors += 1;
      await writeErrorLog(
        "ai-pattern-errors.jsonl",
        { product_id: product.id, name: product.name },
        error,
      );
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

main().catch(async (error: unknown) => {
  await writeErrorLog("ai-pattern-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
