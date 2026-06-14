import "dotenv/config";

import { parseCommonArgs } from "../lib/scrapers/args";
import { writeErrorLog } from "../lib/scrapers/error-log";
import { importProducts } from "../lib/scrapers/import-products";
import { fetchListingSiteProducts } from "../lib/scrapers/listing-site";

const BASE_URL = "https://www.toolify.ai";
const CATEGORIES = [
  ["Image Analysis", "/category/ai-image-analyzer"],
  ["Image Generation & Editing", "/category/ai-image-generator"],
  ["Art & Creative Design", "/category/design-art"],
  ["Coding & Development", "/category/ai-code-assistant"],
  ["Productivity", "/category/productivity"],
  ["Daily Life", "/category/life-assistant"],
  ["Design", "/category/design-assistant"],
  ["Website tools", "/category/ai-website-builder"],
  ["SEO tools", "/category/ai-seo-assistant"],
  ["Developer tools", "/category/developer-tools"],
] as const;

async function main() {
  const { limit, dryRun } = parseCommonArgs(process.argv.slice(2), {
    limit: 100,
  });
  const products = await fetchListingSiteProducts(
    {
      sourceName: "Toolify",
      baseUrl: BASE_URL,
      categoryUrls: CATEGORIES.map(([name, path]) => ({
        name,
        url: new URL(path, BASE_URL).toString(),
      })),
      toolPathPattern: /^\/tool\//,
      excludedExternalDomains: [
        "facebook.com",
        "instagram.com",
        "linkedin.com",
        "tiktok.com",
        "x.com",
        "youtube.com",
      ],
    },
    limit,
    (context, error) =>
      writeErrorLog("toolify-errors.jsonl", context, error),
  );

  const stats = await importProducts(products, {
    dryRun,
    onProductError: (product, error) =>
      writeErrorLog(
        "toolify-errors.jsonl",
        { name: product.name, source_url: product.source_url },
        error,
      ),
  });

  console.log(JSON.stringify(stats, null, 2));
}

main().catch(async (error: unknown) => {
  await writeErrorLog("toolify-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
