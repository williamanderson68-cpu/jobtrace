'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import JobSignalMap from '@/components/JobSignalMap'

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary?: string | null
  pay_range?: string | null
  created_at: string
  first_seen?: string | null
  last_seen?: string | null
  status?: string | null
  source?: string | null
  url?: string | null
  latitude?: number | null
  longitude?: number | null
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
      .neq('source', 'manual')
      .not('source', 'is', null)
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
        jobsQuery.limit(100),
        supabase
          .from('job_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(35),
        supabase
          .from('companies')
          .select('*')
          .not('name', 'ilike', '%tesla%')
          .order('expansion_score', { ascending: false })
          .limit(10),
      ])

    setJobs(jobsData || [])
    setEvents(eventData || [])
    setCompanies(companyData || [])
    setLoading(false)
  }

  const metrics = useMemo(() => {
    const repostEvents = events.filter((event) => event.event_type === 'reposted')
    const createdEvents = events.filter((event) => event.event_type === 'created')
    const mappedJobs = jobs.filter((job) => job.latitude && job.longitude)

    return {
      activeOpenings: jobs.length,
      mappedOpenings: mappedJobs.length,
      eventCount: events.length,
      hiringVelocity: createdEvents.length,
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
              Live Labor Market Surveillance
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/companies"
              className="text-sm text-zinc-400 hover:text-cyan-400 transition"
            >
              Employer Directory
            </Link>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">
                Real Map Layer
              </p>
              <p className="text-zinc-400 text-sm">
                Mapbox-ready
              </p>
            </div>
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
            {location || 'Imported source data with geocoded labor signals'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            ['Active Openings', metrics.activeOpenings, 'text-cyan-400'],
            ['Mapped Openings', metrics.mappedOpenings, 'text-green-400'],
            ['New Signals', metrics.eventCount, 'text-cyan-400'],
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
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[560px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
                  Geographic Intelligence
                </p>
                <h3 className="text-2xl font-semibold">
                  Live Map of Hiring Signals
                </h3>
              </div>

              <div className="flex gap-2 items-center">
                <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-zinc-500 text-sm">
                  {metrics.mappedOpenings} mapped signals
                </span>
              </div>
            </div>

            <JobSignalMap jobs={jobs} />
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[560px] overflow-hidden">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Event Stream
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Market Activity
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 h-[455px]">
              {loading ? (
                <p className="text-zinc-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-zinc-500">
                  No events yet. Run the automated importer to generate activity.
                </p>
              ) : (
                events.map((event) => (
                  <Link
                    href={`/jobs/${event.job_id}`}
                    key={event.id}
                    className="block border border-zinc-800 rounded-xl p-4 bg-black hover:border-cyan-900 transition"
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
                  </Link>
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
                  <Link
                    href={`/companies/${encodeURIComponent(company.name)}`}
                    key={company.id}
                    className="flex items-center justify-between border-b border-zinc-900 pb-4 hover:border-cyan-900 transition"
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
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
              Map Status
            </p>

            <h3 className="text-2xl font-semibold mb-6">
              Tile Layer Upgrade
            </h3>

            <div className="space-y-5 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4">
                <p className="text-zinc-300">
                  The dashboard now supports real Mapbox dark tiles instead of the black placeholder panel.
                </p>
              </div>

              <div className="border-l-2 border-green-500 pl-4">
                <p className="text-zinc-300">
                  Mapped jobs use stored latitude and longitude from the geocoding pipeline.
                </p>
              </div>

              <div className="border-l-2 border-amber-500 pl-4">
                <p className="text-zinc-300">
                  Add NEXT_PUBLIC_MAPBOX_TOKEN to activate the full live map layer.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">
                Source Dataset
              </p>

              <h3 className="text-2xl font-semibold">
                Imported Job Records
              </h3>
            </div>

            <p className="text-zinc-500 text-sm">
              Click a row to open the intelligence file
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-zinc-500">Loading labor market data...</p>
            ) : jobs.length === 0 ? (
              <p className="text-zinc-500">
                No imported records found. Run the automated importer.
              </p>
            ) : (
              jobs.map((job) => (
                <Link
                  href={`/jobs/${job.id}`}
                  key={job.id}
                  className="grid md:grid-cols-6 gap-4 items-center border border-zinc-900 rounded-xl p-4 bg-black hover:border-cyan-900 transition"
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
                      {job.salary || job.pay_range || 'Not Listed'}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">
                      Coordinates
                    </p>
                    <p className="text-sm">
                      {job.latitude && job.longitude ? 'mapped' : 'pending'}
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
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
