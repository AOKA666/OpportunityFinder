import { classifyProductScale } from "@/lib/filters/product-scale";
import {
  cleanUrl,
  extractDomain,
  normalizeProductName,
  normalizeSnapshotDate,
  nullIfEmpty,
  parseTags,
  type NormalizedProductInput,
  type RawProductInput,
} from "@/lib/normalizers/normalize-product";

export function normalizeProductInput(
  input: RawProductInput,
): NormalizedProductInput {
  const name = nullIfEmpty(input.name);
  if (!name) {
    throw new Error("Product name is required");
  }

  const websiteUrl = cleanUrl(input.website_url);
  const tagline = nullIfEmpty(input.tagline);
  const description = nullIfEmpty(input.description);
  const category = nullIfEmpty(input.category);
  const tags = parseTags(input.tags);

  const normalized = {
    source_name: input.source_name.trim(),
    name,
    normalized_name: normalizeProductName(name),
    website_url: websiteUrl,
    domain: extractDomain(websiteUrl),
    tagline,
    description,
    logo_url: cleanUrl(input.logo_url),
    pricing_type: nullIfEmpty(input.pricing_type),
    category,
    tags,
    source_url: cleanUrl(input.source_url),
    list_name: nullIfEmpty(input.list_name),
    list_type: nullIfEmpty(input.list_type),
    rank_position: input.rank_position ?? null,
    upvotes: input.upvotes ?? null,
    comments: input.comments ?? null,
    rating: input.rating ?? null,
    snapshot_date: normalizeSnapshotDate(input.snapshot_date),
    raw_data: input.raw_data ?? null,
  };

  return {
    ...normalized,
    product_scale: classifyProductScale(normalized),
  };
}
