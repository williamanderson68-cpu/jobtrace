
export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <a
          href="/companies"
          className="mb-6 inline-block text-sm text-zinc-400 hover:text-white"
        >
          ← Companies
        </a>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Company #{id}
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

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Industry
              </div>

              <div className="mt-2 text-lg text-white">
                Unknown
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                HQ
              </div>

              <div className="mt-2 text-lg text-white">
                Unknown
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Active Jobs
              </div>

              <div className="mt-2 text-lg text-white">
                —
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
