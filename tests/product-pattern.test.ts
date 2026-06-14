import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProductPatternPrompt,
  productPatternSchema,
} from "../lib/ai/extract-product-pattern";

const validPattern = {
  input_type: "landing page screenshot",
  output_type: "prioritized conversion report",
  target_user: "solo founder",
  job_to_be_done: "find landing page conversion issues",
  product_format: "single-purpose web app",
  mvp_complexity: "medium",
  cultural_dependency: "low",
  solo_founder_fit: "good",
  seo_potential: "high",
  standalone_potential: "high",
  reason_summary: "Clear screenshot-to-report flow with reusable results.",
  pass_reasons: [],
  tags: ["screenshot-analysis", "conversion-report"],
};

test("accepts the strict product pattern contract", () => {
  assert.deepEqual(productPatternSchema.parse(validPattern), validPattern);
});

test("rejects values outside the allowed enums", () => {
  assert.throws(() =>
    productPatternSchema.parse({
      ...validPattern,
      solo_founder_fit: "excellent",
    }),
  );
});

test("includes all supplied product evidence in the prompt", () => {
  const prompt = buildProductPatternPrompt({
    name: "Landing Lens",
    domain: "landinglens.example",
    website_url: "https://landinglens.example",
    tagline: "Screenshot to report",
    description: "Find conversion issues",
    product_scale: "micro_tool",
    category: "Design tools",
  });

  assert.match(prompt, /Landing Lens/);
  assert.match(prompt, /Design tools/);
  assert.match(prompt, /micro_tool/);
});
