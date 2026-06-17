import Link from "next/link";

import { getLocale, localizeValue, pick } from "@/lib/i18n";
import { loadOpportunityCards } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const locale = await getLocale();
  let opportunities;

  try {
    opportunities = await loadOpportunityCards(locale);
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm">
          {error instanceof Error
            ? error.message
            : pick(locale, "Unable to load opportunities.", "无法加载机会。")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="border-b border-slate-900/15 pb-7">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-800">
          {pick(locale, "Traceable directions", "可追溯的机会方向")}
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
          {pick(locale, "Opportunity cards", "机会卡片")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {pick(
            locale,
            "Adjacent niche directions generated from reviewed product patterns, not free-form idea prompts.",
            "基于已审核产品模式生成的相邻细分方向，而不是脱离证据的自由创意。",
          )}
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {opportunities.map((opportunity) => (
          <article
            key={opportunity.id}
            className="flex flex-col rounded-3xl border border-slate-900/10 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-800">
                  {localizeValue(
                    locale,
                    opportunity.verdict ?? "unrated",
                  )}
                </span>
                <h2 className="mt-2 font-serif text-3xl">
                  {opportunity.title}
                </h2>
              </div>
              <div className="rounded-2xl bg-[#d9ff62] px-4 py-3 text-center text-[#132a24]">
                <span className="block font-mono text-[9px] uppercase">
                  {pick(locale, "Standalone", "独立产品")}
                </span>
                <strong className="text-xl">
                  {opportunity.standalone_score ?? "-"}
                </strong>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {opportunity.description}
            </p>

            <dl className="mt-5 grid gap-4 rounded-2xl bg-stone-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  {pick(locale, "Founder fit", "开发者适配")}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {opportunity.founder_fit_score ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  {pick(locale, "Buildability", "可开发性")}
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {opportunity.buildability_score ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  {pick(locale, "Main keyword", "主关键词")}
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {opportunity.main_keyword ?? "-"}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {pick(locale, "MVP", "最小可行产品")}
              </h3>
              <p className="mt-2 text-sm leading-6">
                {opportunity.mvp_summary ?? "-"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {pick(
                  locale,
                  "Why it fits a solo founder",
                  "为什么适合独立开发者",
                )}
              </h3>
              <p className="mt-2 text-sm leading-6">
                {opportunity.founder_fit_summary ?? "-"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {pick(locale, "Inspired by", "灵感来源")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {opportunity.inspired_by.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:border-emerald-700"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {pick(locale, "Long-tail keywords", "长尾关键词")}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {opportunity.long_tail_keywords?.join(" · ") || "-"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {pick(locale, "Competitors", "竞品")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {opportunity.competitor_urls?.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-full truncate rounded-full border border-slate-200 px-3 py-1 text-xs hover:border-emerald-700"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-5">
              <p className="border-l-2 border-rose-300 pl-3 text-sm text-slate-600">
                {opportunity.risk_summary ??
                  pick(
                    locale,
                    "No risk summary generated.",
                    "尚未生成风险摘要。",
                  )}
              </p>
            </div>
          </article>
        ))}
      </div>

      {opportunities.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="font-serif text-2xl">
            {pick(locale, "No opportunity cards yet", "暂无机会卡片")}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {pick(
              locale,
              "Review products, then run the opportunity generation script for English cards.",
              "当前还没有中文机会卡片，请点击上方“生成机会”创建中文内容。",
            )}
          </p>
        </div>
      )}
    </main>
  );
}
