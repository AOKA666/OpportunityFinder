import type { ProductScale } from "@/lib/types/database";

export interface ScaleInput {
  name: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
}

const SCALE_RULES: Array<{ scale: ProductScale; pattern: RegExp }> = [
  {
    scale: "agency_service",
    pattern: /\b(agency|consulting|done[- ]for[- ]you|managed service)\b/i,
  },
  {
    scale: "marketplace",
    pattern: /\b(marketplace|hire (?:experts|talent)|buyers and sellers)\b/i,
  },
  {
    scale: "content_media",
    pattern: /\b(news|newsletter|directory|blog|podcast|media publication)\b/i,
  },
  {
    scale: "generic_chatbot_platform",
    pattern:
      /\b(chatbot platform|build (?:an |your )?(?:ai )?(?:assistant|chatbot)|ai agents? platform)\b/i,
  },
  {
    scale: "enterprise_saas",
    pattern:
      /\b(enterprise|sales team|revenue operations|workforce|contact center|compliance platform)\b/i,
  },
  {
    scale: "platform",
    pattern:
      /\b(all[- ]in[- ]one|operating system|complete platform|end[- ]to[- ]end|suite for)\b/i,
  },
  {
    scale: "browser_extension",
    pattern: /\b(browser|chrome|firefox|safari|edge) extension\b/i,
  },
  {
    scale: "template_tool",
    pattern: /\b(template|boilerplate|starter kit|generator)\b/i,
  },
  {
    scale: "micro_tool",
    pattern:
      /\b(checker|analyzer|converter|formatter|validator|calculator|grader|auditor|scanner)\b/i,
  },
  {
    scale: "single-purpose_site",
    pattern:
      /\b(upload|screenshot|paste|summarize|remove|resize|enhance|diagnose|transform)\b/i,
  },
];

export function classifyProductScale(input: ScaleInput): ProductScale {
  const haystack = [
    input.name,
    input.tagline,
    input.description,
    input.category,
    input.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    SCALE_RULES.find(({ pattern }) => pattern.test(haystack))?.scale ??
    "small_saas"
  );
}

export const ALLOWED_PRODUCT_SCALES = new Set<ProductScale>([
  "micro_tool",
  "single-purpose_site",
  "browser_extension",
  "template_tool",
  "small_saas",
]);

export function isAllowedProductScale(scale: ProductScale): boolean {
  return ALLOWED_PRODUCT_SCALES.has(scale);
}
