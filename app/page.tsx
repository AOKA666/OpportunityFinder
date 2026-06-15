import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-[#132a24] px-6 text-white">
      <div className="mx-auto w-full max-w-5xl py-20">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-200/70">
          AI product ranking database
        </p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          Find the useful signal beyond the leaderboard.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-emerald-50/70">
          Collect niche products, filter out platform noise, review product
          patterns, and generate traceable opportunities for solo developers.
        </p>
        <Link
          href="/admin/products"
          prefetch
          className="mt-9 inline-block rounded-full bg-[#d9ff62] px-6 py-3 font-semibold text-[#132a24] transition hover:bg-[#c8ef4d]"
        >
          Open research desk
        </Link>
      </div>
    </main>
  );
}
