import "dotenv/config";

import { parseCommonArgs } from "../lib/scrapers/args";
import { writeErrorLog } from "../lib/scrapers/error-log";
import { importProducts } from "../lib/scrapers/import-products";
import { fetchListingSiteProducts } from "../lib/scrapers/listing-site";

const BASE_URL = "https://www.futurepedia.io";
const CATEGORIES = [
  ["AI Image Tools", "/ai-tools/image-generators"],
  ["AI Productivity Tools", "/ai-tools/productivity"],
  ["Automation Tools", "/ai-tools/automations"],
  ["Developer/coding tools", "/ai-tools/code-assistant"],
  ["Design tools", "/ai-tools/design-and-creative"],
  ["Document transformation", "/ai-tools/summarizer"],
] as const;

async function main() {
  const { limit, dryRun } = parseCommonArgs(process.argv.slice(2), {
    limit: 100,
  });
  const products = await fetchListingSiteProducts(
    {
      sourceName: "Futurepedia",
      baseUrl: BASE_URL,
      categoryUrls: CATEGORIES.map(([name, path]) => ({
        name,
        url: new URL(path, BASE_URL).toString(),
      })),
      toolPathPattern: /^\/tool\//,
      excludedExternalDomains: [
        "discord.gg",
        "facebook.com",
        "hubspot.com",
        "instagram.com",
        "linkedin.com",
        "reddit.com",
        "tiktok.com",
        "x.com",
        "youtube.com",
      ],
    },
    limit,
    (context, error) =>
      writeErrorLog("futurepedia-errors.jsonl", context, error),
  );

  const stats = await importProducts(products, {
    dryRun,
    onProductError: (product, error) =>
      writeErrorLog(
        "futurepedia-errors.jsonl",
        { name: product.name, source_url: product.source_url },
        error,
      ),
  });

  console.log(JSON.stringify(stats, null, 2));
}

main().catch(async (error: unknown) => {
  await writeErrorLog("futurepedia-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
