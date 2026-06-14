import Link from "next/link";
import { notFound } from "next/navigation";

import { saveReviewLabel } from "@/app/admin/actions";
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
        {children || "—"}
      </dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;

  try {
    product = await loadProductDetail(id);
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm">
          {error instanceof Error ? error.message : "Unable to load product."}
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
        ← Back to products
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-[#132a24] p-7 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
              {product.product_scale?.replaceAll("_", " ") ?? "Unclassified"}
            </p>
            <h1 className="mt-3 font-serif text-4xl">{product.name}</h1>
            <p className="mt-3 max-w-3xl text-lg leading-7 text-emerald-50/80">
              {product.tagline ?? "No tagline collected."}
            </p>
            {product.website_url && (
              <a
                href={product.website_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-full bg-[#d9ff62] px-4 py-2 text-sm font-semibold text-[#132a24]"
              >
                Visit {product.domain}
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">Product evidence</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Domain">{product.domain}</Field>
              <Field label="First seen">
                {new Date(product.first_seen_at).toLocaleDateString()}
              </Field>
              <Field label="Description">{product.description}</Field>
              <Field label="Blocked">
                {product.is_blocked ? product.block_reason ?? "Yes" : "No"}
              </Field>
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">AI pattern</h2>
            {latestPattern ? (
              <>
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Input">{latestPattern.input_type}</Field>
                  <Field label="Output">{latestPattern.output_type}</Field>
                  <Field label="Target user">{latestPattern.target_user}</Field>
                  <Field label="Job to be done">
                    {latestPattern.job_to_be_done}
                  </Field>
                  <Field label="Product format">
                    {latestPattern.product_format}
                  </Field>
                  <Field label="MVP complexity">
                    {latestPattern.mvp_complexity}
                  </Field>
                  <Field label="Cultural dependency">
                    {latestPattern.cultural_dependency}
                  </Field>
                  <Field label="Solo founder fit">
                    {latestPattern.solo_founder_fit}
                  </Field>
                  <Field label="SEO potential">
                    {latestPattern.seo_potential}
                  </Field>
                  <Field label="Standalone potential">
                    {latestPattern.standalone_potential}
                  </Field>
                </dl>
                <p className="mt-6 border-l-2 border-lime-400 pl-4 text-sm leading-6 text-slate-700">
                  {latestPattern.reason_summary}
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No AI pattern has been generated.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-white p-7">
            <h2 className="font-serif text-2xl">Ranking history</h2>
            <div className="mt-5 space-y-4">
              {product.rankings.map((ranking) => (
                <article
                  key={ranking.id}
                  className="rounded-xl bg-stone-50 p-4 text-sm"
                >
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <strong>{ranking.source_name}</strong>
                    <span>{ranking.category ?? "Uncategorized"}</span>
                    <span>Rank {ranking.rank_position ?? "—"}</span>
                    <span>{ranking.upvotes ?? 0} votes</span>
                    <span>{ranking.snapshot_date}</span>
                  </div>
                  {ranking.raw_data && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-slate-500">
                        Raw data
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
              Manual review
            </p>
            <p className="mt-3 text-sm">
              Current:{" "}
              <strong className="capitalize">
                {latestReview?.status ?? "unreviewed"}
              </strong>
            </p>
            <label className="mt-5 block text-sm font-medium">
              Review note
              <textarea
                name="note"
                defaultValue={latestReview?.note ?? ""}
                rows={6}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-stone-50 p-3 text-sm"
                placeholder="Why is this signal worth keeping or passing?"
              />
            </label>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["keep", "watch", "pass"] as const).map((status) => (
                <button
                  key={status}
                  name="status"
                  value={status}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold capitalize hover:border-emerald-700 hover:text-emerald-800"
                >
                  {status}
                </button>
              ))}
            </div>
          </form>
        </aside>
      </div>
    </main>
  );
}
