'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary?: string | null
  created_at: string
  first_seen?: string | null
  last_seen?: string | null
  status?: string | null
}

interface JobEvent {
  id: string
  job_id: number
  event_type: string
  event_title: string
  event_description?: string | null
  old_value?: string | null
  new_value?: string | null
  created_at: string
}

interface Company {
  id: string
  name: string
  total_openings: number
  hiring_velocity: number
  repost_rate: number
  expansion_score: number
  last_seen: string
}

export default function DashboardClient({
  title,
  location,
}: {
  title: string
  location: string
}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [events, setEvents] = useState<JobEvent[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntelligence()
  }, [title, location])

  const fetchIntelligence = async () => {
    setLoading(true)

    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .order('last_seen', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (title) {
      jobsQuery = jobsQuery.ilike('title', `%${title}%`)
    }

    if (location) {
      jobsQuery = jobsQuery.ilike('location', `%${location}%`)
    }

    const [{ data: jobsData }, { data: eventData }, { data: companyData }] =
      await Promise.all([
        jobsQuery.limit(50),
        supabase
          .from('job_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('companies')
          .select('*')
          .order('expansion_score', { ascending: false })
          .limit(10),
      ])

    setJobs(jobsData || [])
    setEvents(eventData || [])
    setCompanies(companyData || [])
    setLoading(false)
  }

  const metrics = useMemo(() => {
    const salaryEvents = events.filter((event) => event.event_type === 'salary_changed')
    const repostEvents = events.filter((event) => event.event_type === 'reposted')
    const createdEvents = events.filter((event) => event.event_type === 'created')

    return {
      activeOpenings: jobs.length,
      eventCount: events.length,
      hiringVelocity: createdEvents.length,
      salaryChanges: salaryEvents.length,
      repostRate:
        jobs.length > 0 ? Math.round((repostEvents.length / jobs.length) * 100) : 0,
      ghostRisk:
        repostEvents.length >= 5 ? 'Elevated' : repostEvents.length >= 2 ? 'Moderate' : 'Low',
    }
  }, [jobs, events])

  const eventColor = (eventType: string) => {
    if (eventType === 'created') return 'bg-cyan-400'
    if (eventType === 'salary_changed') return 'bg-green-400'
    if (eventType === 'reposted') return 'bg-amber-400'
    if (eventType === 'location_changed') return 'bg-red-400'
    return 'bg-zinc-400'
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              JobTrace Intelligence
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Labor Market Surveillance Platform
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">
              Event Engine Online
            </p>
            <p className="text-zinc-400 text-sm">
              {events.length} recent signals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">
            Intelligence Query
          </p>

          <h2 className="text-5xl font-bold tracking-tight mb-2">
            {title || 'Northern California Labor Market'}
          </h2>

          <p className="text-zinc-400 text-xl">
            {location || 'Live company, job, and event intelligence'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            ['Active Openings', metrics.activeOpenings, 'text-cyan-400'],
            ['New Signals', metrics.eventCount, 'text-green-400'],
            ['Hiring Velocity', `+${metrics.hiringVelocity}`, 'text-cyan-400'],
            ['Repost Rate', `${metrics.repostRate}%`, 'text-amber-400'],
            ['Ghost Job Risk', metrics.ghostRisk, 'text-red-400'],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5"
            >
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">
                {label}
              </p>
              <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
                  Geographic Intelligence
                </p>
                <h3 className="text-2xl font-semibold">
                  Hiring Signal Map
                </h3>
              </div>

              <div className="flex gap-2 items-center">
                <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-zinc-500 text-sm">Tracking</span>
              </div>
            </div>

            <div className="h-full rounded-2xl border border-zinc-800 bg-black relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(39,39,42,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(39,39,42,0.35)_1px,transparent_1px)] bg-[size:42px_42px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.11),transparent_60%)]" />

              {jobs.slice(0, 12).map((job, index) => (
                <div
                  key={job.id}
                  className="absolute group"
                  style={{
                    top: `${22 + ((index * 17) % 58)}%`,
                    left: `${18 + ((index * 23) % 64)}%`,
                  }}
                >
                  <div className="h-4 w-4 bg-cyan-400 rounded-full blur-[1px] animate-pulse" />
                  <div className="hidden group-hover:block absolute left-5 top-0 bg-black border border-zinc-800 rounded-lg p-3 w-56 z-20">
                    <p className="font-medium text-sm">{job.company}</p>
                    <p className="text-zinc-500 text-xs">{job.location}</p>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-6 left-6 bg-black/80 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-1">
                  Signal Density
                </p>
                <p className="text-cyan-400 font-semibold">
                  {jobs.length || 0} tracked openings
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[500px] overflow-hidden">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Event Stream
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Market Activity
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 h-[400px]">
              {loading ? (
                <p className="text-zinc-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-zinc-500">
                  No events yet. Import jobs to generate market activity.
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-zinc-800 rounded-xl p-4 bg-black"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-2 w-2 rounded-full mt-2 animate-pulse ${eventColor(
                          event.event_type
                        )}`}
                      />

                      <div>
                        <p className="text-sm text-zinc-200">
                          {event.event_title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {event.event_type.replace('_', ' ')} ·{' '}
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Company Intelligence
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Expansion Signals
            </h3>

            <div className="space-y-4">
              {companies.length === 0 ? (
                <p className="text-zinc-500">
                  Company profiles will populate as jobs are imported.
                </p>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between border-b border-zinc-900 pb-4"
                  >
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-zinc-500 text-sm">
                        {company.total_openings} active openings tracked
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-cyan-400 font-semibold">
                        {Math.round(company.expansion_score || 0)}
                      </p>
                      <p className="text-zinc-500 text-xs">expansion score</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Intelligence Interpretation
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              What Changed?
            </h3>

            <div className="space-y-5 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <p className="text-zinc-300">
                  New job creation events indicate current employer demand.
                </p>
              </div>

              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-zinc-300">
                  Repost events can suggest roles that are hard to fill,
                  evergreen listings, or labor-market signaling.
                </p>
              </div>

              <div className="border-l-2 border-green-500 pl-4">
                <p className="text-zinc-300">
                  Salary change events create the foundation for compensation
                  pressure tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
                Raw Dataset
              </p>

              <h3 className="text-2xl font-semibold">
                Supporting Job Records
              </h3>
            </div>

            <p className="text-zinc-500 text-sm">
              Evidence behind the intelligence layer
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-zinc-500">Loading labor market data...</p>
            ) : jobs.length === 0 ? (
              <p className="text-zinc-500">
                No records found. Import jobs to create the first signals.
              </p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid md:grid-cols-5 gap-4 items-center border border-zinc-900 rounded-xl p-4 bg-black hover:border-cyan-900 transition"
                >
                  <div className="md:col-span-2">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-zinc-500 text-sm">{job.company}</p>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-sm">{job.location}</p>
                  </div>

                  <div>
                    <p className="text-cyan-400 text-sm">
                      {job.salary || 'Not Listed'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">
                      Last Seen
                    </p>

                    <p className="text-sm">
                      {new Date(
                        job.last_seen || job.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
