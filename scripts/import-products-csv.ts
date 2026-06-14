import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";

import type { RawProductInput } from "../lib/normalizers/normalize-product";
import { parseCommonArgs } from "../lib/scrapers/args";
import { writeErrorLog } from "../lib/scrapers/error-log";
import { importProducts } from "../lib/scrapers/import-products";

interface CsvRow extends Record<string, string | undefined> {
  source_name?: string;
  name?: string;
  website_url?: string;
  tagline?: string;
  description?: string;
  category?: string;
  tags?: string;
  rank_position?: string;
  source_url?: string;
}

function parseArgs(argv: string[]) {
  const common = parseCommonArgs(argv, { limit: Number.MAX_SAFE_INTEGER });
  let file = "data/sample-products.csv";

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--file") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--file requires a path");
      }
      file = value;
      index += 1;
    }
  }

  return { ...common, file };
}

function toOptionalNumber(value?: string): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid rank_position: ${value}`);
  }
  return parsed;
}

async function main() {
  const { limit, dryRun, file } = parseArgs(process.argv.slice(2));
  const absolutePath = path.resolve(process.cwd(), file);
  const csv = await readFile(absolutePath, "utf8");
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const products: RawProductInput[] = rows.slice(0, limit).map((row, index) => {
    if (!row.source_name || !row.name) {
      throw new Error(
        `CSV row ${index + 2} must include source_name and name`,
      );
    }

    return {
      source_name: row.source_name,
      name: row.name,
      website_url: row.website_url,
      tagline: row.tagline,
      description: row.description,
      category: row.category,
      tags: row.tags,
      rank_position: toOptionalNumber(row.rank_position),
      source_url: row.source_url,
      list_name: row.category,
      list_type: "csv",
      raw_data: row,
    };
  });

  const stats = await importProducts(products, {
    dryRun,
    onProductError: (product, error) =>
      writeErrorLog(
        "import-errors.jsonl",
        { file: absolutePath, name: product.name },
        error,
      ),
  });

  console.log(JSON.stringify(stats, null, 2));
}

main().catch(async (error: unknown) => {
  await writeErrorLog("import-errors.jsonl", { scope: "script" }, error);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
