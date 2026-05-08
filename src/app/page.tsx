'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Job = {
  id: number
  company: string
  title: string
  location: string
  pay_range: string
  url: string
  employment_type: string
  remote_type: string
  notes: string
  created_at: string
  first_seen: string
  last_seen: string
  status: string
  source: string
  repost_count: number
  date_posted: string
  data_quality: string
  imported_at: string
  latitude: number | null
  longitude: number | null
  last_check_status: string
}

export default function Home() {
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [pay, setPay] = useState('')
  const [url, setUrl] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [remoteType, setRemoteType] = useState('')
  const [notes, setNotes] = useState('')
  const [quickUrl, setQuickUrl] = useState('')

  const [jobs, setJobs] = useState<Job[]>([])
  const [search, setSearch] = useState('')
  const [importMethod, setImportMethod] = useState('')

  async function handleSubmit() {
    const now = new Date().toISOString()
    const detectedSource = detectSource(url)

    const { error } = await supabase.from('jobs').insert({
      company,
      title,
      location,
      pay_range: pay,
      url,
      employment_type: employmentType,
      remote_type: remoteType,
      notes,
      source: detectedSource,
      status: 'active',
      first_seen: now,
      last_seen: now,
      data_quality: notes.toLowerCase().includes('imported')
        ? 'imported'
        : 'manual',
      imported_at: notes.toLowerCase().includes('imported') ? now : null,
      last_check_status: 'unchecked',
    })

    if (error) {
      alert(error.message)
      return
    }

    clearForm()
    await loadJobs()
  }

  async function quickTrackUrl() {
    if (!quickUrl) return

    try {
      const response = await fetch('/api/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl }),
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || 'Import failed')
        return
      }

      setCompany(data.company || '')
      setTitle(data.title || '')
      setLocation(data.location || '')
      setEmploymentType(data.employment_type || '')
      setPay(data.pay_range || '')
      setRemoteType('')
      setNotes(
        data.method === 'json-ld'
          ? 'Imported from structured JobPosting data'
          : 'Imported using fallback page metadata — review needed'
      )
      setUrl(quickUrl)
      setImportMethod(data.method || 'unknown')
      setQuickUrl('')

      alert('Job data imported. Review it, then click Save Job.')
    } catch {
      alert('Failed to import job')
    }
  }

  async function updateJobStatus(id: number, status: string) {
    const { error } = await supabase
      .from('jobs')
      .update({
        status,
        last_seen: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadJobs()
  }

  async function markReposted(job: Job) {
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'reposted',
        repost_count: (job.repost_count || 0) + 1,
        last_seen: new Date().toISOString(),
      })
      .eq('id', job.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadJobs()
  }

  async function recheckJob(job: Job) {
    if (!job.url) return

    try {
      const response = await fetch('/api/recheck-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: job.url }),
      })

      const data = await response.json()

      const reachable = data.reachable === true

      const { error } = await supabase
        .from('jobs')
        .update({
          last_seen: data.checkedAt || new Date().toISOString(),
          last_check_status: reachable ? 'reachable' : 'not reachable',
          status: reachable ? job.status || 'active' : 'removed',
        })
        .eq('id', job.id)

      if (error) {
        alert(error.message)
        return
      }

      await loadJobs()
    } catch {
      alert('Recheck failed')
    }
  }

  async function deleteJob(id: number) {
    const confirmed = confirm('Delete this job?')
    if (!confirmed) return

    const { error } = await supabase.from('jobs').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setJobs((prev) => prev.filter((job) => job.id !== id))
  }

  async function loadJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('first_seen', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setJobs(data || [])
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  function clearForm() {
    setCompany('')
    setTitle('')
    setLocation('')
    setPay('')
    setUrl('')
    setEmploymentType('')
    setRemoteType('')
    setNotes('')
    setImportMethod('')
  }

  const metrics = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return {
      tracked: jobs.length,
      active: jobs.filter((job) => (job.status || 'active') === 'active').length,
      removed: jobs.filter((job) => job.status === 'removed').length,
      reposted: jobs.filter((job) => (job.repost_count || 0) > 0).length,
      imported: jobs.filter((job) => job.data_quality === 'imported').length,
      newThisWeek: jobs.filter(
        (job) => job.first_seen && new Date(job.first_seen) >= sevenDaysAgo
      ).length,
      companies: new Set(jobs.map((job) => job.company).filter(Boolean)).size,
      locations: new Set(jobs.map((job) => job.location).filter(Boolean)).size,
    }
  }, [jobs])

  const filteredJobs = jobs.filter((job) => {
    const text = search.toLowerCase()

    return (
      job.company?.toLowerCase().includes(text) ||
      job.title?.toLowerCase().includes(text) ||
      job.location?.toLowerCase().includes(text) ||
      job.pay_range?.toLowerCase().includes(text) ||
      job.source?.toLowerCase().includes(text) ||
      job.status?.toLowerCase().includes(text)
    )
  })

  const sourceData = Object.entries(
    jobs.reduce<Record<string, number>>((acc, job) => {
      const source = job.source || detectSource(job.url || '')
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const locationData = Object.entries(
    jobs.reduce<Record<string, number>>((acc, job) => {
      const locationName = job.location || 'Unknown'
      acc[locationName] = (acc[locationName] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, jobs]) => ({ name, jobs }))

  const statusData = [
    { name: 'Active', value: metrics.active },
    { name: 'Removed', value: metrics.removed },
    { name: 'Reposted', value: metrics.reposted },
  ].filter((item) => item.value > 0)

  return (
    <main className="min-h-screen bg-[#070A12] text-gray-100">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <header className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <section className="lg:col-span-4 border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950/40 rounded-3xl p-8 space-y-5">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-3xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
                JT
              </div>

              <div>
                <p className="text-blue-300 uppercase tracking-[0.25em] text-sm">
                  Hiring Intelligence Platform
                </p>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight">
                  JobTrace
                </h1>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-3xl">
              Track job postings, identify reposts, monitor hiring activity, and
              turn public job data into private-sector labor market intelligence.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              <Badge>URL Importer</Badge>
              <Badge>Repost Tracking</Badge>
              <Badge>Source Analytics</Badge>
              <Badge>Location Intelligence</Badge>
              <Badge>Recheck Engine</Badge>
            </div>
          </section>

          <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-400">System Status</p>
              <p className="text-2xl font-black text-green-400">Live</p>
            </div>

            <div className="text-sm text-gray-400">
              <p>Database connected</p>
              <p>Importer enabled</p>
              <p>Vercel deployed</p>
            </div>
          </section>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Metric label="Tracked" value={metrics.tracked} />
          <Metric label="Active" value={metrics.active} />
          <Metric label="Removed" value={metrics.removed} />
          <Metric label="Reposted" value={metrics.reposted} />
          <Metric label="New Week" value={metrics.newThisWeek} />
          <Metric label="Imported" value={metrics.imported} />
          <Metric label="Companies" value={metrics.companies} />
          <Metric label="Locations" value={metrics.locations} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Jobs by Location">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" hide />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="jobs" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Source Breakdown">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90}>
                  {sourceData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Status Mix">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="border border-blue-900/50 bg-blue-950/20 rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Quick Import</h2>
            <p className="text-gray-400">
              Paste a job URL. JobTrace tries structured JobPosting data first,
              then falls back to page metadata.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="flex-1 bg-gray-950 border border-gray-700 p-3 rounded-xl"
              placeholder="Paste job posting URL..."
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
            />

            <button
              className="bg-blue-500 hover:bg-blue-400 px-5 py-3 rounded-xl font-semibold"
              onClick={quickTrackUrl}
            >
              Import Job
            </button>
          </div>

          {importMethod && (
            <p className="text-sm text-blue-300">
              Last import method: {importMethod}
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 border border-gray-800 bg-gray-900/80 rounded-3xl p-6 space-y-4">
            <h2 className="text-2xl font-bold">Add Job Posting</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Company" value={company} setValue={setCompany} />
              <Input placeholder="Job Title" value={title} setValue={setTitle} />
              <Input placeholder="Location" value={location} setValue={setLocation} />
              <Input placeholder="Pay Range" value={pay} setValue={setPay} />
              <Input placeholder="Employment Type" value={employmentType} setValue={setEmploymentType} />
              <Input placeholder="Remote / Hybrid / Onsite" value={remoteType} setValue={setRemoteType} />

              <input
                className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2"
                placeholder="Job URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <textarea
                className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="bg-white text-black px-5 py-3 rounded-xl font-semibold"
              onClick={handleSubmit}
            >
              Save Job
            </button>
          </section>

          <aside className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 space-y-4">
            <h2 className="text-2xl font-bold">Geo Intelligence</h2>
            <div className="relative h-72 rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,#2563eb,transparent_25%),radial-gradient(circle_at_65%_45%,#14b8a6,transparent_20%),radial-gradient(circle_at_45%_70%,#8b5cf6,transparent_18%)]" />
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div key={index} className="border border-gray-700" />
                ))}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-bold">Map foundation ready</p>
                <p className="text-sm text-gray-400">
                  Next step: geocode locations into latitude/longitude and render
                  real pins.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h2 className="text-2xl font-bold">Tracked Jobs</h2>

            <input
              className="bg-gray-900 border border-gray-700 p-3 rounded-xl w-full lg:w-96"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-800 bg-gray-900/80 rounded-3xl p-5 space-y-4 hover:border-blue-800 transition"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold text-xl">{job.company || 'Unknown Company'}</p>
                    <p className="text-gray-300">{job.title || 'Untitled Role'}</p>
                  </div>

                  <button
                    className="text-red-400 underline"
                    onClick={() => deleteJob(job.id)}
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  {job.location && <Badge>{job.location}</Badge>}
                  {job.pay_range && <Badge>{job.pay_range}</Badge>}
                  {job.employment_type && <Badge>{job.employment_type}</Badge>}
                  {job.remote_type && <Badge>{job.remote_type}</Badge>}
                  <Badge>{job.source || detectSource(job.url || '')}</Badge>
                  <Badge>{job.status || 'active'}</Badge>
                  <Badge>{job.data_quality || 'manual'}</Badge>
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>Tracked for: {getDaysTracked(job.first_seen)} days</p>
                  <p>
                    First Seen:{' '}
                    {job.first_seen
                      ? new Date(job.first_seen).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                  <p>
                    Last Checked:{' '}
                    {job.last_seen
                      ? new Date(job.last_seen).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                  <p>Last Check Status: {job.last_check_status || 'unchecked'}</p>
                  <p>Reposts Detected: {job.repost_count || 0}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="border border-green-700 text-green-300 px-3 py-1 rounded-full text-sm"
                    onClick={() => updateJobStatus(job.id, 'active')}
                  >
                    Active
                  </button>

                  <button
                    className="border border-yellow-700 text-yellow-300 px-3 py-1 rounded-full text-sm"
                    onClick={() => updateJobStatus(job.id, 'removed')}
                  >
                    Removed
                  </button>

                  <button
                    className="border border-blue-700 text-blue-300 px-3 py-1 rounded-full text-sm"
                    onClick={() => markReposted(job)}
                  >
                    Reposted
                  </button>

                  <button
                    className="border border-purple-700 text-purple-300 px-3 py-1 rounded-full text-sm"
                    onClick={() => recheckJob(job)}
                  >
                    Recheck URL
                  </button>
                </div>

                {job.notes && <p className="text-gray-500 text-sm">{job.notes}</p>}

                {job.url && (
                  <a
                    className="inline-block underline text-blue-400"
                    href={job.url}
                    target="_blank"
                  >
                    View Posting
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

const chartColors = ['#60a5fa', '#34d399', '#a78bfa', '#fbbf24', '#f87171']

function detectSource(url: string) {
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes('greenhouse')) return 'Greenhouse'
  if (lowerUrl.includes('lever')) return 'Lever'
  if (lowerUrl.includes('ashby')) return 'Ashby'
  if (lowerUrl.includes('linkedin')) return 'LinkedIn'
  if (lowerUrl.includes('indeed')) return 'Indeed'
  if (lowerUrl.includes('workday')) return 'Workday'

  return url ? 'Other' : 'Manual'
}

function getDaysTracked(firstSeen: string) {
  if (!firstSeen) return 0

  const first = new Date(firstSeen)
  const now = new Date()
  const difference = now.getTime() - first.getTime()

  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)))
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-2xl p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-5">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Input({
  placeholder,
  value,
  setValue,
}: {
  placeholder: string
  value: string
  setValue: (value: string) => void
}) {
  return (
    <input
      className="bg-gray-950 border border-gray-700 p-3 rounded-xl"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-gray-700 bg-gray-950 rounded-full px-3 py-1 text-gray-300">
      {children}
    </span>
  )
}
