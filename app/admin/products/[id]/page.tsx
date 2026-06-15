import Link from "next/link";
import { notFound } from "next/navigation";

import { saveReviewLabel } from "@/app/admin/actions";
import {
  getLocale,
  localizeValue,
  pick,
  type Locale,
} from "@/lib/i18n";
import { loadProductDetail } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-slate-800">
        {children || "-"}
      </dd>
    </div>
  );
}

function patternLabel(locale: Locale, value: string | null) {
  return localizeValue(locale, value);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  let product;

  try {
    product = await loadProductDetail(id);
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm">
          {error instanceof Error
            ? error.message
            : pick(locale, "Unable to load product.", "无法加载产品。")}
        </p>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  const latestPattern = product.patterns[0];
  const latestReview = product.reviews[0];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <Link
        href="/admin/products"
        className="text-sm text-emerald-800 hover:underline"
      >
        {pick(locale, "<- Back to products", "<- 返回产品列表")}
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-[#132a24] p-7 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
              {product.product_scale
                ? localizeValue(locale, product.product_scale)
                : pick(locale, "Unclassified", "未分类")}
            </p>
            <h1 className="mt-3 font-serif text-4xl">{product.name}</h1>
            <p className="mt-3 max-w-3xl text-lg leading-7 text-emerald-50/80">
              {product.tagline ??
                pick(locale, "No tagline collected.", "未采集到产品标语。")}
            </p>
            {product.website_url && (
              <a
                href={product.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-full bg-[#d9ff62] px-4 py-2 text-sm font-semibold text-[#132a24]"
              >
                {pick(
                  locale,
                  `Visit ${product.domain}`,
                  `访问 ${product.domain}`,
                )}
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">
              {pick(locale, "Product evidence", "产品证据")}
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={pick(locale, "Domain", "域名")}>
                {product.domain}
              </Field>
              <Field label={pick(locale, "First seen", "首次发现")}>
                {new Date(product.first_seen_at).toLocaleDateString(
                  locale === "zh" ? "zh-CN" : "en-US",
                )}
              </Field>
              <Field label={pick(locale, "Description", "描述")}>
                {product.description}
              </Field>
              <Field label={pick(locale, "Blocked", "已屏蔽")}>
                {product.is_blocked
                  ? product.block_reason ?? pick(locale, "Yes", "是")
                  : pick(locale, "No", "否")}
              </Field>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">
              {pick(locale, "AI pattern", "AI 产品模式")}
            </h2>
            {latestPattern ? (
              <>
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label={pick(locale, "Input", "输入")}>
                    {latestPattern.input_type}
                  </Field>
                  <Field label={pick(locale, "Output", "输出")}>
                    {latestPattern.output_type}
                  </Field>
                  <Field label={pick(locale, "Target user", "目标用户")}>
                    {latestPattern.target_user}
                  </Field>
                  <Field label={pick(locale, "Job to be done", "待完成任务")}>
                    {latestPattern.job_to_be_done}
                  </Field>
                  <Field label={pick(locale, "Product format", "产品形式")}>
                    {latestPattern.product_format}
                  </Field>
                  <Field label={pick(locale, "MVP complexity", "MVP 复杂度")}>
                    {patternLabel(locale, latestPattern.mvp_complexity)}
                  </Field>
                  <Field
                    label={pick(locale, "Cultural dependency", "文化依赖度")}
                  >
                    {patternLabel(locale, latestPattern.cultural_dependency)}
                  </Field>
                  <Field
                    label={pick(locale, "Solo founder fit", "独立开发者适配")}
                  >
                    {patternLabel(locale, latestPattern.solo_founder_fit)}
                  </Field>
                  <Field label={pick(locale, "SEO potential", "SEO 潜力")}>
                    {patternLabel(locale, latestPattern.seo_potential)}
                  </Field>
                  <Field
                    label={pick(
                      locale,
                      "Standalone potential",
                      "独立产品潜力",
                    )}
                  >
                    {patternLabel(locale, latestPattern.standalone_potential)}
                  </Field>
                </dl>
                <p className="mt-6 border-l-2 border-lime-400 pl-4 text-sm leading-6 text-slate-700">
                  {latestPattern.reason_summary}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                {pick(
                  locale,
                  "No AI pattern has been generated.",
                  "尚未生成 AI 产品模式。",
                )}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">
              {pick(locale, "Ranking history", "榜单历史")}
            </h2>
            <div className="mt-5 space-y-4">
              {product.rankings.map((ranking) => (
                <article
                  key={ranking.id}
                  className="rounded-xl bg-stone-50 p-4 text-sm"
                >
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <strong>{ranking.source_name}</strong>
                    <span>
                      {ranking.category ??
                        pick(locale, "Uncategorized", "未分类")}
                    </span>
                    <span>
                      {pick(locale, "Rank", "排名")}{" "}
                      {ranking.rank_position ?? "-"}
                    </span>
                    <span>
                      {ranking.upvotes ?? 0} {pick(locale, "votes", "票")}
                    </span>
                    <span>{ranking.snapshot_date}</span>
                  </div>
                  {ranking.raw_data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-slate-500">
                        {pick(locale, "Raw data", "原始数据")}
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                        {JSON.stringify(ranking.raw_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside>
          <form
            action={saveReviewLabel}
            className="sticky top-6 rounded-3xl border border-slate-900/10 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="product_id" value={product.id} />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
              {pick(locale, "Manual review", "人工审核")}
            </p>
            <p className="mt-3 text-sm">
              {pick(locale, "Current", "当前状态")}:{" "}
              <strong>
                {localizeValue(
                  locale,
                  latestReview?.status ?? "unreviewed",
                )}
              </strong>
            </p>
            <label className="mt-5 block text-sm font-medium">
              {pick(locale, "Review note", "审核备注")}
              <textarea
                name="note"
                defaultValue={latestReview?.note ?? ""}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 p-3 text-sm"
                placeholder={pick(
                  locale,
                  "Why is this signal worth keeping or passing?",
                  "为什么这个产品信号值得保留或跳过？",
                )}
              />
            </label>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["keep", "watch", "pass"] as const).map((status) => (
                <button
                  key={status}
                  name="status"
                  value={status}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-emerald-700 hover:text-emerald-800"
                >
                  {localizeValue(locale, status)}
                </button>
              ))}
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}
