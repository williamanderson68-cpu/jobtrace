
export default function CompaniesPage() {
  const mockCompanies = [
    {
      id: "1",
      name: "Tesla",
      industry: "Automotive / Energy",
      hq: "Austin, TX",
      jobs: 142,
    },
    {
      id: "2",
      name: "OpenAI",
      industry: "Artificial Intelligence",
      hq: "San Francisco, CA",
      jobs: 28,
    },
  ]

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Companies
          </h1>

          <p className="mt-2 text-zinc-400">
            Company hiring intelligence and labor market activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {mockCompanies.map((company) => (
            <a
              key={company.id}
              href={`/companies/${company.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {company.name}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    {company.industry}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    HQ: {company.hq}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-semibold text-white">
                    {company.jobs}
                  </div>

                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Active Jobs
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
