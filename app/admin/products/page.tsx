import Link from "next/link";

import { saveReviewLabel } from "@/app/admin/actions";
import { getLocale, localizeValue, pick } from "@/lib/i18n";
import { loadProductList } from "@/lib/supabase/admin-data";
import type {
  FounderFit,
  Potential,
  ReviewStatus,
} from "@/lib/types/database";
import type { ProductListItem } from "@/lib/types/product";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 50;

const FILTERS = [
  "source",
  "category",
  "product_scale",
  "solo_founder_fit",
  "seo_potential",
  "standalone_potential",
  "review_status",
] as const;

type BadgeTone = "emerald" | "rose" | "slate" | "amber";

const BADGE_CLASSES: Record<BadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

function SignalBadge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-7 w-[92px] items-center justify-center gap-1.5 truncate rounded-md border px-2 text-[11px] font-semibold ${BADGE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

function founderTone(value: FounderFit | null | undefined): BadgeTone {
  if (value === "good") return "emerald";
  if (value === "maybe") return "amber";
  if (value === "bad") return "rose";
  return "slate";
}

function potentialTone(value: Potential | null | undefined): BadgeTone {
  if (value === "high") return "emerald";
  if (value === "medium") return "amber";
  if (value === "low") return "rose";
  return "slate";
}

function reviewTone(value: ReviewStatus | "unreviewed"): BadgeTone {
  if (value === "keep") return "emerald";
  if (value === "watch") return "amber";
  if (value === "pass") return "rose";
  return "slate";
}

function rowAccent(product: ProductListItem): string {
  const review = product.latest_review?.status;
  const fit = product.latest_pattern?.solo_founder_fit;

  if (review === "keep" || (!review && fit === "good")) {
    return "border-l-emerald-500";
  }
  if (review === "pass" || (!review && fit === "bad")) {
    return "border-l-rose-400";
  }
  if (review === "watch" || fit === "maybe") {
    return "border-l-amber-400";
  }
  return "border-l-slate-300";
}

function ProductMark({ name }: { name: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600"
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function valueOf(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function filterValue(product: ProductListItem, key: string): string {
  switch (key) {
    case "source":
      return product.latest_ranking?.source_name ?? "";
    case "category":
      return product.latest_ranking?.category ?? "";
    case "product_scale":
      return product.product_scale ?? "";
    case "solo_founder_fit":
      return product.latest_pattern?.solo_founder_fit ?? "";
    case "seo_potential":
      return product.latest_pattern?.seo_potential ?? "";
    case "standalone_potential":
      return product.latest_pattern?.standalone_potential ?? "";
    case "review_status":
      return product.latest_review?.status ?? "unreviewed";
    default:
      return "";
  }
}

function pageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) {
      continue;
    }
    for (const item of Array.isArray(value) ? value : [value]) {
      query.append(key, item);
    }
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const search = query.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const showAllHistory = valueOf(params, "window") === "all";
  let products: ProductListItem[];

  try {
    products = await loadProductList(showAllHistory ? null : 90);
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-800">
            {pick(locale, "Database connection required", "需要连接数据库")}
          </p>
          <h1 className="mt-3 font-serif text-3xl">
            {pick(
              locale,
              "Configure Supabase to browse products",
              "配置 Supabase 后即可浏览产品",
            )}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {error instanceof Error
              ? error.message
              : pick(locale, "Unable to load products.", "无法加载产品。")}
          </p>
        </div>
      </main>
    );
  }

  const filterTitles = {
    source: pick(locale, "Source", "来源"),
    category: pick(locale, "Category", "分类"),
    product_scale: pick(locale, "Scale", "规模"),
    solo_founder_fit: pick(locale, "Founder fit", "独立开发者适配"),
    seo_potential: "SEO",
    standalone_potential: pick(locale, "Standalone", "独立产品潜力"),
    review_status: pick(locale, "Review", "审核状态"),
  };
  const options = new Map<string, string[]>();
  for (const key of FILTERS) {
    options.set(
      key,
      [
        ...new Set(
          products.map((product) => filterValue(product, key)).filter(Boolean),
        ),
      ].sort(),
    );
  }

  const filtered = products.filter((product) =>
    FILTERS.every((key) => {
      const selected = valueOf(params, key);
      return !selected || filterValue(product, key) === selected;
    }),
  );
  const requestedPage = Number.parseInt(valueOf(params, "page"), 10);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageCount,
  );
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProducts = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-900/15 pb-7 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-800">
            {pick(locale, "Product signal review", "产品信号评估")}
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
            {pick(locale, "Ranked products", "榜单产品")}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {pick(
              locale,
              `${filtered.length} matches from ${products.length} ${showAllHistory ? "historical" : "recent"} products`,
              `${products.length} 个${showAllHistory ? "历史" : "近期"}产品中有 ${filtered.length} 个符合条件`,
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-slate-200 bg-white p-1 text-xs">
            <Link
              href="/admin/products"
              className={`rounded-full px-3 py-1.5 ${
                !showAllHistory
                  ? "bg-[#132a24] font-semibold text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {pick(locale, "Recent 90 days", "近 90 天")}
            </Link>
            <Link
              href="/admin/products?window=all"
              className={`rounded-full px-3 py-1.5 ${
                showAllHistory
                  ? "bg-[#132a24] font-semibold text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {pick(locale, "All history", "全部历史")}
            </Link>
          </div>
          <Link
            href="/admin/opportunities"
            className="rounded-full bg-[#d9ff62] px-5 py-2.5 text-sm font-semibold text-[#132a24] transition hover:bg-[#c8ef4d]"
          >
            {pick(locale, "View opportunity cards", "查看机会卡片")}
          </Link>
        </div>
      </div>

      <form className="my-6 grid gap-3 rounded-2xl border border-slate-900/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {showAllHistory && <input type="hidden" name="window" value="all" />}
        {FILTERS.map((key) => (
          <label key={key} className="text-xs font-medium text-slate-600">
            {filterTitles[key]}
            <select
              name={key}
              defaultValue={valueOf(params, key)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-stone-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">{pick(locale, "All", "全部")}</option>
              {options.get(key)?.map((value) => (
                <option key={value} value={value}>
                  {localizeValue(locale, value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end gap-2 xl:col-span-7">
          <button className="rounded-lg bg-[#132a24] px-4 py-2 text-sm font-medium text-white">
            {pick(locale, "Apply filters", "应用筛选")}
          </button>
          <Link
            href={showAllHistory ? "/admin/products?window=all" : "/admin/products"}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            {pick(locale, "Reset", "重置")}
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-900/10 bg-white shadow-sm">
        <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[190px]" />
            <col className="w-[240px]" />
            <col className="w-[115px]" />
            <col className="w-[145px]" />
            <col className="w-[115px]" />
            <col className="w-[115px]" />
            <col className="w-[95px]" />
            <col className="w-[115px]" />
            <col className="w-[110px]" />
            <col className="w-[180px]" />
          </colgroup>
          <thead className="border-b border-slate-200 bg-slate-50 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
            <tr>
              {[
                pick(locale, "Product", "产品"),
                pick(locale, "Tagline", "标语"),
                pick(locale, "Source", "来源"),
                pick(locale, "Category", "分类"),
                pick(locale, "Scale", "规模"),
                pick(locale, "Founder fit", "独立开发者适配"),
                "SEO",
                pick(locale, "Standalone", "独立产品潜力"),
                pick(locale, "Review", "审核"),
                pick(locale, "Actions", "操作"),
              ].map((heading) => (
                <th key={heading} className="px-3 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product, index) => {
              const reviewStatus =
                product.latest_review?.status ?? "unreviewed";

              return (
              <tr
                key={product.id}
                className={`group border-b border-l-[3px] border-b-slate-200 align-middle transition-colors hover:bg-emerald-50/40 ${rowAccent(product)} ${
                  index % 2 === 0 ? "bg-white" : "bg-[#fbfcfa]"
                }`}
              >
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2.5">
                    <ProductMark name={product.name} />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${product.id}`}
                        title={product.name}
                        className="block truncate font-semibold text-slate-950 transition group-hover:text-emerald-800"
                      >
                        {product.name}
                      </Link>
                      <span className="mt-1 block truncate font-mono text-[10px] text-slate-500">
                        {product.domain ?? pick(locale, "No domain", "无域名")}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-slate-600">
                  <p
                    className="line-clamp-2 leading-5"
                    title={product.tagline ?? ""}
                  >
                    {product.tagline ?? "-"}
                  </p>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge>
                    {localizeValue(locale, product.latest_ranking?.source_name)}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4 text-slate-600">
                  <span
                    className="block truncate"
                    title={product.latest_ranking?.category ?? ""}
                  >
                    {localizeValue(locale, product.latest_ranking?.category)}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge>
                    {localizeValue(locale, product.product_scale)}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge
                    tone={founderTone(
                      product.latest_pattern?.solo_founder_fit,
                    )}
                  >
                    {localizeValue(
                      locale,
                      product.latest_pattern?.solo_founder_fit,
                    )}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge
                    tone={potentialTone(
                      product.latest_pattern?.seo_potential,
                    )}
                  >
                    {localizeValue(
                      locale,
                      product.latest_pattern?.seo_potential,
                    )}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge
                    tone={potentialTone(
                      product.latest_pattern?.standalone_potential,
                    )}
                  >
                    {localizeValue(
                      locale,
                      product.latest_pattern?.standalone_potential,
                    )}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4">
                  <SignalBadge tone={reviewTone(reviewStatus)}>
                    {localizeValue(locale, reviewStatus)}
                  </SignalBadge>
                </td>
                <td className="px-3 py-4">
                  <form action={saveReviewLabel} className="flex gap-1">
                    <input type="hidden" name="product_id" value={product.id} />
                    {(["keep", "watch", "pass"] as const).map((status) => (
                      <button
                        key={status}
                        name="status"
                        value={status}
                        className={`h-7 rounded-md border px-2 text-[11px] font-semibold transition ${
                          status === "keep"
                            ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                            : status === "watch"
                              ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                              : "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                        }`}
                      >
                        {localizeValue(locale, status)}
                      </button>
                    ))}
                  </form>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {pick(
              locale,
              "No products match these filters.",
              "没有产品符合当前筛选条件。",
            )}
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-600">
          <p>
            {pick(
              locale,
              `Showing ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filtered.length)} of ${filtered.length}`,
              `显示第 ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filtered.length)} 条，共 ${filtered.length} 条`,
            )}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                href={pageHref(params, currentPage - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-emerald-700 hover:text-emerald-800"
              >
                {pick(locale, "Previous", "上一页")}
              </Link>
            )}
            <span className="px-2">
              {pick(
                locale,
                `Page ${currentPage} of ${pageCount}`,
                `第 ${currentPage} / ${pageCount} 页`,
              )}
            </span>
            {currentPage < pageCount && (
              <Link
                href={pageHref(params, currentPage + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-emerald-700 hover:text-emerald-800"
              >
                {pick(locale, "Next", "下一页")}
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
