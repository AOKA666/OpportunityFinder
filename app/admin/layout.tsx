import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-stone-100 text-slate-950">
      <header className="border-b border-slate-900/10 bg-[#132a24] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/admin/products" className="group">
            <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-200/70">
              Internal research desk
            </span>
            <span className="font-serif text-xl tracking-tight">
              Opportunity Index
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/admin/products"
              className="rounded-full px-4 py-2 text-emerald-50 transition hover:bg-white/10"
            >
              Products
            </Link>
            <Link
              href="/admin/opportunities"
              className="rounded-full px-4 py-2 text-emerald-50 transition hover:bg-white/10"
            >
              Opportunities
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
