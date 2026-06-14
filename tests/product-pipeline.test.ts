import assert from "node:assert/strict";
import test from "node:test";

import { filterForIndieFit } from "../lib/filters/indie-fit-filter";
import { normalizeProductInput } from "../lib/normalizers/product-input";
import { areNamesSimilar } from "../lib/scrapers/import-products";

test("normalizes URLs, tags, and product names", () => {
  const product = normalizeProductInput({
    source_name: "Test",
    name: "  Screenshot Auditor AI  ",
    website_url: "example.com/report/?utm_source=listing#demo",
    tagline: " Diagnose a landing page ",
    tags: "SEO, Website;Audit",
  });

  assert.equal(product.name, "Screenshot Auditor AI");
  assert.equal(product.normalized_name, "screenshotauditorai");
  assert.equal(product.website_url, "https://example.com/report");
  assert.equal(product.domain, "example.com");
  assert.deepEqual(product.tags, ["seo", "website", "audit"]);
});

test("blocks large platforms and unsuitable categories", () => {
  const blocked = normalizeProductInput({
    source_name: "Test",
    name: "Canva",
    website_url: "https://www.canva.com/ai",
  });
  const education = normalizeProductInput({
    source_name: "Test",
    name: "Exam Helper",
    website_url: "https://exam-helper.example",
    category: "Education",
  });

  assert.equal(filterForIndieFit(blocked).reason, "blocked_domain");
  assert.equal(filterForIndieFit(education).reason, "forbidden_category");
});

test("keeps focused report-producing tools", () => {
  const product = normalizeProductInput({
    source_name: "Test",
    name: "Landing Page Screenshot Auditor",
    website_url: "https://landing-audit.example",
    tagline: "Upload a screenshot and receive a structured conversion report",
    category: "Website tools",
  });

  assert.equal(filterForIndieFit(product).keep, true);
  assert.equal(product.product_scale, "micro_tool");
});

test("detects close product-name duplicates", () => {
  assert.equal(
    areNamesSimilar("screenshotauditor", "screenshot-auditor".replace("-", "")),
    true,
  );
  assert.equal(areNamesSimilar("screenshotauditor", "imagegenerator"), false);
});
