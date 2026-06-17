import type { SupabaseClient } from "@supabase/supabase-js";

import { filterForIndieFit } from "@/lib/filters/indie-fit-filter";
import { normalizeProductInput } from "@/lib/normalizers/product-input";
import type { RawProductInput } from "@/lib/normalizers/normalize-product";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Database, Insert, Row } from "@/lib/types/database";

export interface ImportStats {
  fetched: number;
  inserted_products: number;
  inserted_rankings: number;
  skipped_ranking_duplicate: number;
  skipped_blocked: number;
  skipped_duplicate: number;
  skipped_not_indie_fit: number;
  errors: number;
}

export interface ImportProductsOptions {
  dryRun: boolean;
  onProductError?: (input: RawProductInput, error: unknown) => Promise<void>;
}

type ExistingProduct = Pick<Row<"products">, "id" | "name" | "domain">;

function bigrams(value: string): Set<string> {
  const result = new Set<string>();
  for (let index = 0; index < value.length - 1; index += 1) {
    result.add(value.slice(index, index + 2));
  }
  return result;
}

export function areNamesSimilar(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }

  if (left.length < 4 || right.length < 4) {
    return false;
  }

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  let overlap = 0;

  for (const pair of leftPairs) {
    if (rightPairs.has(pair)) {
      overlap += 1;
    }
  }

  const score = (2 * overlap) / (leftPairs.size + rightPairs.size);
  return score >= 0.88;
}

async function loadExistingProducts(
  supabase: SupabaseClient<Database>,
): Promise<ExistingProduct[]> {
  const products: ExistingProduct[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,domain")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Unable to load existing products: ${error.message}`);
    }

    products.push(...data);
    if (data.length < pageSize) {
      return products;
    }
  }
}

function findExistingProduct(
  products: ExistingProduct[],
  domain: string,
  normalizedName: string,
): ExistingProduct | undefined {
  return (
    products.find((product) => product.domain?.toLowerCase() === domain) ??
    products.find((product) =>
      areNamesSimilar(
        product.name.toLowerCase().replace(/[^a-z0-9]+/g, ""),
        normalizedName,
      ),
    )
  );
}

export async function importProducts(
  inputs: RawProductInput[],
  options: ImportProductsOptions,
): Promise<ImportStats> {
  const stats: ImportStats = {
    fetched: inputs.length,
    inserted_products: 0,
    inserted_rankings: 0,
    skipped_ranking_duplicate: 0,
    skipped_blocked: 0,
    skipped_duplicate: 0,
    skipped_not_indie_fit: 0,
    errors: 0,
  };

  const supabase = options.dryRun ? null : createSupabaseServiceClient();
  const existingProducts = supabase ? await loadExistingProducts(supabase) : [];
  const seenProducts: ExistingProduct[] = [...existingProducts];

  for (const input of inputs) {
    try {
      const product = normalizeProductInput(input);
      const decision = filterForIndieFit(product);

      if (!decision.keep) {
        if (decision.reason === "blocked_domain") {
          stats.skipped_blocked += 1;
        } else {
          stats.skipped_not_indie_fit += 1;
        }
        continue;
      }

      const existing = findExistingProduct(
        seenProducts,
        product.domain!,
        product.normalized_name,
      );
      let productId = existing?.id;

      if (existing) {
        stats.skipped_duplicate += 1;
        if (!options.dryRun) {
          const seenAt = new Date().toISOString();
          const { error } = await supabase!
            .from("products")
            .update({
              last_seen_at: seenAt,
              updated_at: seenAt,
            })
            .eq("id", existing.id);
          if (error) {
            throw new Error(
              `Unable to update existing product: ${error.message}`,
            );
          }
        }
      } else if (options.dryRun) {
        productId = `dry-run-${seenProducts.length + 1}`;
        stats.inserted_products += 1;
        seenProducts.push({
          id: productId,
          name: product.name,
          domain: product.domain,
        });
      } else {
        const productInsert: Insert<"products"> = {
          name: product.name,
          domain: product.domain,
          website_url: product.website_url,
          tagline: product.tagline,
          description: product.description,
          logo_url: product.logo_url,
          pricing_type: product.pricing_type,
          product_scale: product.product_scale,
        };
        const { data, error } = await supabase!
          .from("products")
          .insert(productInsert)
          .select("id,name,domain")
          .single();

        if (error) {
          throw new Error(`Unable to insert product: ${error.message}`);
        }

        productId = data.id;
        seenProducts.push(data);
        stats.inserted_products += 1;
      }

      const ranking: Insert<"product_rankings"> = {
        product_id: productId!,
        source_name: product.source_name,
        source_url: product.source_url,
        list_name: product.list_name,
        list_type: product.list_type,
        category: product.category,
        rank_position: product.rank_position,
        upvotes: product.upvotes,
        comments: product.comments,
        rating: product.rating,
        snapshot_date: product.snapshot_date,
        raw_data: product.raw_data,
      };

      if (!options.dryRun) {
        const { error } = await supabase!
          .from("product_rankings")
          .insert(ranking);
        if (error) {
          if (error.code === "23505") {
            stats.skipped_ranking_duplicate += 1;
            continue;
          }
          throw new Error(`Unable to insert product ranking: ${error.message}`);
        }
      }

      stats.inserted_rankings += 1;
    } catch (error) {
      stats.errors += 1;
      await options.onProductError?.(input, error);
    }
  }

  return stats;
}
