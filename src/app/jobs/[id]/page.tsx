import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [{ data: job }, { data: events }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase
      .from('job_events')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!job) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-zinc-500 mb-4">Job file not found.</p>
          <Link href="/dashboard" className="text-cyan-400">
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const salary = job.salary || job.pay_range || 'Not listed'
  const firstSeen = job.first_seen || job.first_seen_at || job.created_at
  const lastSeen = job.last_seen || job.last_checked_at || job.created_at
  const companyUrl = `/companies/${encodeURIComponent(job.company)}`

  const salaryEvents = (events || []).filter(
    (event) => event.event_type === 'salary_changed'
  )
  const repostEvents = (events || []).filter(
    (event) => event.event_type === 'reposted'
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-zinc-500 text-sm hover:text-cyan-400">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold mt-2">Job Intelligence File</h1>
          </div>

          <Link
            href={companyUrl}
            className="text-sm text-zinc-400 hover:text-cyan-400 transition"
          >
            Employer Profile →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">
              Posting
            </p>

            <h2 className="text-5xl font-bold tracking-tight mb-4">
              {job.title}
            </h2>

            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                href={companyUrl}
                className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-900 text-sm"
              >
                {job.company}
              </Link>

              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 text-sm">
                {job.location}
              </span>

              <span className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 text-sm">
                {job.source || 'unknown source'}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-black border border-zinc-900 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] mb-2">
                  Compensation
                </p>
                <p className="text-cyan-400 text-xl font-semibold">{salary}</p>
              </div>

              <div className="bg-black border border-zinc-900 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] mb-2">
                  First Seen
                </p>
                <p className="text-zinc-200">
                  {new Date(firstSeen).toLocaleString()}
                </p>
              </div>

              <div className="bg-black border border-zinc-900 rounded-xl p-4">
                <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] mb-2">
                  Last Seen
                </p>
                <p className="text-zinc-200">
                  {new Date(lastSeen).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">
              Actions
            </p>

            <div className="space-y-3">
              {job.url ? (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center rounded-xl bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 transition"
                >
                  Open Original Posting
                </a>
              ) : (
                <div className="block w-full text-center rounded-xl bg-zinc-900 text-zinc-600 font-semibold py-3">
                  No Posting URL Stored
                </div>
              )}

              <Link
                href={companyUrl}
                className="block w-full text-center rounded-xl border border-zinc-800 text-zinc-300 font-semibold py-3 hover:border-cyan-900 hover:text-cyan-400 transition"
              >
                View Employer Intelligence
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">
                  Status
                </p>
                <p className="text-green-400 mt-1">{job.status || 'active'}</p>
              </div>

              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">
                  Coordinates
                </p>
                <p className="text-zinc-300 mt-1">
                  {job.latitude && job.longitude
                    ? `${job.latitude}, ${job.longitude}`
                    : 'Not mapped'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Events Tracked
            </p>
            <p className="text-4xl font-bold text-cyan-400">
              {(events || []).length}
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Salary Changes
            </p>
            <p className="text-4xl font-bold text-green-400">
              {salaryEvents.length}
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Repost Signals
            </p>
            <p className="text-4xl font-bold text-amber-400">
              {repostEvents.length}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Posting Timeline
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Tracked Changes
            </h3>

            <div className="space-y-4">
              {(events || []).length === 0 ? (
                <p className="text-zinc-500">No events tracked yet.</p>
              ) : (
                events?.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-2 border-cyan-500 pl-4 py-1"
                  >
                    <p className="font-medium">{event.event_title}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {event.event_description || event.event_type}
                    </p>
                    {(event.old_value || event.new_value) && (
                      <p className="text-xs text-zinc-400 mt-2">
                        {event.old_value || 'none'} → {event.new_value || 'none'}
                      </p>
                    )}
                    <p className="text-xs text-zinc-600 mt-2">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Employer Insights
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Interpretation
            </h3>

            <div className="space-y-5 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <p className="text-zinc-300">
                  This posting is now tracked as a persistent labor-market object,
                  not just a one-time job listing.
                </p>
              </div>

              <div className="border-l-2 border-green-500 pl-4">
                <p className="text-zinc-300">
                  Compensation changes will be captured as structured events and
                  used later for salary pressure analysis.
                </p>
              </div>

              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-zinc-300">
                  Repeated observations and repost events can become signals for
                  hiring difficulty, evergreen listings, or expansion behavior.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-black border border-zinc-900 rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.15em] mb-2">
                Raw Posting Data
              </p>

              <pre className="text-xs text-zinc-400 whitespace-pre-wrap overflow-auto max-h-72">
                {JSON.stringify(job, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
