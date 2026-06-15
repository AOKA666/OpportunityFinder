import Link from "next/link";

import { LanguageSwitcher } from "@/app/language-switcher";
import { getLocale, pick } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen items-center bg-[#132a24] px-6 text-white">
      <div className="mx-auto w-full max-w-5xl py-20">
        <div className="mb-12 flex justify-end">
          <LanguageSwitcher locale={locale} />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-200/70">
          {pick(locale, "AI product ranking database", "AI 产品榜单数据库")}
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          {pick(
            locale,
            "Find the useful signal beyond the leaderboard.",
            "从榜单之外，找到真正有用的产品信号。",
          )}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-emerald-50/70">
          {pick(
            locale,
            "Collect niche products, filter out platform noise, review product patterns, and generate traceable opportunities for solo developers.",
            "采集细分产品，过滤平台噪声，评估产品模式，并为独立开发者生成可追溯的机会方向。",
          )}
        </p>
        <Link
          href="/admin/products"
          prefetch
          className="mt-9 inline-block rounded-full bg-[#d9ff62] px-6 py-3 font-semibold text-[#132a24] transition hover:bg-[#c8ef4d]"
        >
          {pick(locale, "Open research desk", "进入研究后台")}
        </Link>
      </div>
    </main>
  );
}
