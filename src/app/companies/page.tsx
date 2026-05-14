import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function CompaniesPage() {
  const [{ data: companies }, { data: jobs }, { data: events }] = await Promise.all([
    supabase
      .from('companies')
      .select('*')
      .not('name', 'ilike', '%tesla%')
      .order('expansion_score', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, company, title, location, salary, pay_range, source, last_seen, created_at')
      .neq('source', 'manual')
      .limit(500),
    supabase
      .from('job_events')
      .select('id, event_type, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const companyRows = (companies || []).map((company) => {
    const companyJobs = (jobs || []).filter((job) => job.company === company.name)
    const companyEvents = (events || []).filter(
      (event) => event.metadata?.company === company.name
    )

    const createdEvents = companyEvents.filter(
      (event) => event.event_type === 'created'
    ).length

    const salaryEvents = companyEvents.filter(
      (event) => event.event_type === 'salary_changed'
    ).length

    return {
      ...company,
      jobCount: companyJobs.length,
      eventCount: companyEvents.length,
      createdEvents,
      salaryEvents,
    }
  })

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-zinc-500 text-sm hover:text-cyan-400">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold mt-2">Employer Intelligence Directory</h1>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">
            Company-Level Signals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">
            Directory
          </p>

          <h2 className="text-5xl font-bold tracking-tight mb-2">
            Tracked Employers
          </h2>

          <p className="text-zinc-400 text-xl">
            Hiring velocity, event count, opening count, and expansion signal ranking.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Employers
            </p>
            <p className="text-3xl font-bold text-cyan-400">{companyRows.length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Openings
            </p>
            <p className="text-3xl font-bold text-green-400">{(jobs || []).length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Events
            </p>
            <p className="text-3xl font-bold text-cyan-400">{(events || []).length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Mode
            </p>
            <p className="text-3xl font-bold text-amber-400">Live</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="grid grid-cols-6 gap-4 text-xs uppercase tracking-[0.18em] text-zinc-600 border-b border-zinc-900 pb-4 mb-4">
            <div className="col-span-2">Employer</div>
            <div>Openings</div>
            <div>Events</div>
            <div>Salary Signals</div>
            <div className="text-right">Expansion</div>
          </div>

          <div className="space-y-2">
            {companyRows.length === 0 ? (
              <p className="text-zinc-500">No employers tracked yet.</p>
            ) : (
              companyRows.map((company) => (
                <Link
                  href={`/companies/${encodeURIComponent(company.name)}`}
                  key={company.id}
                  className="grid grid-cols-6 gap-4 items-center border border-zinc-900 rounded-xl p-4 bg-black hover:border-cyan-900 transition"
                >
                  <div className="col-span-2">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-zinc-500 text-sm">
                      Last seen {new Date(company.last_seen || company.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-cyan-400">{company.jobCount}</div>
                  <div className="text-zinc-300">{company.eventCount}</div>
                  <div className="text-green-400">{company.salaryEvents}</div>

                  <div className="text-right">
                    <p className="text-amber-400 font-semibold">
                      {Math.round(company.expansion_score || 0)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
