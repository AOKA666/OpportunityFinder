import { getLocale, pick } from "@/lib/i18n";

const ROWS = Array.from({ length: 8 });

export default async function ProductsLoading() {
  const locale = await getLocale();

  return (
    <main
      className="mx-auto max-w-[1500px] animate-pulse px-5 py-8 lg:px-8"
      aria-label={pick(locale, "Loading products", "正在加载产品")}
    >
      <div className="border-b border-slate-900/15 pb-7">
        <div className="h-3 w-40 rounded bg-emerald-800/15" />
        <div className="mt-4 h-12 w-72 max-w-full rounded bg-slate-900/10" />
        <div className="mt-3 h-4 w-52 rounded bg-slate-900/10" />
      </div>

      <div className="my-6 grid gap-3 rounded-2xl border border-slate-900/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index}>
            <div className="h-3 w-16 rounded bg-slate-900/10" />
            <div className="mt-2 h-9 rounded-lg bg-slate-900/10" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
        <div className="h-10 border-b border-slate-200 bg-stone-50" />
        {ROWS.map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-6 border-b border-slate-100 px-4 py-5 last:border-0"
          >
            <div className="h-4 rounded bg-slate-900/10" />
            <div className="h-4 rounded bg-slate-900/10" />
            <div className="h-4 rounded bg-slate-900/10" />
            <div className="h-4 rounded bg-slate-900/10" />
          </div>
        ))}
      </div>
    </main>
  );
}
