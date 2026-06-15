import "./load-env";

import { createSupabaseServiceClient } from "../lib/supabase/server";
import type { Insert } from "../lib/types/database";

const sources: Insert<"ranking_sources">[] = [
  {
    name: "Product Hunt",
    base_url: "https://www.producthunt.com",
    source_type: "api",
  },
  {
    name: "Toolify",
    base_url: "https://www.toolify.ai",
    source_type: "listing",
  },
  {
    name: "Futurepedia",
    base_url: "https://www.futurepedia.io",
    source_type: "listing",
  },
];

async function main() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ranking_sources")
    .upsert(sources, { onConflict: "name" })
    .select("name");

  if (error) {
    throw new Error(`Unable to seed ranking sources: ${error.message}`);
  }

  console.log(`Seeded ${data.length} ranking sources:`);
  for (const source of data) {
    console.log(`- ${source.name}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
