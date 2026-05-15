
import { supabase } from "@/lib/supabase";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, city, state, status, updated_at")
    .eq("company_id", id)
    .order("updated_at", { ascending: false })
    .limit(25);

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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <a
          href="/companies"
          className="mb-6 inline-block text-sm text-zinc-400 hover:text-white"
        >
          ← Companies
        </a>

        {companyError && (
          <div className="mb-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            Supabase error: {companyError.message}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                {company?.name || "Unknown Company"}
              </h1>

              <p className="mt-3 text-zinc-400">
                Labor market intelligence profile.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Status
              </div>

              <div className="mt-1 text-lg font-medium text-emerald-400">
                Active
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Industry
              </div>
              <div className="mt-2 text-lg text-white">
                {company?.industry || "Unknown"}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                HQ
              </div>
              <div className="mt-2 text-lg text-white">
                {company?.hq_city || "Unknown"}
                {company?.hq_state ? `, ${company.hq_state}` : ""}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Website
              </div>
              <div className="mt-2 break-all text-sm text-white">
                {company?.website || "Unknown"}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Linked Jobs
              </div>
              <div className="mt-2 text-lg text-white">
                {jobs?.length || 0}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Recent Job Activity
            </h2>

            {jobsError && (
              <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
                Supabase error: {jobsError.message}
              </div>
            )}

            {!jobs?.length && !jobsError && (
              <div className="rounded-lg border border-zinc-800 p-4 text-zinc-400">
                No jobs are linked to this company yet.
              </div>
            )}

            <div className="space-y-3">
              {jobs?.map((job: any) => (
                <a
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-medium text-white">
                        {job.title || "Untitled job"}
                      </div>

                      <div className="mt-1 text-sm text-zinc-400">
                        {job.city || "Unknown Location"}
                        {job.state ? `, ${job.state}` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-emerald-400">
                        {job.status || "active"}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        {job.updated_at
                          ? `Updated ${new Date(job.updated_at).toLocaleDateString()}`
                          : "Updated date unknown"}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
