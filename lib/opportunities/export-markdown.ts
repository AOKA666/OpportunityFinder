import type { OpportunityCard } from "@/lib/types/product";

function list(items: string[] | null): string {
  if (!items?.length) {
    return "- None";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

export function renderOpportunitiesMarkdown(
  opportunities: OpportunityCard[],
): string {
  const generatedAt = new Date().toISOString();
  const sections = opportunities.map((opportunity, index) => {
    const inspiredBy =
      opportunity.inspired_by.length > 0
        ? opportunity.inspired_by
            .map(
              (product) =>
                `- ${product.name}${product.domain ? ` (${product.domain})` : ""}`,
            )
            .join("\n")
        : "- None";

    return `## ${index + 1}. ${opportunity.title}

**Verdict:** ${opportunity.verdict ?? "unrated"}  
**Main keyword:** ${opportunity.main_keyword ?? "Not set"}  
**Scores:** Standalone ${opportunity.standalone_score ?? "—"} / Founder fit ${opportunity.founder_fit_score ?? "—"} / Buildability ${opportunity.buildability_score ?? "—"}

${opportunity.description ?? ""}

### Inspired By

${inspiredBy}

### Long-Tail Keywords

${list(opportunity.long_tail_keywords)}

### Competitors

${list(opportunity.competitor_urls)}

### MVP

${opportunity.mvp_summary ?? "Not provided."}

### Why It Fits a Solo Founder

${opportunity.founder_fit_summary ?? "Not provided."}

### Risks

${opportunity.risk_summary ?? "Not provided."}`;
  });

  return `# Product Opportunities

Generated: ${generatedAt}

${sections.length > 0 ? sections.join("\n\n---\n\n") : "_No opportunities generated yet._"}
`;
}
