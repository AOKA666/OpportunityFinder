import "./load-env";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { renderOpportunitiesMarkdown } from "../lib/opportunities/export-markdown";
import { loadOpportunityCards } from "../lib/supabase/admin-data";

async function main() {
  const opportunities = await loadOpportunityCards();
  const exportsDirectory = path.resolve(process.cwd(), "exports");
  const outputPath = path.join(exportsDirectory, "opportunities.md");

  await mkdir(exportsDirectory, { recursive: true });
  await writeFile(
    outputPath,
    renderOpportunitiesMarkdown(opportunities),
    "utf8",
  );

  console.log(`Exported ${opportunities.length} opportunities to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
