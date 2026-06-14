import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  OpportunityCard,
  ProductDetail,
  ProductListItem,
} from "@/lib/types/product";

export async function loadProductList(): Promise<ProductListItem[]> {
  const supabase = createSupabaseServiceClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("last_seen_at", { ascending: false })
    .limit(1000);

  if (productsError) {
    throw new Error(`Unable to load products: ${productsError.message}`);
  }
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const [rankingsResult, patternsResult, reviewsResult] = await Promise.all([
    supabase
      .from("product_rankings")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
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
  ]);

  if (rankingsResult.error) {
    throw new Error(`Unable to load rankings: ${rankingsResult.error.message}`);
  }
  if (patternsResult.error) {
    throw new Error(`Unable to load patterns: ${patternsResult.error.message}`);
  }
  if (reviewsResult.error) {
    throw new Error(`Unable to load reviews: ${reviewsResult.error.message}`);
  }

  const latestRankings = new Map(
    rankingsResult.data
      .toReversed()
      .map((ranking) => [ranking.product_id, ranking]),
  );
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

  return products.map((product) => ({
    ...product,
    latest_ranking: latestRankings.get(product.id) ?? null,
    latest_pattern: latestPatterns.get(product.id) ?? null,
    latest_review: latestReviews.get(product.id) ?? null,
  }));
}

export async function loadProductDetail(
  id: string,
): Promise<ProductDetail | null> {
  const supabase = createSupabaseServiceClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (productError) {
    throw new Error(`Unable to load product: ${productError.message}`);
  }
  if (!product) {
    return null;
  }

  const [rankingsResult, patternsResult, reviewsResult] = await Promise.all([
    supabase
      .from("product_rankings")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_patterns")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("review_labels")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (rankingsResult.error || patternsResult.error || reviewsResult.error) {
    throw new Error(
      rankingsResult.error?.message ??
        patternsResult.error?.message ??
        reviewsResult.error?.message ??
        "Unable to load product detail",
    );
  }

  return {
    ...product,
    rankings: rankingsResult.data,
    patterns: patternsResult.data,
    reviews: reviewsResult.data,
  };
}

export async function loadOpportunityCards(): Promise<OpportunityCard[]> {
  const supabase = createSupabaseServiceClient();
  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load opportunities: ${error.message}`);
  }

  const productIds = [
    ...new Set(opportunities.flatMap((item) => item.source_product_ids ?? [])),
  ];
  const productMap = new Map<
    string,
    { id: string; name: string; domain: string | null }
  >();

  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,domain")
      .in("id", productIds);
    if (productsError) {
      throw new Error(
        `Unable to load opportunity products: ${productsError.message}`,
      );
    }
    for (const product of products) {
      productMap.set(product.id, product);
    }
  }

  return opportunities.map((opportunity) => ({
    ...opportunity,
    inspired_by: (opportunity.source_product_ids ?? [])
      .map((id) => productMap.get(id))
      .filter((product) => product !== undefined),
  }));
}
