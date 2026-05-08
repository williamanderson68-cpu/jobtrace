'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info')

  async function handleSubmit() {
    if (!company && !title && !url) {
      showStatus('Add at least a company, title, or URL before saving.', 'error')
      return
    }

    setIsSaving(true)
    showStatus('Saving job posting...', 'info')

    const now = new Date().toISOString()
    const detectedSource = detectSource(url)

    const { error } = await supabase.from('jobs').insert({
      company: company || 'Unknown Company',
      title: title || 'Untitled Role',
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
      data_quality: notes.toLowerCase().includes('imported') ? 'imported' : 'manual',
      imported_at: notes.toLowerCase().includes('imported') ? now : null,
      last_check_status: 'unchecked',
      repost_count: 0,
    })

    if (error) {
      showStatus(error.message, 'error')
      setIsSaving(false)
      return
    }

    clearForm()
    await loadJobs()
    showStatus('Job saved successfully.', 'success')
    setIsSaving(false)
  }

  async function quickTrackUrl() {
    if (!quickUrl.trim()) {
      showStatus('Paste a job posting URL first.', 'error')
      return
    }

    setIsImporting(true)
    showStatus('Importing job posting...', 'info')

    try {
      const response = await fetch('/api/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrl }),
      })

      const data = await response.json()

      if (!data.success) {
        showStatus(data.message || 'Failed to import job posting.', 'error')
        setIsImporting(false)
        return
      }

      setCompany(data.company || '')
      setTitle(data.title || '')
      setLocation(data.location || '')
      setEmploymentType(data.employment_type || '')
      setPay(data.pay_range || '')
      setRemoteType(data.remote_type || '')
      setNotes(
        data.method === 'json-ld'
          ? 'Imported from structured JobPosting data'
          : 'Imported using fallback page metadata — review needed'
      )
      setUrl(quickUrl)
      setImportMethod(data.method || 'unknown')
      setQuickUrl('')

      showStatus('Job imported successfully. Review the data, then click Save Job.', 'success')
    } catch {
      showStatus('Failed to import job posting.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  async function updateJobStatus(id: number, status: string) {
    showStatus(`Updating job status to ${status}...`, 'info')

    const { error } = await supabase
      .from('jobs')
      .update({
        status,
        last_seen: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    await loadJobs()
    showStatus(`Job marked as ${status}.`, 'success')
  }

  async function markReposted(job: Job) {
    showStatus('Marking job as reposted...', 'info')

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'reposted',
        repost_count: (job.repost_count || 0) + 1,
        last_seen: new Date().toISOString(),
      })
      .eq('id', job.id)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    await loadJobs()
    showStatus('Repost recorded.', 'success')
  }

  async function recheckJob(job: Job) {
    if (!job.url) {
      showStatus('This job does not have a URL to recheck.', 'error')
      return
    }

    showStatus('Rechecking job URL...', 'info')

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
        showStatus(error.message, 'error')
        return
      }

      await loadJobs()
      showStatus(reachable ? 'Posting is reachable.' : 'Posting may be removed.', reachable ? 'success' : 'error')
    } catch {
      showStatus('Recheck failed.', 'error')
    }
  }

  async function deleteJob(id: number) {
    const confirmed = confirm('Delete this job?')
    if (!confirmed) return

    showStatus('Deleting job...', 'info')

    const { error } = await supabase.from('jobs').delete().eq('id', id)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    setJobs((prev) => prev.filter((job) => job.id !== id))
    showStatus('Job deleted.', 'success')
  }

  async function loadJobs() {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('first_seen', { ascending: false })

    if (error) {
      showStatus(error.message, 'error')
    } else {
      setJobs(data || [])
    }

    setIsLoading(false)
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

  function showStatus(message: string, tone: 'info' | 'success' | 'error') {
    setStatusMessage(message)
    setStatusTone(tone)
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
          <section className="lg:col-span-4 border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950/40 rounded-3xl p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
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

              <div className="flex gap-2 flex-wrap">
                <Badge>Proof of Concept</Badge>
                <Badge>{jobs.length} Jobs Tracked</Badge>
                <Badge>{metrics.active} Active</Badge>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-3xl">
              Track job postings over time. Monitor compensation, reposts,
              hiring trends, location patterns, and job market activity.
            </p>

            <div className="border border-gray-800 bg-gray-900/60 rounded-2xl p-4 text-sm text-gray-300">
              <p className="font-semibold mb-2 text-white">How it works</p>

              <ul className="space-y-1 text-gray-400">
                <li>• Paste a job posting URL</li>
                <li>• JobTrace extracts available metadata</li>
                <li>• Save the posting into your database</li>
                <li>• Track status changes, reposts, and trends over time</li>
              </ul>
            </div>

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

            <div className="text-sm text-gray-400 space-y-1">
              <p>Database connected</p>
              <p>Importer enabled</p>
              <p>Dashboard active</p>
              <p>Vercel ready</p>
            </div>
          </section>
        </header>

        {statusMessage && (
          <div className={statusClasses(statusTone)}>
            {statusMessage}
          </div>
        )}

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
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={locationData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="name"
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={75}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Import jobs to see location trends." />
            )}
          </ChartCard>

          <ChartCard title="Source Breakdown">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Import jobs to see source data." />
            )}
          </ChartCard>

          <ChartCard title="Status Mix">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Saved jobs will appear here." />
            )}
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
              className="flex-1 bg-gray-950 border border-gray-700 p-3 rounded-xl outline-none focus:border-blue-500"
              placeholder="Paste job posting URL..."
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
            />

            <button
              className="bg-blue-500 hover:bg-blue-400 disabled:bg-gray-700 disabled:text-gray-400 px-5 py-3 rounded-xl font-semibold transition"
              onClick={quickTrackUrl}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Job'}
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">Review / Add Job Posting</h2>
                <p className="text-gray-400 text-sm">
                  Imported data lands here before it is saved.
                </p>
              </div>

              <button
                className="border border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
                onClick={clearForm}
              >
                Clear Form
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Company" value={company} setValue={setCompany} />
              <Input placeholder="Job Title" value={title} setValue={setTitle} />
              <Input placeholder="Location" value={location} setValue={setLocation} />
              <Input placeholder="Pay Range" value={pay} setValue={setPay} />
              <Input placeholder="Employment Type" value={employmentType} setValue={setEmploymentType} />
              <Input placeholder="Remote / Hybrid / Onsite" value={remoteType} setValue={setRemoteType} />

              <input
                className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2 outline-none focus:border-blue-500"
                placeholder="Job URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <textarea
                className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2 outline-none focus:border-blue-500 min-h-24"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-300 px-5 py-3 rounded-xl font-semibold transition"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Job'}
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
                  Next step: geocode locations into latitude/longitude and render real pins.
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-2">
              <p className="text-white font-semibold">Why this matters</p>
              <p>
                Once locations are normalized, JobTrace can show hiring clusters,
                regional pay differences, and where companies repeatedly repost roles.
              </p>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Tracked Jobs</h2>
              <p className="text-gray-400 text-sm">
                Search, recheck, mark reposted, or remove saved jobs.
              </p>
            </div>

            <input
              className="bg-gray-900 border border-gray-700 p-3 rounded-xl w-full lg:w-96 outline-none focus:border-blue-500"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading && (
            <div className="border border-gray-800 bg-gray-900/80 rounded-3xl p-10 text-center text-gray-400">
              Loading jobs...
            </div>
          )}

          {!isLoading && jobs.length === 0 && (
            <div className="border border-dashed border-gray-700 rounded-3xl p-10 text-center text-gray-500">
              <p className="text-lg font-semibold mb-2 text-gray-300">
                No jobs tracked yet
              </p>

              <p>
                Import your first job posting URL to begin building your market dataset.
              </p>
            </div>
          )}

          {!isLoading && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="border border-dashed border-gray-700 rounded-3xl p-10 text-center text-gray-500">
              No jobs match your search.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-800 bg-gray-900/80 rounded-3xl p-5 space-y-4 hover:border-blue-800 transition shadow-xl"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {job.company || 'Unknown Company'}
                    </h3>
                    <p className="text-lg text-gray-300">
                      {job.title || 'Untitled Role'}
                    </p>
                  </div>

                  <button
                    className="text-red-400 hover:text-red-300 underline text-sm"
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
                  <Badge>Tracked {getDaysTracked(job.first_seen)} days</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400">
                  <Info label="First Seen" value={formatDate(job.first_seen)} />
                  <Info label="Last Checked" value={formatDate(job.last_seen)} />
                  <Info label="Check Status" value={job.last_check_status || 'unchecked'} />
                  <Info label="Reposts" value={String(job.repost_count || 0)} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <ActionButton tone="green" onClick={() => updateJobStatus(job.id, 'active')}>
                    Active
                  </ActionButton>

                  <ActionButton tone="yellow" onClick={() => updateJobStatus(job.id, 'removed')}>
                    Removed
                  </ActionButton>

                  <ActionButton tone="blue" onClick={() => markReposted(job)}>
                    Reposted
                  </ActionButton>

                  <ActionButton tone="purple" onClick={() => recheckJob(job)}>
                    Recheck URL
                  </ActionButton>
                </div>

                {job.notes && (
                  <p className="text-gray-500 text-sm border-t border-gray-800 pt-3">
                    {job.notes}
                  </p>
                )}

                {job.url && (
                  <a
                    className="inline-block underline text-blue-400 hover:text-blue-300"
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Posting
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center text-gray-600 text-sm pb-10">
          JobTrace • Built with Next.js, Supabase, and Recharts
        </footer>
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

function formatDate(value: string) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleDateString()
}

function statusClasses(tone: 'info' | 'success' | 'error') {
  if (tone === 'success') {
    return 'border border-green-800 bg-green-950/40 text-green-200 rounded-2xl p-4'
  }

  if (tone === 'error') {
    return 'border border-red-800 bg-red-950/40 text-red-200 rounded-2xl p-4'
  }

  return 'border border-blue-800 bg-blue-950/40 text-blue-200 rounded-2xl p-4'
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-2xl p-4 shadow-lg">
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
  children: ReactNode
}) {
  return (
    <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-5 shadow-xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-80 flex items-center justify-center text-center text-gray-500 border border-dashed border-gray-800 rounded-2xl">
      {message}
    </div>
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
      className="bg-gray-950 border border-gray-700 p-3 rounded-xl outline-none focus:border-blue-500"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="border border-gray-700 bg-gray-950 rounded-full px-3 py-1 text-gray-300">
      {children}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-800 bg-gray-950/60 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  tone,
}: {
  children: ReactNode
  onClick: () => void
  tone: 'green' | 'yellow' | 'blue' | 'purple'
}) {
  const classes = {
    green: 'border-green-700 text-green-300 hover:bg-green-950',
    yellow: 'border-yellow-700 text-yellow-300 hover:bg-yellow-950',
    blue: 'border-blue-700 text-blue-300 hover:bg-blue-950',
    purple: 'border-purple-700 text-purple-300 hover:bg-purple-950',
  }

  return (
    <button
      className={`border px-3 py-1 rounded-full text-sm transition ${classes[tone]}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}