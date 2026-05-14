import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const companyName = decodeURIComponent(name)

  const [{ data: company }, { data: jobs }, { data: events }] = await Promise.all([
    supabase.from('companies').select('*').eq('name', companyName).maybeSingle(),
    supabase
      .from('jobs')
      .select('*')
      .eq('company', companyName)
      .neq('source', 'manual')
      .order('last_seen', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from('job_events')
      .select('*')
      .contains('metadata', { company: companyName })
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const activeJobs = jobs || []
  const companyEvents = events || []
  const salaryEvents = companyEvents.filter(
    (event) => event.event_type === 'salary_changed'
  )
  const repostEvents = companyEvents.filter(
    (event) => event.event_type === 'reposted'
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <Link href="/companies" className="text-zinc-500 text-sm hover:text-cyan-400">
              ← Employer Directory
            </Link>
            <h1 className="text-3xl font-bold mt-2">Employer Intelligence File</h1>
          </div>

          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-cyan-400">
            Dashboard →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">
            Employer
          </p>

          <h2 className="text-6xl font-bold tracking-tight mb-3">
            {companyName}
          </h2>

          <p className="text-zinc-400 text-xl">
            Hiring behavior, tracked postings, and labor market signal history.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mb-10">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Openings
            </p>
            <p className="text-3xl font-bold text-cyan-400">{activeJobs.length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Events
            </p>
            <p className="text-3xl font-bold text-green-400">{companyEvents.length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Salary Signals
            </p>
            <p className="text-3xl font-bold text-green-400">{salaryEvents.length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Repost Signals
            </p>
            <p className="text-3xl font-bold text-amber-400">{repostEvents.length}</p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
              Expansion
            </p>
            <p className="text-3xl font-bold text-cyan-400">
              {Math.round(company?.expansion_score || activeJobs.length * 8)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Active Posting Files
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Tracked Jobs
            </h3>

            <div className="space-y-3">
              {activeJobs.length === 0 ? (
                <p className="text-zinc-500">No active jobs tracked for this employer.</p>
              ) : (
                activeJobs.map((job) => (
                  <Link
                    href={`/jobs/${job.id}`}
                    key={job.id}
                    className="block border border-zinc-900 rounded-xl p-4 bg-black hover:border-cyan-900 transition"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-zinc-500 text-sm mt-1">{job.location}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-cyan-400 text-sm">
                          {job.salary || job.pay_range || 'Not listed'}
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                          {job.source || 'unknown'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Employer Event Timeline
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Signal History
            </h3>

            <div className="space-y-4">
              {companyEvents.length === 0 ? (
                <p className="text-zinc-500">No events tracked for this employer yet.</p>
              ) : (
                companyEvents.map((event) => (
                  <Link
                    href={`/jobs/${event.job_id}`}
                    key={event.id}
                    className="block border-l-2 border-cyan-500 pl-4 py-1 hover:border-amber-400 transition"
                  >
                    <p className="font-medium">{event.event_title}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {event.event_description || event.event_type}
                    </p>
                    <p className="text-zinc-600 text-xs mt-2">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
            Interpretation
          </p>

          <h3 className="text-2xl font-semibold mb-6">
            Employer Labor Signal Readout
          </h3>

          <div className="grid md:grid-cols-3 gap-5 text-sm">
            <div className="border-l-2 border-cyan-500 pl-4">
              <p className="text-zinc-300">
                Opening count measures current footprint in the tracked labor market.
              </p>
            </div>

            <div className="border-l-2 border-green-500 pl-4">
              <p className="text-zinc-300">
                Salary events become early compensation pressure signals as the dataset grows.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <p className="text-zinc-300">
                Repost and repeated-observation behavior can indicate difficult-to-fill roles or evergreen hiring.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
