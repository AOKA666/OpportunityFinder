import "./load-env";

import {
  clusterOpportunitySources,
  generateOpportunitiesFromClusters,
  type OpportunitySource,
} from "../lib/ai/generate-opportunities";
import { writeErrorLog } from "../lib/scrapers/error-log";
import { createSupabaseServiceClient } from "../lib/supabase/server";
import type { Insert } from "../lib/types/database";

function parseArgs(argv: string[]) {
  let limit = 10;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--dry-run") {
      dryRun = true;
    } else if (argv[index] === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0 || value > 20) {
        throw new Error("--limit must be an integer between 1 and 20");
      }
      limit = value;
      index += 1;
    }
  }

  return { limit, dryRun };
}

async function loadEligibleSources(): Promise<OpportunitySource[]> {
  const supabase = createSupabaseServiceClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("is_blocked", false)
    .limit(1000);
  if (productsError) {
    throw new Error(`Unable to load products: ${productsError.message}`);
  }
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const [patternsResult, reviewsResult, rankingsResult] = await Promise.all([
    supabase
      .from("product_patterns")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("review_labels")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_rankings")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
  ]);

  if (patternsResult.error || reviewsResult.error || rankingsResult.error) {
    throw new Error(
      patternsResult.error?.message ??
        reviewsResult.error?.message ??
        rankingsResult.error?.message ??
        "Unable to load opportunity evidence",
    );
  }

  const latestPatterns = new Map(
    patternsResult.data
      .toReversed()
      .map((pattern) => [pattern.product_id, pattern]),
  );
  const latestReviews = new Map(
    reviewsResult.data
      .toReversed()
      .map((review) => [review.product_id, review]),
  );
  const latestRankings = new Map(
    rankingsResult.data
      .toReversed()
      .map((ranking) => [ranking.product_id, ranking]),
  );

  return products.flatMap((product) => {
    const pattern = latestPatterns.get(product.id);
    const review = latestReviews.get(product.id) ?? null;
    if (!pattern) {
      return [];
    }

    const eligible =
      review?.status === "keep" ||
      pattern.solo_founder_fit === "good" ||
      (pattern.solo_founder_fit === "maybe" &&
        pattern.standalone_potential !== "low");
    if (!eligible) {
      return [];
    }

    return [
      {
        product,
        pattern,
        review,
        ranking: latestRankings.get(product.id) ?? null,
      },
    ];
  });
}

async function main() {
  const { limit, dryRun } = parseArgs(process.argv.slice(2));
  const sources = await loadEligibleSources();
  const clusters = clusterOpportunitySources(sources);
  const opportunities = await generateOpportunitiesFromClusters(clusters, limit);
  let inserted = 0;

  if (!dryRun && opportunities.length > 0) {
    const rows: Insert<"opportunities">[] = opportunities.map(
      (opportunity) => opportunity,
    );
    const { error } = await createSupabaseServiceClient()
      .from("opportunities")
      .insert(rows);
    if (error) {
      throw new Error(`Unable to insert opportunities: ${error.message}`);
    }
    inserted = rows.length;
  }

  console.log(
    JSON.stringify(
      {
        eligible_products: sources.length,
        clusters: clusters.length,
        generated: opportunities.length,
        inserted,
        dry_run: dryRun,
      },
      null,
      2,
    ),
  );
}

main().catch(async (error: unknown) => {
  await writeErrorLog("opportunity-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
