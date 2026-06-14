import { findBlockedDomain } from "@/lib/filters/blocked-domains";
import { isAllowedProductScale } from "@/lib/filters/product-scale";
import type { NormalizedProductInput } from "@/lib/normalizers/normalize-product";

export type FilterReason =
  | "blocked_domain"
  | "missing_domain"
  | "forbidden_category"
  | "unsuitable_keyword"
  | "unsupported_scale";

export interface FilterDecision {
  keep: boolean;
  reason: FilterReason | null;
  detail: string | null;
}

const FORBIDDEN_CATEGORY_PATTERN =
  /\b(affiliate|career|crm|crypto|customer support|e-?commerce|education|exam|finance|hr|human resources|interview|job|legal|marketing agency|medical|sales|social media|tax)\b/i;

const UNSUITABLE_PATTERN =
  /\b(affiliate commission|applicant tracking|career coach|crm|customer support platform|e-?commerce|enterprise sales|exam prep|financial advice|for law firms|health diagnosis|hire talent|homeschool|human resources|interview prep|job board|legal advice|marketing agency|medical diagnosis|online course|sales pipeline|tax filing)\b/i;

const WEAK_UTILITY_PATTERN =
  /\b(favicon snippet|header parser|http header|pdf page checker|svg viewbox)\b/i;

export function filterForIndieFit(
  product: NormalizedProductInput,
): FilterDecision {
  const blockedDomain = findBlockedDomain(product.domain);
  if (blockedDomain) {
    return {
      keep: false,
      reason: "blocked_domain",
      detail: `Domain matches blocked entry ${blockedDomain}`,
    };
  }

  if (!product.domain) {
    return {
      keep: false,
      reason: "missing_domain",
      detail: "A stable product domain is required for deduplication",
    };
  }

  if (!isAllowedProductScale(product.product_scale)) {
    return {
      keep: false,
      reason: "unsupported_scale",
      detail: `Product scale ${product.product_scale} is outside the MVP scope`,
    };
  }

  if (FORBIDDEN_CATEGORY_PATTERN.test(product.category ?? "")) {
    return {
      keep: false,
      reason: "forbidden_category",
      detail: `Category ${product.category} is outside the MVP scope`,
    };
  }

  const text = [
    product.name,
    product.tagline,
    product.description,
    product.category,
    product.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const unsuitableMatch = text.match(UNSUITABLE_PATTERN);
  if (unsuitableMatch) {
    return {
      keep: false,
      reason: "unsuitable_keyword",
      detail: `Matched unsuitable signal: ${unsuitableMatch[0]}`,
    };
  }

  const weakUtilityMatch = text.match(WEAK_UTILITY_PATTERN);
  if (weakUtilityMatch) {
    return {
      keep: false,
      reason: "unsuitable_keyword",
      detail: `Matched weak standalone utility: ${weakUtilityMatch[0]}`,
    };
  }

  return { keep: true, reason: null, detail: null };
}
