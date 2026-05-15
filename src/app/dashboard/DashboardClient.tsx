'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import JobSignalMap from '@/components/JobSignalMap'
import CollapsibleText from '@/components/CollapsibleText'

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
  description?: string | null
  requirements?: string | null
  benefits?: string | null
}

type JobEvent = {
  id: string
  job_id: number
  event_type: string
  event_title: string
  created_at: string
}

type Company = {
  id: string
  name: string
  total_openings: number
  expansion_score: number
}

const INITIAL_VISIBLE_JOBS = 25
const JOB_INCREMENT = 25

function formatStatus(job: Job) {
  const value = job.lifecycle_status || job.status || 'active'
  return value.replace(/_/g, ' ')
}

function formatPay(job: Job) {
  return job.salary || job.pay_range || 'Not available'
}

export default function DashboardClient({ title, location }: { title: string; location: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [events, setEvents] = useState<JobEvent[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('All Companies')
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [lifecycleFilter, setLifecycleFilter] = useState('active')
  const [visibleJobCount, setVisibleJobCount] = useState(INITIAL_VISIBLE_JOBS)

  useEffect(() => {
    fetchIntelligence()
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

    const [{ data: jobsData }, { data: eventData }, { data: companyData }] = await Promise.all([
      jobsQuery.limit(300),
      supabase.from('job_events').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('companies').select('*').not('name', 'ilike', '%tesla%').order('expansion_score', { ascending: false }).limit(20),
    ])

    setJobs(jobsData || [])
    setEvents(eventData || [])
    setCompanies(companyData || [])
    setVisibleJobCount(INITIAL_VISIBLE_JOBS)
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

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const status = job.lifecycle_status || job.status || 'active'

    return (companyFilter === 'All Companies' || job.company === companyFilter)
      && (sourceFilter === 'All Sources' || (job.source || 'unknown') === sourceFilter)
      && (lifecycleFilter === 'all' || (lifecycleFilter === 'active' && status !== 'removed') || (lifecycleFilter === 'removed' && status === 'removed'))
  }), [jobs, companyFilter, sourceFilter, lifecycleFilter])

  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, visibleJobCount),
    [filteredJobs, visibleJobCount]
  )

  const metrics = useMemo(() => {
    const createdEvents = events.filter((event) => event.event_type === 'created')
    const removedEvents = events.filter((event) => event.event_type === 'removed')
    const uniqueCompanies = new Set(filteredJobs.map((job) => job.company).filter(Boolean))
    const uniqueCities = new Set(filteredJobs.map((job) => job.location).filter(Boolean))

    return {
      activeOpenings: filteredJobs.length,
      companiesHiring: uniqueCompanies.size,
      mappedOpenings: filteredJobs.filter((job) => job.latitude && job.longitude).length,
      hiringVelocity: createdEvents.length,
      removed: removedEvents.length,
      citiesCovered: uniqueCities.size,
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
    <main className="min-h-screen bg-[#090909] text-zinc-100 overflow-hidden">
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.7)]" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">JobTrace</h1>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Labor Market Intelligence</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
            <Link href="/companies" className="hover:text-white transition">Employers</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-zinc-500">Intelligence Query</p>
          <h2 className="mb-2 text-5xl font-bold tracking-tight text-white">{title || 'Northern California Labor Market'}</h2>
          <p className="text-xl text-zinc-400">{location || 'Labor Market Intelligence, not ads.'}</p>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 md:grid-cols-4">
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100">
            {companyOptions.map((option) => <option key={option}>{option}</option>)}
          </select>

          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100">
            {sourceOptions.map((option) => <option key={option}>{option}</option>)}
          </select>

          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value)} className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100">
            <option value="active">Active Only</option>
            <option value="removed">Removed Only</option>
            <option value="all">All Statuses</option>
          </select>

          <button onClick={fetchIntelligence} className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black hover:bg-cyan-300">
            Refresh Data
          </button>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-6">
          {[
            ['Jobs Tracked', metrics.activeOpenings, 'text-cyan-300'],
            ['Companies Hiring', metrics.companiesHiring, 'text-zinc-100'],
            ['Mapped', metrics.mappedOpenings, 'text-green-300'],
            ['New', `+${metrics.hiringVelocity}`, 'text-green-300'],
            ['Removed', metrics.removed, 'text-red-300'],
            ['Cities Covered', metrics.citiesCovered, 'text-zinc-100'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
              <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          <div className="h-[560px] rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Geographic Intelligence</p>
                <h3 className="text-2xl font-semibold text-white">Live Map of Hiring Signals</h3>
              </div>
              <p className="text-sm text-zinc-500">{metrics.mappedOpenings} mapped signals</p>
            </div>
            <JobSignalMap jobs={filteredJobs} />
          </div>

          <div className="h-[560px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Event Stream</p>
            <h3 className="mb-6 text-2xl font-semibold text-white">Market Activity</h3>
            <div className="h-[455px] space-y-4 overflow-y-auto pr-2">
              {loading ? <p className="text-zinc-500">Loading events...</p> : events.map((event) => (
                <Link href={`/jobs/${event.job_id}`} key={event.id} className="block rounded-xl border border-zinc-800 bg-black p-4 transition hover:border-cyan-900">
                  <div className="flex items-start gap-3">
                    <div className={`mt-2 h-2 w-2 rounded-full ${eventColor(event.event_type)}`} />
                    <div>
                      <p className="text-sm text-zinc-200">{event.event_title}</p>
                      <p className="mt-2 text-xs text-zinc-500">{event.event_type.replace('_', ' ')} · {new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">Source Dataset</p>
              <h3 className="text-2xl font-semibold text-white">Job Records</h3>
            </div>
            <p className="text-sm text-zinc-500">Showing {visibleJobs.length} of {filteredJobs.length} records</p>
          </div>

          <div className="space-y-3">
            {visibleJobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-zinc-900 bg-black p-4 transition hover:border-cyan-900">
                <Link href={`/jobs/${job.id}`} className="grid gap-4 md:grid-cols-6 md:items-start">
                  <div className="md:col-span-2">
                    <p className="font-medium text-white">{job.title}</p>
                    <p className="text-sm text-zinc-500">{job.company}</p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400">{job.location}</p>
                  </div>

                  <div>
                    <p className="text-sm text-cyan-300">{formatPay(job)}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Status</p>
                    <p className="text-sm capitalize text-zinc-200">{formatStatus(job)}</p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Last Updated</p>
                    <p className="text-sm text-zinc-200">{new Date(job.last_seen || job.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>

                {(job.description || job.requirements || job.benefits) && (
                  <div className="mt-4 border-t border-zinc-900 pt-4">
                    <CollapsibleText
                      text={job.description || job.requirements || job.benefits}
                      previewCharacters={260}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {visibleJobCount < filteredJobs.length && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleJobCount((count) => count + JOB_INCREMENT)}
                className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-cyan-500 hover:text-white"
              >
                See more records
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
