import * as cheerio from "cheerio";

import { cleanUrl } from "@/lib/normalizers/normalize-product";
import type { RawProductInput } from "@/lib/normalizers/normalize-product";

interface ListingSiteConfig {
  sourceName: string;
  baseUrl: string;
  categoryUrls: Array<{ name: string; url: string }>;
  toolPathPattern: RegExp;
  excludedExternalDomains: string[];
}

const REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (compatible; AIProductRankingDatabase/0.1; +https://localhost)",
};

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const html = await response.text();

  if (
    !response.ok ||
    /cf-chl-|<title>just a moment|enable javascript and cookies to continue/i.test(
      html,
    )
  ) {
    throw new Error(
      `Listing request blocked or unavailable: ${response.status} ${url}`,
    );
  }

  return html;
}

function findExternalWebsite(
  $: cheerio.CheerioAPI,
  config: ListingSiteConfig,
): string | null {
  const excluded = [
    new URL(config.baseUrl).hostname.replace(/^www\./, ""),
    ...config.excludedExternalDomains,
  ];

  for (const element of $("a[href]").toArray()) {
    const href = $(element).attr("href");
    if (!href || !/^https?:\/\//i.test(href)) {
      continue;
    }

    const normalized = cleanUrl(href);
    if (!normalized) {
      continue;
    }

    const domain = new URL(normalized).hostname.replace(/^www\./, "");
    if (!excluded.some((item) => domain === item || domain.endsWith(`.${item}`))) {
      return normalized;
    }
  }

  return null;
}

function extractTags($: cheerio.CheerioAPI): string[] {
  const tags = new Set<string>();

  $('a[href*="/category/"], a[href*="/ai-tools/"]').each((_, element) => {
    const text = $(element).text().replace(/^#/, "").replace(/\s+/g, " ").trim();
    if (text && text.length <= 50) {
      tags.add(text);
    }
  });

  return [...tags].slice(0, 20);
}

async function fetchToolDetail(
  sourceUrl: string,
  category: string,
  rankPosition: number,
  config: ListingSiteConfig,
): Promise<RawProductInput> {
  const html = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const name =
    $("h1").first().text().replace(/\s+/g, " ").trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";
  const description =
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    null;

  if (!name) {
    throw new Error(`Unable to find product name on ${sourceUrl}`);
  }

  return {
    source_name: config.sourceName,
    name,
    website_url: findExternalWebsite($, config),
    tagline: description,
    description,
    logo_url:
      $('meta[property="og:image"]').attr("content") ??
      $('meta[name="twitter:image"]').attr("content") ??
      null,
    category,
    tags: extractTags($),
    source_url: sourceUrl,
    list_name: category,
    list_type: "category",
    rank_position: rankPosition,
    snapshot_date: new Date().toISOString(),
    raw_data: {
      source_url: sourceUrl,
      category,
      meta_description: description,
    },
  };
}

export async function fetchListingSiteProducts(
  config: ListingSiteConfig,
  limit: number,
  onProductError: (context: Record<string, unknown>, error: unknown) => Promise<void>,
): Promise<RawProductInput[]> {
  const products: RawProductInput[] = [];
  const seenDetailUrls = new Set<string>();

  for (const category of config.categoryUrls) {
    if (products.length >= limit) {
      break;
    }

    const html = await fetchHtml(category.url);
    const $ = cheerio.load(html);
    const detailUrls: string[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) {
        return;
      }

      const absolute = cleanUrl(new URL(href, config.baseUrl).toString());
      if (
        absolute &&
        config.toolPathPattern.test(new URL(absolute).pathname) &&
        !seenDetailUrls.has(absolute)
      ) {
        seenDetailUrls.add(absolute);
        detailUrls.push(absolute);
      }
    });

    for (const sourceUrl of detailUrls) {
      if (products.length >= limit) {
        break;
      }

      try {
        products.push(
          await fetchToolDetail(
            sourceUrl,
            category.name,
            products.length + 1,
            config,
          ),
        );
      } catch (error) {
        await onProductError({ source_url: sourceUrl, category: category.name }, error);
      }
    }
  }

  return products;
}
