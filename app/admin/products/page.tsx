import Link from "next/link";

import { saveReviewLabel } from "@/app/admin/actions";
import { loadProductList } from "@/lib/supabase/admin-data";
import type { ProductListItem } from "@/lib/types/product";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 100;

const FILTERS = [
  ["source", "Source"],
  ["category", "Category"],
  ["product_scale", "Scale"],
  ["solo_founder_fit", "Founder fit"],
  ["seo_potential", "SEO"],
  ["standalone_potential", "Standalone"],
  ["review_status", "Review"],
] as const;

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

function label(value: string | null | undefined) {
  return value?.replaceAll("_", " ") ?? "—";
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
  let products: ProductListItem[];

  try {
    products = await loadProductList();
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-800">
            Database connection required
          </p>
          <h1 className="mt-3 font-serif text-3xl">
            Configure Supabase to browse products
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {error instanceof Error ? error.message : "Unable to load products."}
          </p>
        </div>
      </main>
    );
  }

  const options = new Map<string, string[]>();
  for (const [key] of FILTERS) {
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
    FILTERS.every(([key]) => {
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
            Product signal review
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
            Ranked products
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {filtered.length} matches from {products.length} collected products
          </p>
        </div>
        <Link
          href="/admin/opportunities"
          className="self-start rounded-full bg-[#d9ff62] px-5 py-3 text-sm font-semibold text-[#132a24] transition hover:bg-[#c8ef4d] md:self-auto"
        >
          View opportunity cards
        </Link>
      </div>

      <form className="my-6 grid gap-3 rounded-2xl border border-slate-900/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {FILTERS.map(([key, title]) => (
          <label key={key} className="text-xs font-medium text-slate-600">
            {title}
            <select
              name={key}
              defaultValue={valueOf(params, key)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-stone-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All</option>
              {options.get(key)?.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end gap-2 xl:col-span-7">
          <button className="rounded-lg bg-[#132a24] px-4 py-2 text-sm font-medium text-white">
            Apply filters
          </button>
          <Link
            href="/admin/products"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-900/10 bg-white shadow-sm">
        <table className="w-full min-w-[1250px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-stone-50 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {[
                "Product",
                "Tagline",
                "Source",
                "Category",
                "Scale",
                "Founder fit",
                "SEO",
                "Standalone",
                "Review",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleProducts.map((product) => (
              <tr key={product.id} className="align-top hover:bg-lime-50/40">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-semibold text-slate-950 hover:text-emerald-800"
                  >
                    {product.name}
                  </Link>
                  <span className="mt-1 block font-mono text-[11px] text-slate-500">
                    {product.domain ?? "No domain"}
                  </span>
                </td>
                <td className="max-w-[260px] px-4 py-4 text-slate-600">
                  {product.tagline ?? "—"}
                </td>
                <td className="px-4 py-4">
                  {label(product.latest_ranking?.source_name)}
                </td>
                <td className="px-4 py-4">
                  {label(product.latest_ranking?.category)}
                </td>
                <td className="px-4 py-4">{label(product.product_scale)}</td>
                <td className="px-4 py-4">
                  {label(product.latest_pattern?.solo_founder_fit)}
                </td>
                <td className="px-4 py-4">
                  {label(product.latest_pattern?.seo_potential)}
                </td>
                <td className="px-4 py-4">
                  {label(product.latest_pattern?.standalone_potential)}
                </td>
                <td className="px-4 py-4 font-medium">
                  {label(product.latest_review?.status ?? "unreviewed")}
                </td>
                <td className="px-4 py-4">
                  <form action={saveReviewLabel} className="flex gap-1">
                    <input type="hidden" name="product_id" value={product.id} />
                    {(["keep", "watch", "pass"] as const).map((status) => (
                      <button
                        key={status}
                        name="status"
                        value={status}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs capitalize hover:border-emerald-700 hover:text-emerald-800"
                      >
                        {status}
                      </button>
                    ))}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            No products match these filters.
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-600">
          <p>
            Showing {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                href={pageHref(params, currentPage - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-emerald-700 hover:text-emerald-800"
              >
                Previous
              </Link>
            )}
            <span className="px-2">
              Page {currentPage} of {pageCount}
            </span>
            {currentPage < pageCount && (
              <Link
                href={pageHref(params, currentPage + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:border-emerald-700 hover:text-emerald-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
