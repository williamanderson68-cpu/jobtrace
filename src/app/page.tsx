'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

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

  async function handleSubmit() {
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
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      setNotes('Imported from structured job posting data')
      setUrl(quickUrl)

      setQuickUrl('')

      alert('Job data imported!')
    } catch {
      alert('Failed to import job')
    }
  }

  function detectSource(url: string) {
    if (url.includes('greenhouse')) return 'Greenhouse'
    if (url.includes('lever')) return 'Lever'
    if (url.includes('ashby')) return 'Ashby'
    if (url.includes('linkedin')) return 'LinkedIn'

    return 'Manual'
  }

  function clearForm() {
    setCompany('')
    setTitle('')
    setLocation('')
    setPay('')
    setUrl('')
    setEmploymentType('')
    setRemoteType('')
    setNotes('')
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

  async function deleteJob(id: number) {
    const confirmed = confirm('Delete this job?')

    if (!confirmed) return

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setJobs((prev) => prev.filter((job) => job.id !== id))
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const metrics = useMemo(() => {
    const uniqueCompanies = new Set(
      jobs.map((job) => job.company).filter(Boolean)
    ).size

    const uniqueLocations = new Set(
      jobs.map((job) => job.location).filter(Boolean)
    ).size

    const remoteJobs = jobs.filter((job) =>
      job.remote_type?.toLowerCase().includes('remote')
    ).length

    const activeJobs = jobs.filter(
      (job) => job.status?.toLowerCase() === 'active'
    ).length

    const repostedJobs = jobs.filter(
      (job) => (job.repost_count || 0) > 0
    ).length

    return {
      totalJobs: jobs.length,
      uniqueCompanies,
      uniqueLocations,
      remoteJobs,
      activeJobs,
      repostedJobs,
    }
  }, [jobs])

  const filteredJobs = jobs.filter((job) => {
    const searchText = search.toLowerCase()

    return (
      job.company?.toLowerCase().includes(searchText) ||
      job.title?.toLowerCase().includes(searchText) ||
      job.location?.toLowerCase().includes(searchText) ||
      job.pay_range?.toLowerCase().includes(searchText) ||
      job.source?.toLowerCase().includes(searchText)
    )
  })

  const topCompanies = Object.entries(
    jobs.reduce<Record<string, number>>((acc, job) => {
      const name = job.company || 'Unknown'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-[#070A12] text-gray-100">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-3xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
              JT
            </div>

            <div>
              <p className="text-blue-300 uppercase tracking-[0.25em] text-sm">
                Hiring Intelligence Platform
              </p>

              <h1 className="text-5xl font-black tracking-tight">
                JobTrace
              </h1>

              <p className="text-gray-400 mt-1">
                Track hiring activity, reposted jobs, locations, and labor market signals.
              </p>
            </div>
          </div>

          <div className="border border-gray-800 bg-gray-900/70 rounded-2xl p-5">
            <p className="text-sm text-gray-400">System Status</p>
            <p className="font-semibold text-green-400">Live + Tracking</p>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Metric label="Tracked Jobs" value={metrics.totalJobs} />
          <Metric label="Companies" value={metrics.uniqueCompanies} />
          <Metric label="Locations" value={metrics.uniqueLocations} />
          <Metric label="Remote" value={metrics.remoteJobs} />
          <Metric label="Active" value={metrics.activeJobs} />
          <Metric label="Reposted" value={metrics.repostedJobs} />
        </section>

        <section className="border border-blue-900/50 bg-blue-950/20 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Quick Import</h2>

            <p className="text-gray-400">
              Paste a job URL and JobTrace will attempt to extract structured hiring data.
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
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 border border-gray-800 bg-gray-900/80 rounded-2xl p-5 space-y-4">
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

          <aside className="border border-gray-800 bg-gray-900/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-2xl font-bold">Top Companies</h2>

            {topCompanies.length === 0 ? (
              <p className="text-gray-500">No tracked companies yet.</p>
            ) : (
              topCompanies.map(([name, count]) => (
                <div
                  key={name}
                  className="flex justify-between border-b border-gray-800 pb-2"
                >
                  <span>{name}</span>
                  <span className="text-blue-300">{count}</span>
                </div>
              ))
            )}

            <div className="pt-4">
              <h3 className="font-semibold">Tracking Pipeline</h3>

              <p className="text-sm text-gray-400 mt-2">
                Import → Extract → Track → Recheck → Detect Reposts
              </p>
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
                className="border border-gray-800 bg-gray-900/80 rounded-2xl p-5 space-y-4 hover:border-blue-800 transition"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold text-xl">{job.company}</p>
                    <p className="text-gray-300">{job.title}</p>
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
                  {job.source && <Badge>{job.source}</Badge>}
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>Status: {job.status || 'active'}</p>

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

                  <p>Reposts Detected: {job.repost_count || 0}</p>
                </div>

                {job.notes && (
                  <p className="text-gray-500 text-sm">{job.notes}</p>
                )}

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

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-2xl p-4">
      <p className="text-sm text-gray-400">{label}</p>

      <p className="text-3xl font-black">{value}</p>
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
      className="bg-gray-950 border border-gray-700 p-3 rounded-xl"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

function Badge({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="border border-gray-700 bg-gray-950 rounded-full px-3 py-1 text-gray-300">
      {children}
    </span>
  )
}