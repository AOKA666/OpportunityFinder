import type { Json, ProductScale } from "@/lib/types/database";

const TRACKING_PARAMETERS = new Set([
  "ref",
  "referrer",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

export interface RawProductInput {
  source_name: string;
  name: string;
  website_url?: string | null;
  tagline?: string | null;
  description?: string | null;
  logo_url?: string | null;
  pricing_type?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  source_url?: string | null;
  list_name?: string | null;
  list_type?: string | null;
  rank_position?: number | null;
  upvotes?: number | null;
  comments?: number | null;
  rating?: number | null;
  snapshot_date?: string | null;
  raw_data?: Json | null;
}

export interface NormalizedProductInput {
  source_name: string;
  name: string;
  normalized_name: string;
  website_url: string | null;
  domain: string | null;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  pricing_type: string | null;
  category: string | null;
  tags: string[];
  source_url: string | null;
  list_name: string | null;
  list_type: string | null;
  rank_position: number | null;
  upvotes: number | null;
  comments: number | null;
  rating: number | null;
  snapshot_date: string;
  raw_data: Json | null;
  product_scale: ProductScale;
}

export function nullIfEmpty(value?: string | null): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
}

export function normalizeProductName(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function cleanUrl(value?: string | null): string | null {
  const candidate = nullIfEmpty(value);
  if (!candidate) {
    return null;
  }

  try {
    const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
      ? candidate
      : `https://${candidate}`;
    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    url.hash = "";
    for (const parameter of [...url.searchParams.keys()]) {
      if (
        TRACKING_PARAMETERS.has(parameter.toLowerCase()) ||
        parameter.toLowerCase().startsWith("utm_")
      ) {
        url.searchParams.delete(parameter);
      }
    }

    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function extractDomain(value?: string | null): string | null {
  const url = cleanUrl(value);
  if (!url) {
    return null;
  }

  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

export function parseTags(value?: string[] | string | null): string[] {
  const values = Array.isArray(value)
    ? value
    : (value ?? "").split(/[|,;]/);

  return [
    ...new Set(
      values
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.toLowerCase()),
    ),
  ];
}

export function normalizeSnapshotDate(value?: string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}
