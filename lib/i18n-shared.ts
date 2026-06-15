export type Locale = "en" | "zh";

export const LOCALE_COOKIE = "opportunity-locale";

export function pick<T>(locale: Locale, english: T, chinese: T): T {
  return locale === "zh" ? chinese : english;
}

const VALUE_LABELS: Record<string, [string, string]> = {
  agency_service: ["agency service", "代理服务"],
  bad: ["bad", "不适合"],
  browser_extension: ["browser extension", "浏览器扩展"],
  build: ["build", "值得开发"],
  content_media: ["content media", "内容媒体"],
  enterprise_saas: ["enterprise SaaS", "企业 SaaS"],
  generic_chatbot_platform: ["generic chatbot platform", "通用聊天机器人平台"],
  good: ["good", "适合"],
  high: ["high", "高"],
  keep: ["keep", "保留"],
  low: ["low", "低"],
  marketplace: ["marketplace", "市场平台"],
  maybe: ["maybe", "可能适合"],
  medium: ["medium", "中"],
  micro_tool: ["micro tool", "微型工具"],
  pass: ["pass", "跳过"],
  platform: ["platform", "平台"],
  "single-purpose_site": ["single-purpose site", "单一用途网站"],
  small_saas: ["small SaaS", "小型 SaaS"],
  template_tool: ["template tool", "模板工具"],
  unrated: ["unrated", "未评分"],
  unreviewed: ["unreviewed", "未审核"],
  watch: ["watch", "观察"],
};

export function localizeValue(
  locale: Locale,
  value: string | null | undefined,
  fallback = "-",
): string {
  if (!value) {
    return fallback;
  }

  const labels = VALUE_LABELS[value];
  if (labels) {
    return locale === "zh" ? labels[1] : labels[0];
  }

  return value.replaceAll("_", " ");
}
