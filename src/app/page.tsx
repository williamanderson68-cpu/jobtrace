'use client'

import { useEffect, useState } from 'react'
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

    setCompany('')
    setTitle('')
    setLocation('')
    setPay('')
    setUrl('')
    setEmploymentType('')
    setRemoteType('')
    setNotes('')

    await loadJobs()
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

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-4xl font-bold">JobTrace</h1>
        <p className="text-gray-600">
          Track job postings, pay ranges, locations, and company hiring patterns.
        </p>
      </section>

      <section className="border rounded-lg p-5 space-y-4">
        <h2 className="text-2xl font-semibold">Add Job Posting</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Pay Range"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Employment Type"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Remote / Hybrid / Onsite"
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
          />

          <input
            className="border p-2 rounded md:col-span-2"
            placeholder="Job URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <textarea
            className="border p-2 rounded md:col-span-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          Save Job
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-2xl font-semibold">Saved Jobs</h2>

          <input
            className="border p-2 rounded w-full md:w-80"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-bold text-lg">{job.company}</p>
                  <p>{job.title}</p>
                </div>

                <button
                  className="text-red-600 underline"
                  onClick={() => deleteJob(job.id)}
                >
                  Delete
                </button>
              </div>

              <p>{job.location}</p>
              <p>{job.pay_range}</p>
              <p>
                {job.employment_type} {job.remote_type && `• ${job.remote_type}`}
              </p>

              {job.notes && <p className="text-gray-600">{job.notes}</p>}

              {job.url && (
                <a
                  className="underline text-blue-600"
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
    </main>
  )
}