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

type Company = {
  id: string
  name: string
  total_openings: number
  expansion_score: number
}

export default function DashboardClient({ title, location }: { title: string; location: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [events, setEvents] = useState<JobEvent[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('All Companies')
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [lifecycleFilter, setLifecycleFilter] = useState('active')

  useEffect(() => { fetchIntelligence() }, [title, location])

  async function fetchIntelligence() {
    setLoading(true)
    let jobsQuery = supabase.from('jobs').select('*').neq('source', 'manual').not('source', 'is', null).order('last_seen', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
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
    setLoading(false)
  }

  const companyOptions = useMemo(() => ['All Companies', ...Array.from(new Set(jobs.map((job) => job.company))).sort()], [jobs])
  const sourceOptions = useMemo(() => ['All Sources', ...Array.from(new Set(jobs.map((job) => job.source || 'unknown'))).sort()], [jobs])

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const state = job.lifecycle_status || job.status || 'active'
    return (companyFilter === 'All Companies' || job.company === companyFilter)
      && (sourceFilter === 'All Sources' || (job.source || 'unknown') === sourceFilter)
      && (lifecycleFilter === 'all' || (lifecycleFilter === 'active' && state !== 'removed') || (lifecycleFilter === 'removed' && state === 'removed'))
  }), [jobs, companyFilter, sourceFilter, lifecycleFilter])

  const metrics = useMemo(() => {
    const repostEvents = events.filter((event) => event.event_type === 'reposted')
    const createdEvents = events.filter((event) => event.event_type === 'created')
    const removedEvents = events.filter((event) => event.event_type === 'removed')
    return {
      activeOpenings: filteredJobs.length,
      mappedOpenings: filteredJobs.filter((job) => job.latitude && job.longitude).length,
      eventCount: events.length,
      hiringVelocity: createdEvents.length,
      removed: removedEvents.length,
      ghostRisk: repostEvents.length >= 5 ? 'Elevated' : repostEvents.length >= 2 ? 'Moderate' : 'Low',
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
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight">JobTrace Intelligence</h1><p className="text-zinc-500 text-sm mt-1">Live Labor Market Surveillance</p></div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm text-zinc-400 hover:text-cyan-400 transition">Control Center</Link>
            <Link href="/companies" className="text-sm text-zinc-400 hover:text-cyan-400 transition">Employer Directory</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs mb-3">Intelligence Query</p>
          <h2 className="text-5xl font-bold tracking-tight mb-2">{title || 'Northern California Labor Market'}</h2>
          <p className="text-zinc-400 text-xl">{location || 'Imported source data with geocoded labor signals'}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8 bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm">{companyOptions.map((o) => <option key={o}>{o}</option>)}</select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm">{sourceOptions.map((o) => <option key={o}>{o}</option>)}</select>
          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value)} className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm"><option value="active">Active Only</option><option value="removed">Removed Only</option><option value="all">All Lifecycle States</option></select>
          <button onClick={fetchIntelligence} className="rounded-xl bg-cyan-500 text-black font-semibold px-4 py-3 hover:bg-cyan-400">Refresh Intelligence</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
          {[
            ['Openings', metrics.activeOpenings, 'text-cyan-400'],
            ['Mapped', metrics.mappedOpenings, 'text-green-400'],
            ['Events', metrics.eventCount, 'text-cyan-400'],
            ['New', `+${metrics.hiringVelocity}`, 'text-green-400'],
            ['Removed', metrics.removed, 'text-red-400'],
            ['Ghost Risk', metrics.ghostRisk, 'text-amber-400'],
          ].map(([label, value, color]) => <div key={label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5"><p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">{label}</p><h3 className={`text-3xl font-bold ${color}`}>{value}</h3></div>)}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[560px]">
            <div className="flex items-center justify-between mb-6"><div><p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Geographic Intelligence</p><h3 className="text-2xl font-semibold">Live Map of Hiring Signals</h3></div><p className="text-zinc-500 text-sm">{metrics.mappedOpenings} mapped signals</p></div>
            <JobSignalMap jobs={filteredJobs} />
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 h-[560px] overflow-hidden">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Event Stream</p><h3 className="text-2xl font-semibold mb-6">Market Activity</h3>
            <div className="space-y-4 overflow-y-auto pr-2 h-[455px]">
              {loading ? <p className="text-zinc-500">Loading events...</p> : events.map((event) => (
                <Link href={`/jobs/${event.job_id}`} key={event.id} className="block border border-zinc-800 rounded-xl p-4 bg-black hover:border-cyan-900 transition">
                  <div className="flex items-start gap-3"><div className={`h-2 w-2 rounded-full mt-2 animate-pulse ${eventColor(event.event_type)}`} /><div><p className="text-sm text-zinc-200">{event.event_title}</p><p className="text-xs text-zinc-500 mt-2">{event.event_type.replace('_', ' ')} · {new Date(event.created_at).toLocaleString()}</p></div></div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8"><div><p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Source Dataset</p><h3 className="text-2xl font-semibold">Imported Job Records</h3></div><p className="text-zinc-500 text-sm">Showing {filteredJobs.length} filtered records</p></div>
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="grid md:grid-cols-6 gap-4 items-center border border-zinc-900 rounded-xl p-4 bg-black hover:border-cyan-900 transition">
                <div className="md:col-span-2"><p className="font-medium">{job.title}</p><p className="text-zinc-500 text-sm">{job.company}</p></div>
                <div><p className="text-zinc-400 text-sm">{job.location}</p></div>
                <div><p className="text-cyan-400 text-sm">{job.salary || job.pay_range || 'Not Listed'}</p></div>
                <div><p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">State</p><p className="text-sm">{job.lifecycle_status || job.status || 'active'}</p></div>
                <div className="text-right"><p className="text-zinc-500 text-xs uppercase tracking-[0.15em]">Last Seen</p><p className="text-sm">{new Date(job.last_seen || job.created_at).toLocaleDateString()}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
