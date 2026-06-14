import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ProductScale } from "@/lib/types/database";

export const productPatternSchema = z.object({
  input_type: z.string(),
  output_type: z.string(),
  target_user: z.string(),
  job_to_be_done: z.string(),
  product_format: z.string(),
  mvp_complexity: z.enum(["low", "medium", "high"]),
  cultural_dependency: z.enum(["low", "medium", "high"]),
  solo_founder_fit: z.enum(["good", "maybe", "bad"]),
  seo_potential: z.enum(["high", "medium", "low"]),
  standalone_potential: z.enum(["high", "medium", "low"]),
  reason_summary: z.string(),
  pass_reasons: z.array(z.string()),
  tags: z.array(z.string()),
});

export type ExtractedProductPattern = z.infer<typeof productPatternSchema>;

export interface ProductPatternInput {
  name: string;
  domain: string | null;
  website_url: string | null;
  tagline: string | null;
  description: string | null;
  product_scale: ProductScale | null;
  category: string | null;
}

const SYSTEM_PROMPT = `You evaluate products only as source material for adjacent, SEO-driven niche tools that a solo developer could build.

You are not judging whether the original product is popular or successful.

Mark solo_founder_fit as good or maybe when:
- the input-output flow and single task are clear
- an upload, URL, screenshot, or text input leads to analysis, repair suggestions, or structured output
- the product does not require complex B2B sales, a large proprietary dataset, heavy human service, or US-local cultural knowledge
- a useful MVP is plausible in 7-14 days
- SEO acquisition and a standalone niche website are plausible

Mark it bad and explain pass_reasons for:
- ecommerce, affiliate, overseas creator/media products, career/job/interview, education/exam, legal/tax/medical
- enterprise sales, CRM, HR, generic chatbots/platforms, agencies, content media, or marketplaces
- big-site inner-page-only tools
- tiny one-time utilities with no meaningful report or result page

Never reward popularity by itself. Large platforms such as ChatGPT, Canva, Adobe, Notion, and Figma are bad inspiration for this purpose.
PDF page checkers, SVG viewBox helpers, HTTP header parsers, favicon snippet generators, and similar toolbox buttons must not receive high standalone_potential.

Keep text fields concise and concrete. Use lowercase, reusable tags.`;

let openaiClient: OpenAI | undefined;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Configure it before extracting product patterns.",
    );
  }

  openaiClient ??= new OpenAI({ apiKey });
  return openaiClient;
}

export function buildProductPatternPrompt(input: ProductPatternInput): string {
  return `Analyze this product:
${JSON.stringify(input, null, 2)}

Return the product pattern fields. Base the answer only on the supplied evidence. When evidence is weak, choose conservative ratings and mention the uncertainty in reason_summary.`;
}

export async function extractProductPattern(
  input: ProductPatternInput,
): Promise<ExtractedProductPattern> {
  const response = await getOpenAIClient().responses.parse({
    model: "gpt-5.4-mini",
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildProductPatternPrompt(input) },
    ],
    text: {
      format: zodTextFormat(productPatternSchema, "product_pattern"),
    },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI returned no parsed product pattern");
  }

  return response.output_parsed;
}
