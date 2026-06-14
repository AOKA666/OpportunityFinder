import assert from "node:assert/strict";
import test from "node:test";

import {
  clusterOpportunitySources,
  type OpportunitySource,
} from "../lib/ai/generate-opportunities";
import { renderOpportunitiesMarkdown } from "../lib/opportunities/export-markdown";
import type { OpportunityCard } from "../lib/types/product";

function source(
  id: string,
  name: string,
  input: string,
  output: string,
): OpportunitySource {
  return {
    product: {
      id,
      name,
      domain: `${name.toLowerCase().replaceAll(" ", "")}.example`,
      website_url: null,
      tagline: null,
      description: null,
      logo_url: null,
      pricing_type: null,
      first_seen_at: "",
      last_seen_at: "",
      product_scale: "micro_tool",
      is_blocked: false,
      block_reason: null,
      created_at: "",
      updated_at: "",
    },
    pattern: {
      id: `pattern-${id}`,
      product_id: id,
      input_type: input,
      output_type: output,
      target_user: "solo founder",
      job_to_be_done: "process the supplied input",
      product_format: "report tool",
      mvp_complexity: "medium",
      cultural_dependency: "low",
      solo_founder_fit: "good",
      seo_potential: "high",
      standalone_potential: "high",
      reason_summary: "",
      pass_reasons: [],
      tags: [],
      created_at: "",
    },
    review: null,
    ranking: null,
  };
}

test("clusters only patterns supported by multiple products", () => {
  const clusters = clusterOpportunitySources([
    source("1", "Landing Lens", "website screenshot", "diagnosis report"),
    source("2", "Page Doctor", "website URL", "repair suggestions"),
    source("3", "Solo Tool", "audio", "transcript"),
  ]);

  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].sources.length, 2);
});

test("exports complete opportunity cards as markdown", () => {
  const opportunity = {
    id: "opportunity-1",
    title: "Landing Page Evidence Report",
    description: "Diagnose conversion issues from a screenshot.",
    source_product_ids: ["1", "2"],
    main_keyword: "landing page audit",
    long_tail_keywords: ["landing page screenshot audit"],
    competitor_urls: ["https://example.com"],
    mvp_summary: "Upload, analyze, and save a report.",
    founder_fit_summary: "A focused workflow with a small implementation surface.",
    standalone_score: 85,
    founder_fit_score: 90,
    buildability_score: 80,
    verdict: "build",
    risk_summary: "Recommendations need credible evidence.",
    created_at: "",
    inspired_by: [
      { id: "1", name: "Landing Lens", domain: "landinglens.example" },
    ],
  } satisfies OpportunityCard;

  const markdown = renderOpportunitiesMarkdown([opportunity]);
  assert.match(markdown, /Landing Page Evidence Report/);
  assert.match(markdown, /Why It Fits a Solo Founder/);
  assert.match(markdown, /landinglens\.example/);
});
