import Link from "next/link";

import { loadOpportunityCards } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  let opportunities;

  try {
    opportunities = await loadOpportunityCards();
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm">
          {error instanceof Error
            ? error.message
            : "Unable to load opportunities."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="border-b border-slate-900/15 pb-7">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-800">
          Traceable directions
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
          Opportunity cards
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Adjacent niche directions generated from reviewed product patterns,
          not free-form idea prompts.
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
                  {opportunity.verdict ?? "unrated"}
                </span>
                <h2 className="mt-2 font-serif text-3xl">
                  {opportunity.title}
                </h2>
              </div>
              <div className="rounded-2xl bg-[#d9ff62] px-4 py-3 text-center text-[#132a24]">
                <span className="block font-mono text-[9px] uppercase">
                  Standalone
                </span>
                <strong className="text-xl">
                  {opportunity.standalone_score ?? "—"}
                </strong>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {opportunity.description}
            </p>

            <dl className="mt-5 grid gap-4 rounded-2xl bg-stone-50 p-4 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  Founder fit
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {opportunity.founder_fit_score ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  Buildability
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {opportunity.buildability_score ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-slate-500">
                  Main keyword
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {opportunity.main_keyword ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                MVP
              </h3>
              <p className="mt-2 text-sm leading-6">
                {opportunity.mvp_summary ?? "—"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Why it fits a solo founder
              </h3>
              <p className="mt-2 text-sm leading-6">
                {opportunity.founder_fit_summary ?? "—"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Inspired by
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
                Long-tail keywords
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {opportunity.long_tail_keywords?.join(" · ") || "—"}
              </p>
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Competitors
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
                {opportunity.risk_summary ?? "No risk summary generated."}
              </p>
            </div>
          </article>
        ))}
      </div>

      {opportunities.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="font-serif text-2xl">No opportunity cards yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Review products, then run the opportunity generation script.
          </p>
        </div>
      )}
    </main>
  );
}
