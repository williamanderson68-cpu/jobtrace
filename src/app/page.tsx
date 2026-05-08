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
    const { error } = await supabase.from('jobs').insert({
      company,
      title,
      location,
      pay_range: pay,
      url,
      employment_type: employmentType,
      remote_type: remoteType,
      notes,
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

    const { error } = await supabase.from('jobs').insert({
      company: 'Unknown Company',
      title: 'Job link imported',
      location: 'Unknown Location',
      pay_range: '',
      url: quickUrl,
      employment_type: '',
      remote_type: '',
      notes: 'Imported from quick URL tracker. Auto-extraction coming later.',
    })

    if (error) {
      alert(error.message)
      return
    }

    setQuickUrl('')
    await loadJobs()
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
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setJobs(data || [])
    }
  }

  async function deleteJob(id: number) {
    const { error } = await supabase.from('jobs').delete().eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadJobs()
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

    const hybridJobs = jobs.filter((job) =>
      job.remote_type?.toLowerCase().includes('hybrid')
    ).length

    const onsiteJobs = jobs.filter((job) =>
      job.remote_type?.toLowerCase().includes('onsite')
    ).length

    return {
      totalJobs: jobs.length,
      uniqueCompanies,
      uniqueLocations,
      remoteJobs,
      hybridJobs,
      onsiteJobs,
    }
  }, [jobs])

  const filteredJobs = jobs.filter((job) => {
    const searchText = search.toLowerCase()

    return (
      job.company?.toLowerCase().includes(searchText) ||
      job.title?.toLowerCase().includes(searchText) ||
      job.location?.toLowerCase().includes(searchText) ||
      job.pay_range?.toLowerCase().includes(searchText) ||
      job.employment_type?.toLowerCase().includes(searchText) ||
      job.remote_type?.toLowerCase().includes(searchText) ||
      job.notes?.toLowerCase().includes(searchText)
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
      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl shadow-lg">
              JT
            </div>

            <div>
              <p className="text-sm text-blue-300 uppercase tracking-[0.25em]">
                Hiring Intelligence
              </p>
              <h1 className="text-5xl font-black tracking-tight">JobTrace</h1>
              <p className="text-gray-400 mt-1">
                Track job postings, pay movement, locations, and hiring signals.
              </p>
            </div>
          </div>

          <div className="border border-gray-800 bg-gray-900/70 rounded-2xl p-4">
            <p className="text-sm text-gray-400">Live Deployment</p>
            <p className="font-semibold text-green-400">Connected</p>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Metric label="Total Jobs" value={metrics.totalJobs} />
          <Metric label="Companies" value={metrics.uniqueCompanies} />
          <Metric label="Locations" value={metrics.uniqueLocations} />
          <Metric label="Remote" value={metrics.remoteJobs} />
          <Metric label="Hybrid" value={metrics.hybridJobs} />
          <Metric label="Onsite" value={metrics.onsiteJobs} />
        </section>

        <section className="border border-blue-900/60 bg-blue-950/20 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Quick Track a Job Link</h2>
            <p className="text-gray-400">
              Paste a job URL now. Later this becomes the auto-extraction/scraping pipeline.
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
              className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-3 rounded-xl font-semibold"
              onClick={quickTrackUrl}
            >
              Track Link
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
              <p className="text-gray-500">No company data yet.</p>
            ) : (
              topCompanies.map(([name, count]) => (
                <div key={name} className="flex justify-between border-b border-gray-800 pb-2">
                  <span>{name}</span>
                  <span className="text-blue-300">{count}</span>
                </div>
              ))
            )}

            <div className="pt-4">
              <h3 className="font-semibold">Next Pipeline</h3>
              <p className="text-sm text-gray-400 mt-1">
                URL import → metadata extraction → location mapping → trend dashboard.
              </p>
            </div>
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-2xl font-bold">Saved Jobs</h2>

            <input
              className="bg-gray-900 border border-gray-700 p-3 rounded-xl w-full md:w-96"
              placeholder="Search company, title, location, pay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-800 bg-gray-900/80 rounded-2xl p-5 space-y-3 hover:border-blue-800 transition"
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
                </div>

                {job.notes && <p className="text-gray-500">{job.notes}</p>}

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

function Metric({ label, value }: { label: string; value: number }) {
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-gray-700 bg-gray-950 rounded-full px-3 py-1 text-gray-300">
      {children}
    </span>
  )
}
