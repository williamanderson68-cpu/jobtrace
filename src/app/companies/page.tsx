
import { supabase } from "@/lib/supabase";

export default async function CompaniesPage() {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, industry, hq_city, hq_state, website")
    .order("name");

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="hover:opacity-90">
            <div className="text-xl font-semibold tracking-tight text-white">
              JobTrace
            </div>
            <div className="text-xs text-zinc-500">
              Labor Market Intelligence, not ads.
            </div>
          </a>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/dashboard" className="hover:text-white transition">
              Dashboard
            </a>
            <a href="/companies" className="text-white transition">
              Companies
            </a>
            <a href="/" className="hover:text-white transition">
              Search
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Companies
          </h1>

          <p className="mt-2 text-zinc-400">
            Company hiring intelligence and labor market activity.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            Supabase error: {error.message}
          </div>
        )}

        {!companies?.length && !error && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 text-zinc-400">
            No companies found yet.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies?.map((company: any) => (
            <a
              key={company.id}
              href={`/companies/${company.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex min-h-36 flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {company.name}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    {company.industry || "Industry not classified yet"}
                  </p>

                  <p className="mt-3 text-sm text-zinc-500">
                    HQ: {company.hq_city || "Unknown"}
                    {company.hq_state ? `, ${company.hq_state}` : ""}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                  <span className="text-zinc-500">Company profile</span>
                  <span className="text-zinc-300">View →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
