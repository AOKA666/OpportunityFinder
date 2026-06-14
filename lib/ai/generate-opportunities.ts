import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getOpenAIClient } from "@/lib/ai/client";
import type { ProductPattern, ReviewLabel } from "@/lib/types/product";
import type { Product, ProductRanking } from "@/lib/types/product";

export interface OpportunitySource {
  product: Product;
  pattern: ProductPattern;
  review: ReviewLabel | null;
  ranking: ProductRanking | null;
}

export interface OpportunityCluster {
  key: string;
  label: string;
  sources: OpportunitySource[];
}

const opportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  source_product_ids: z.array(z.string()).min(2),
  main_keyword: z.string(),
  long_tail_keywords: z.array(z.string()).min(2),
  competitor_urls: z.array(z.string()),
  mvp_summary: z.string(),
  founder_fit_summary: z.string(),
  standalone_score: z.number().int().min(0).max(100),
  founder_fit_score: z.number().int().min(0).max(100),
  buildability_score: z.number().int().min(0).max(100),
  verdict: z.enum(["build", "watch", "pass"]),
  risk_summary: z.string(),
});

export type GeneratedOpportunity = z.infer<typeof opportunitySchema>;

const FORBIDDEN_OPPORTUNITY_PATTERN =
  /\b(affiliate|career|chatbot|e-?commerce|exam|generic ai writer|homeschool|interview|job|legal|medical|pdf (?:tool|utility|converter)|tax)\b/i;

const CLUSTER_RULES = [
  {
    key: "url-diagnosis",
    label: "URL or screenshot to diagnosis and repair suggestions",
    pattern: /\b(url|website|landing page|repository)\b.*\b(audit|diagnos\w*|repair|suggest)\b|\b(audit|diagnos\w*|repair|suggest)\b.*\b(url|website|landing page|repository)\b/i,
  },
  {
    key: "image-report",
    label: "Upload image or screenshot to analysis and personalized report",
    pattern: /\b(image|photo|screenshot)\b.*\b(advice|analysis|diagnos\w*|report)\b|\b(advice|analysis|diagnos\w*|report)\b.*\b(image|photo|screenshot)\b/i,
  },
  {
    key: "text-structured",
    label: "Text or document to structured output",
    pattern: /\b(text|document|notes|prompt)\b.*\b(structur|summar|transform|report)\b/i,
  },
  {
    key: "developer-tool",
    label: "Standalone developer decision tool",
    pattern: /\b(code|developer|repository|schema|sql|api|documentation)\b/i,
  },
  {
    key: "website-seo",
    label: "Website and SEO decision tool",
    pattern: /\b(website|seo|landing page|conversion|accessibility)\b/i,
  },
  {
    key: "product-research",
    label: "Product research for solo founders",
    pattern: /\b(competitor|founder|market|opportunity|product research)\b/i,
  },
] as const;

function sourceText(source: OpportunitySource): string {
  return [
    source.product.name,
    source.product.tagline,
    source.product.description,
    source.product.product_scale,
    source.pattern.input_type,
    source.pattern.output_type,
    source.pattern.job_to_be_done,
    source.pattern.product_format,
    source.pattern.tags?.join(" "),
    source.ranking?.category,
  ]
    .filter(Boolean)
    .join(" ");
}

export function clusterOpportunitySources(
  sources: OpportunitySource[],
): OpportunityCluster[] {
  const clusters = new Map<string, OpportunityCluster>();

  for (const source of sources) {
    const text = sourceText(source);
    const rule = CLUSTER_RULES.find((candidate) => candidate.pattern.test(text));
    const key = rule?.key ?? "other-niche-flow";
    const label = rule?.label ?? "Other focused input-output niche tools";
    const cluster = clusters.get(key) ?? { key, label, sources: [] };
    cluster.sources.push(source);
    clusters.set(key, cluster);
  }

  return [...clusters.values()]
    .filter((cluster) => cluster.sources.length >= 2)
    .sort((left, right) => right.sources.length - left.sources.length);
}

function buildPrompt(clusters: OpportunityCluster[], limit: number): string {
  const evidence = clusters.map((cluster) => ({
    cluster: cluster.label,
    products: cluster.sources.map(({ product, pattern, ranking, review }) => ({
      id: product.id,
      name: product.name,
      domain: product.domain,
      website_url: product.website_url,
      category: ranking?.category,
      review_status: review?.status,
      pattern: {
        input_type: pattern.input_type,
        output_type: pattern.output_type,
        target_user: pattern.target_user,
        job_to_be_done: pattern.job_to_be_done,
        product_format: pattern.product_format,
        tags: pattern.tags,
      },
    })),
  }));

  return `Generate at most ${limit} adjacent product opportunities from these real product clusters:
${JSON.stringify(evidence, null, 2)}

Rules:
- Every opportunity must cite at least two source_product_ids from one supplied cluster.
- Derive an adjacent niche direction; do not clone a source product.
- Favor upload/image to analysis and report, URL/screenshot diagnosis, text to structured output, standalone developer tools, website/SEO decisions, and product research for solo founders.
- Include a meaningful result or report page and an MVP buildable by one developer in 7-14 days.
- Explain why the direction suits a solo founder and state concrete risks.
- Competitor URLs must come from the supplied products when relevant. Do not invent URLs.
- Never generate PDF small utilities, career/interview/job, exam/study/homeschool, ecommerce, affiliate, overseas creator/media, legal/tax/medical, generic chatbot, generic AI writer, toolbox button utilities, or enterprise SaaS requiring complex sales.
- Avoid ideas that provide one tiny answer with no durable result page.
- Use conservative scores. Set verdict to pass when the evidence does not support a credible standalone opportunity.`;
}

export async function generateOpportunitiesFromClusters(
  clusters: OpportunityCluster[],
  limit: number,
): Promise<GeneratedOpportunity[]> {
  if (clusters.length === 0) {
    return [];
  }

  const responseSchema = z.object({
    opportunities: z.array(opportunitySchema).max(limit),
  });
  const response = await getOpenAIClient().responses.parse({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content:
          "You are a conservative product researcher. Generate only traceable opportunities supported by the supplied product clusters.",
      },
      { role: "user", content: buildPrompt(clusters, limit) },
    ],
    text: {
      format: zodTextFormat(responseSchema, "opportunity_batch"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no parsed opportunities");
  }

  const allowedIds = new Set(
    clusters.flatMap((cluster) =>
      cluster.sources.map((source) => source.product.id),
    ),
  );
  for (const opportunity of response.output_parsed.opportunities) {
    if (
      opportunity.source_product_ids.some((id) => !allowedIds.has(id)) ||
      new Set(opportunity.source_product_ids).size < 2
    ) {
      throw new Error(
        `Opportunity "${opportunity.title}" contains invalid source products`,
      );
    }

    const text = [
      opportunity.title,
      opportunity.description,
      opportunity.main_keyword,
      opportunity.mvp_summary,
      opportunity.long_tail_keywords.join(" "),
    ].join(" ");
    if (FORBIDDEN_OPPORTUNITY_PATTERN.test(text)) {
      throw new Error(
        `Opportunity "${opportunity.title}" matches a forbidden category`,
      );
    }
  }

  return response.output_parsed.opportunities;
}
