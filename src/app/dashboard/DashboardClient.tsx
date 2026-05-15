'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import JobSignalMap from '@/components/JobSignalMap'

type Job = {
  id: number
  title: string
  company: string
  location: string
  salary?: string | null
  pay_range?: string | null
  created_at: string
  last_seen?: string | null
  status?: string | null
  lifecycle_status?: string | null
  source?: string | null
  latitude?: number | null
  longitude?: number | null
}

type JobEvent = {
  id: string
  job_id: number
  event_type: string
  event_title: string
  created_at: string
}

function displayStatus(job: Job) {
  const status = (job.lifecycle_status || job.status || 'active').toLowerCase()
  if (status === 'removed') return 'Removed'
  if (status === 'expired') return 'Expired'
  if (status === 'inactive') return 'Inactive'
  return 'Active'
}

function displayPay(job: Job) {
  return job.salary || job.pay_range || 'Pay unavailable'
}

export default function DashboardClient({ title, location }: { title: string; location: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [events, setEvents] = useState<JobEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('All Companies')
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [lifecycleFilter, setLifecycleFilter] = useState('active')

  useEffect(() => {
    fetchIntelligence()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, location])

  async function fetchIntelligence() {
    setLoading(true)

    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .neq('source', 'manual')
      .not('source', 'is', null)
      .order('last_seen', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (title) jobsQuery = jobsQuery.ilike('title', `%${title}%`)
    if (location) jobsQuery = jobsQuery.ilike('location', `%${location}%`)

    const [{ data: jobsData }, { data: eventData }] = await Promise.all([
      jobsQuery.limit(300),
      supabase.from('job_events').select('*').order('created_at', { ascending: false }).limit(50),
    ])

    setJobs(jobsData || [])
    setEvents(eventData || [])
    setLoading(false)
  }

  const companyOptions = useMemo(
    () => ['All Companies', ...Array.from(new Set(jobs.map((job) => job.company).filter(Boolean))).sort()],
    [jobs]
  )

  const sourceOptions = useMemo(
    () => ['All Sources', ...Array.from(new Set(jobs.map((job) => job.source || 'unknown'))).sort()],
    [jobs]
  )

  const filteredJobs = useMemo(
    () => jobs.filter((job) => {
      const status = (job.lifecycle_status || job.status || 'active').toLowerCase()

      return (
        (companyFilter === 'All Companies' || job.company === companyFilter) &&
        (sourceFilter === 'All Sources' || (job.source || 'unknown') === sourceFilter) &&
        (lifecycleFilter === 'all' ||
          (lifecycleFilter === 'active' && status !== 'removed') ||
          (lifecycleFilter === 'removed' && status === 'removed'))
      )
    }),
    [jobs, companyFilter, sourceFilter, lifecycleFilter]
  )

  const metrics = useMemo(() => {
    const createdEvents = events.filter((event) => event.event_type === 'created')
    const removedEvents = events.filter((event) => event.event_type === 'removed')
    const companiesHiring = new Set(filteredJobs.map((job) => job.company).filter(Boolean)).size
    const citiesCovered = new Set(filteredJobs.map((job) => job.location).filter(Boolean)).size

    return {
      activeOpenings: filteredJobs.length,
      mappedOpenings: filteredJobs.filter((job) => job.latitude && job.longitude).length,
      companiesHiring,
      citiesCovered,
      recentlyUpdated: events.length,
      newThisWeek: createdEvents.length,
      removed: removedEvents.length,
    }
  }, [filteredJobs, events])

  const eventColor = (eventType: string) => {
    if (eventType === 'created') return 'bg-cyan-400'
    if (eventType === 'salary_changed') return 'bg-green-400'
    if (eventType === 'reposted') return 'bg-amber-400'
    if (eventType === 'removed') return 'bg-red-400'
    return 'bg-zinc-400'
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-zinc-100">
      <div className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">JobTrace</div>
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Labor Market Intelligence</div>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
              Search
            </Link>
            <button onClick={fetchIntelligence} className="text-sm text-cyan-400 transition hover:text-cyan-300">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-cyan-400/80">Intelligence Query</p>
          <h1 className="mb-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {title || 'Northern California Labor Market'}
          </h1>
          <p className="text-lg text-zinc-400 md:text-xl">
            {location || 'Labor Market Intelligence, not ads.'}
          </p>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur md:grid-cols-4">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500"
          >
            {companyOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500"
          >
            {sourceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500"
          >
            <option value="active">Active Only</option>
            <option value="removed">Removed Only</option>
            <option value="all">All Statuses</option>
          </select>

          <button
            onClick={fetchIntelligence}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            Refresh Data
          </button>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-6">
          {[
            ['Jobs Tracked', metrics.activeOpenings, 'text-cyan-400'],
            ['Mapped', metrics.mappedOpenings, 'text-green-400'],
            ['Companies Hiring', metrics.companiesHiring, 'text-zinc-100'],
            ['Cities Covered', metrics.citiesCovered, 'text-zinc-100'],
            ['Recently Updated', metrics.recentlyUpdated, 'text-cyan-400'],
            ['New This Week', `+${metrics.newThisWeek}`, 'text-green-400'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur transition hover:border-zinc-700">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
              <h2 className={`text-3xl font-semibold ${color}`}>{value}</h2>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="h-[560px] rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 backdrop-blur lg:col-span-2">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Geographic Intelligence</p>
                <h3 className="text-2xl font-semibold text-white">Hiring Signal Map</h3>
              </div>
              <p className="text-sm text-zinc-500">{metrics.mappedOpenings} mapped signals</p>
            </div>
            <JobSignalMap jobs={filteredJobs} />
          </div>

          <div className="h-[560px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 backdrop-blur">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Event Stream</p>
            <h3 className="mb-6 text-2xl font-semibold text-white">Market Activity</h3>
            <div className="h-[455px] space-y-4 overflow-y-auto pr-2">
              {loading ? (
                <p className="text-zinc-500">Loading activity...</p>
              ) : events.length === 0 ? (
                <p className="text-zinc-500">No recent activity found.</p>
              ) : (
                events.map((event) => (
                  <Link
                    href={`/jobs/${event.job_id}`}
                    key={event.id}
                    className="block rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-cyan-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-2 h-2 w-2 rounded-full ${eventColor(event.event_type)}`} />
                      <div>
                        <p className="text-sm text-zinc-200">{event.event_title}</p>
                        <p className="mt-2 text-xs capitalize text-zinc-500">
                          {event.event_type.replace('_', ' ')} · {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 backdrop-blur">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Source Dataset</p>
              <h3 className="text-2xl font-semibold text-white">Job Records</h3>
            </div>
            <p className="text-sm text-zinc-500">Showing {filteredJobs.length} filtered records</p>
          </div>

          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Link
                href={`/jobs/${job.id}`}
                key={job.id}
                className="grid items-center gap-4 rounded-xl border border-zinc-900 bg-black p-4 transition hover:border-cyan-900 md:grid-cols-6"
              >
                <div className="md:col-span-2">
                  <p className="font-medium text-zinc-100">{job.title}</p>
                  <p className="text-sm text-zinc-500">{job.company}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-400">{job.location}</p>
                </div>

                <div>
                  <p className="text-sm text-cyan-400">{displayPay(job)}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Status</p>
                  <p className="text-sm text-zinc-200">{displayStatus(job)}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Last updated</p>
                  <p className="text-sm text-zinc-200">{new Date(job.last_seen || job.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
