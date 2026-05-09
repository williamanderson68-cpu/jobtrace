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

type JobSnapshot = {
  id: number
  job_id: number
  company: string
  title: string
  location: string
  pay_range: string
  status: string
  source: string
  url: string
  remote_type: string
  employment_type: string
  snapshot_type: string
  notes: string
  created_at: string
}

type StatusTone = 'info' | 'success' | 'error'

type JobDraft = {
  company: string
  title: string
  location: string
  pay_range: string
  url: string
  employment_type: string
  remote_type: string
  notes: string
}

const emptyDraft: JobDraft = {
  company: '',
  title: '',
  location: '',
  pay_range: '',
  url: '',
  employment_type: '',
  remote_type: '',
  notes: '',
}

export default function Home() {
  const [draft, setDraft] = useState<JobDraft>(emptyDraft)
  const [quickUrl, setQuickUrl] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [snapshots, setSnapshots] = useState<JobSnapshot[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [remoteFilter, setRemoteFilter] = useState('all')
  const [importMethod, setImportMethod] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [editDraft, setEditDraft] = useState<JobDraft>(emptyDraft)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecheckingAll, setIsRecheckingAll] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState<StatusTone>('info')

  useEffect(() => {
    loadJobs()
    // loadJobs is intentionally called once on initial page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    await loadSnapshots()
    setIsLoading(false)
  }

  async function loadSnapshots() {
    const { data, error } = await supabase
      .from('job_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) {
      setSnapshots(data || [])
    }
  }

  async function handleSubmit() {
    if (!draft.company && !draft.title && !draft.url) {
      showStatus('Add at least a company, title, or URL before saving.', 'error')
      return
    }

    const duplicate = findDuplicateUrl(draft.url)
    if (duplicate) {
      showStatus(`This URL is already tracked for ${duplicate.company || 'this company'}.`, 'error')
      return
    }

    setIsSaving(true)
    showStatus('Saving job posting...', 'info')

    const now = new Date().toISOString()
    const detectedSource = detectSource(draft.url)

    const insertPayload = {
      company: draft.company || 'Unknown Company',
      title: draft.title || 'Untitled Role',
      location: draft.location,
      pay_range: draft.pay_range,
      url: draft.url,
      employment_type: draft.employment_type,
      remote_type: draft.remote_type,
      notes: draft.notes,
      source: detectedSource,
      status: 'active',
      first_seen: now,
      last_seen: now,
      data_quality: draft.notes.toLowerCase().includes('imported') ? 'imported' : 'manual',
      imported_at: draft.notes.toLowerCase().includes('imported') ? now : null,
      last_check_status: 'unchecked',
      repost_count: 0,
    }

    const { data: insertedJob, error } = await supabase
      .from('jobs')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      showStatus(error.message, 'error')
      setIsSaving(false)
      return
    }

    if (insertedJob) {
      await createSnapshot(insertedJob, 'created', 'Job first saved into JobTrace.')
    }

    clearForm()
    await loadJobs()
    showStatus('Job saved successfully.', 'success')
    setIsSaving(false)
  }

  async function quickTrackUrl() {
    const normalizedUrl = quickUrl.trim()

    if (!normalizedUrl) {
      showStatus('Paste a job posting URL first.', 'error')
      return
    }

    const duplicate = findDuplicateUrl(normalizedUrl)
    if (duplicate) {
      showStatus(`Already tracking this posting: ${duplicate.company || 'Unknown Company'} — ${duplicate.title || 'Untitled Role'}.`, 'error')
      return
    }

    setIsImporting(true)
    showStatus('Importing job posting...', 'info')

    try {
      const response = await fetch('/api/import-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      })

      const data = await response.json()

      if (!data.success) {
        showStatus(data.message || data.error || 'Failed to import job posting.', 'error')
        setIsImporting(false)
        return
      }

      setDraft({
        company: data.company || '',
        title: data.title || '',
        location: data.location || '',
        employment_type: data.employment_type || '',
        pay_range: data.pay_range || '',
        remote_type: data.remote_type || '',
        notes:
          data.method === 'json-ld'
            ? 'Imported from structured JobPosting data.'
            : 'Imported using page metadata. Review before saving.',
        url: normalizedUrl,
      })
      setImportMethod(data.method || 'unknown')
      setQuickUrl('')

      showStatus('Job imported. Review the fields, then save it.', 'success')
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

    const job = jobs.find((item) => item.id === id)
    if (job) {
      await createSnapshot({ ...job, status, last_seen: new Date().toISOString() }, 'status_changed', `Status changed to ${status}.`)
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

    await createSnapshot(
      { ...job, status: 'reposted', repost_count: (job.repost_count || 0) + 1, last_seen: new Date().toISOString() },
      'reposted',
      'Repost count increased.'
    )

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

      await createSnapshot(
        {
          ...job,
          last_seen: data.checkedAt || new Date().toISOString(),
          last_check_status: reachable ? 'reachable' : 'not reachable',
          status: reachable ? job.status || 'active' : 'removed',
        },
        'rechecked',
        reachable ? 'URL was reachable.' : 'URL was not reachable.'
      )

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

  function startEditing(job: Job) {
    setEditingId(job.id)
    setEditDraft({
      company: job.company || '',
      title: job.title || '',
      location: job.location || '',
      pay_range: job.pay_range || '',
      url: job.url || '',
      employment_type: job.employment_type || '',
      remote_type: job.remote_type || '',
      notes: job.notes || '',
    })
  }

  async function saveEditedJob(id: number) {
    const duplicate = findDuplicateUrl(editDraft.url, id)
    if (duplicate) {
      showStatus('Another saved job already uses that URL.', 'error')
      return
    }

    showStatus('Saving edits...', 'info')

    const { error } = await supabase
      .from('jobs')
      .update({
        company: editDraft.company || 'Unknown Company',
        title: editDraft.title || 'Untitled Role',
        location: editDraft.location,
        pay_range: editDraft.pay_range,
        url: editDraft.url,
        employment_type: editDraft.employment_type,
        remote_type: editDraft.remote_type,
        notes: editDraft.notes,
        source: detectSource(editDraft.url),
      })
      .eq('id', id)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    const originalJob = jobs.find((job) => job.id === id)
    if (originalJob) {
      await createSnapshot(
        {
          ...originalJob,
          company: editDraft.company || 'Unknown Company',
          title: editDraft.title || 'Untitled Role',
          location: editDraft.location,
          pay_range: editDraft.pay_range,
          url: editDraft.url,
          employment_type: editDraft.employment_type,
          remote_type: editDraft.remote_type,
          notes: editDraft.notes,
          source: detectSource(editDraft.url),
        },
        'edited',
        'Saved job fields were edited.'
      )
    }

    setEditingId(null)
    setEditDraft(emptyDraft)
    await loadJobs()
    showStatus('Job updated.', 'success')
  }

  async function createSnapshot(job: Job, snapshotType: string, snapshotNotes = '') {
    await supabase.from('job_snapshots').insert({
      job_id: job.id,
      company: job.company || '',
      title: job.title || '',
      location: job.location || '',
      pay_range: job.pay_range || '',
      status: job.status || 'active',
      source: job.source || detectSource(job.url || ''),
      url: job.url || '',
      remote_type: job.remote_type || '',
      employment_type: job.employment_type || '',
      snapshot_type: snapshotType,
      notes: snapshotNotes,
    })
  }

  async function recheckAllJobs() {
    const jobsWithUrls = filteredJobs.filter((job) => job.url)

    if (jobsWithUrls.length === 0) {
      showStatus('No filtered jobs have URLs to recheck.', 'error')
      return
    }

    setIsRecheckingAll(true)
    showStatus(`Rechecking ${jobsWithUrls.length} job URLs...`, 'info')

    let reachableCount = 0
    let removedCount = 0

    for (const job of jobsWithUrls) {
      try {
        const response = await fetch('/api/recheck-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: job.url }),
        })

        const data = await response.json()
        const reachable = data.reachable === true
        if (reachable) reachableCount += 1
        if (!reachable) removedCount += 1

        const updatedJob = {
          ...job,
          last_seen: data.checkedAt || new Date().toISOString(),
          last_check_status: reachable ? 'reachable' : 'not reachable',
          status: reachable ? job.status || 'active' : 'removed',
        }

        await supabase
          .from('jobs')
          .update({
            last_seen: updatedJob.last_seen,
            last_check_status: updatedJob.last_check_status,
            status: updatedJob.status,
          })
          .eq('id', job.id)

        await createSnapshot(updatedJob, 'rechecked', reachable ? 'URL was reachable.' : 'URL was not reachable.')
      } catch {
        removedCount += 1
      }
    }

    await loadJobs()
    setIsRecheckingAll(false)
    showStatus(`Recheck complete: ${reachableCount} reachable, ${removedCount} not reachable.`, 'success')
  }

  async function loadDemoData() {
    const confirmed = confirm('Load sample demo jobs into your database? You can delete them later.')
    if (!confirmed) return

    setIsLoadingDemo(true)
    showStatus('Loading demo jobs...', 'info')

    const now = new Date().toISOString()
    const demoJobs = [
      {
        company: 'Northstar Construction Analytics',
        title: 'Project Manager',
        location: 'Oakland, CA',
        pay_range: '$95,000 - $125,000',
        url: 'https://example.com/jobtrace-demo/project-manager',
        employment_type: 'Full-time',
        remote_type: 'Onsite',
        notes: 'Demo record. Delete when no longer needed.',
        source: 'Demo',
        status: 'active',
      },
      {
        company: 'Bay Area Water Systems',
        title: 'Operations Coordinator',
        location: 'Walnut Creek, CA',
        pay_range: '$72,000 - $88,000',
        url: 'https://example.com/jobtrace-demo/ops-coordinator',
        employment_type: 'Full-time',
        remote_type: 'Hybrid',
        notes: 'Demo record showing a hybrid role.',
        source: 'Demo',
        status: 'active',
      },
      {
        company: 'Atlas Infrastructure Group',
        title: 'Estimator',
        location: 'Sacramento, CA',
        pay_range: '$85,000 - $110,000',
        url: 'https://example.com/jobtrace-demo/estimator',
        employment_type: 'Full-time',
        remote_type: 'Hybrid',
        notes: 'Demo record showing compensation tracking.',
        source: 'Demo',
        status: 'reposted',
        repost_count: 2,
      },
      {
        company: 'Clearpath Environmental',
        title: 'Field Technician',
        location: 'San Jose, CA',
        pay_range: '$32 - $42/hr',
        url: 'https://example.com/jobtrace-demo/field-technician',
        employment_type: 'Full-time',
        remote_type: 'Onsite',
        notes: 'Demo record showing hourly compensation.',
        source: 'Demo',
        status: 'removed',
      },
    ]

    const existingUrls = new Set(jobs.map((job) => normalizeUrl(job.url)))
    const newRows = demoJobs
      .filter((job) => !existingUrls.has(normalizeUrl(job.url)))
      .map((job) => ({
        repost_count: 0,
        data_quality: 'demo',
        imported_at: now,
        first_seen: now,
        last_seen: now,
        last_check_status: 'demo',
        ...job,
      }))

    if (newRows.length === 0) {
      showStatus('Demo data is already loaded.', 'info')
      setIsLoadingDemo(false)
      return
    }

    const { data, error } = await supabase.from('jobs').insert(newRows).select('*')

    if (error) {
      showStatus(error.message, 'error')
      setIsLoadingDemo(false)
      return
    }

    if (data) {
      for (const job of data) {
        await createSnapshot(job, 'demo_loaded', 'Demo job added.')
      }
    }

    await loadJobs()
    setIsLoadingDemo(false)
    showStatus(`Loaded ${newRows.length} demo jobs.`, 'success')
  }

  function clearForm() {
    setDraft(emptyDraft)
    setImportMethod('')
  }

  function showStatus(message: string, tone: StatusTone) {
    setStatusMessage(message)
    setStatusTone(tone)
  }

  function updateDraft(field: keyof JobDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function updateEditDraft(field: keyof JobDraft, value: string) {
    setEditDraft((current) => ({ ...current, [field]: value }))
  }

  function findDuplicateUrl(candidateUrl: string, ignoreId?: number) {
    const normalized = normalizeUrl(candidateUrl)
    if (!normalized) return undefined

    return jobs.find((job) => job.id !== ignoreId && normalizeUrl(job.url) === normalized)
  }

  function resetFilters() {
    setSearch('')
    setStatusFilter('all')
    setSourceFilter('all')
    setCompanyFilter('all')
    setRemoteFilter('all')
  }

  function exportCsv() {
    const rows = filteredJobs.map((job) => ({
      company: job.company || '',
      title: job.title || '',
      location: job.location || '',
      pay_range: job.pay_range || '',
      employment_type: job.employment_type || '',
      remote_type: job.remote_type || '',
      status: job.status || '',
      source: job.source || '',
      repost_count: String(job.repost_count || 0),
      first_seen: job.first_seen || '',
      last_seen: job.last_seen || '',
      last_check_status: job.last_check_status || '',
      url: job.url || '',
      notes: job.notes || '',
    }))

    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)

    link.href = objectUrl
    link.download = `jobtrace-export-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(objectUrl)

    showStatus(`Exported ${rows.length} job records.`, 'success')
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

  const filterOptions = useMemo(() => {
    const statuses = uniqueValues(jobs.map((job) => job.status || 'active'))
    const sources = uniqueValues(jobs.map((job) => job.source || detectSource(job.url || '')))
    const companies = uniqueValues(jobs.map((job) => job.company || 'Unknown Company'))
    const remoteTypes = uniqueValues(jobs.map((job) => job.remote_type || 'Unknown'))

    return { statuses, sources, companies, remoteTypes }
  }, [jobs])

  const filteredJobs = jobs.filter((job) => {
    const text = search.toLowerCase()
    const source = job.source || detectSource(job.url || '')
    const companyName = job.company || 'Unknown Company'
    const status = job.status || 'active'

    const matchesSearch =
      !text ||
      job.company?.toLowerCase().includes(text) ||
      job.title?.toLowerCase().includes(text) ||
      job.location?.toLowerCase().includes(text) ||
      job.pay_range?.toLowerCase().includes(text) ||
      source.toLowerCase().includes(text) ||
      status.toLowerCase().includes(text)

    const matchesStatus = statusFilter === 'all' || status === statusFilter
    const matchesSource = sourceFilter === 'all' || source === sourceFilter
    const remoteType = job.remote_type || 'Unknown'
    const matchesCompany = companyFilter === 'all' || companyName === companyFilter
    const matchesRemote = remoteFilter === 'all' || remoteType === remoteFilter

    return matchesSearch && matchesStatus && matchesSource && matchesCompany && matchesRemote
  })

  const companyInsights = useMemo(() => {
    const companyName = selectedCompany === 'all' ? companyFilter : selectedCompany
    if (companyName === 'all') return null

    const companyJobs = jobs.filter((job) => (job.company || 'Unknown Company') === companyName)
    if (companyJobs.length === 0) return null

    return {
      company: companyName,
      total: companyJobs.length,
      active: companyJobs.filter((job) => (job.status || 'active') === 'active').length,
      removed: companyJobs.filter((job) => job.status === 'removed').length,
      reposts: companyJobs.reduce((sum, job) => sum + (job.repost_count || 0), 0),
      locations: uniqueValues(companyJobs.map((job) => job.location).filter(Boolean)),
      payRanges: uniqueValues(companyJobs.map((job) => job.pay_range).filter(Boolean)),
      latestSeen: companyJobs
        .map((job) => job.last_seen || job.first_seen)
        .filter(Boolean)
        .sort()
        .at(-1) || '',
    }
  }, [companyFilter, jobs, selectedCompany])

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
                    Job posting tracker
                  </p>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tight">
                    JobTrace
                  </h1>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge>{jobs.length} jobs tracked</Badge>
                <Badge>{metrics.active} active</Badge>
              </div>
            </div>

            <p className="text-xl text-gray-300 max-w-3xl">
              Save job postings, compare pay ranges, and track when roles are reposted or removed.
            </p>

            <div className="border border-gray-800 bg-gray-900/60 rounded-2xl p-4 text-sm text-gray-300">
              <p className="font-semibold mb-2 text-white">Basic workflow</p>

              <ul className="space-y-1 text-gray-400">
                <li>• Paste a job posting URL</li>
                <li>• Review the imported fields</li>
                <li>• Save the posting</li>
                <li>• Recheck, edit, export, or mark status changes later</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Badge>Import URLs</Badge>
              <Badge>Edit records</Badge>
              <Badge>Filter results</Badge>
              <Badge>Export CSV</Badge>
            </div>
          </section>

          <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-400">Current view</p>
              <p className="text-2xl font-black text-green-400">{filteredJobs.length}</p>
            </div>

            <div className="text-sm text-gray-400 space-y-1">
              <p>{metrics.companies} companies</p>
              <p>{metrics.locations} locations</p>
              <p>{metrics.reposted} reposted</p>
              <p>{metrics.removed} removed</p>
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
            <h2 className="text-2xl font-bold">Import Job</h2>
            <p className="text-gray-400">
              Paste a job URL. JobTrace will try to pull the title, company, location, pay, and remote status.
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
                <h2 className="text-2xl font-bold">Review / Add Job</h2>
                <p className="text-gray-400 text-sm">
                  Imported data lands here before it is saved. You can also enter a job manually.
                </p>
              </div>

              <button
                className="border border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
                onClick={clearForm}
              >
                Clear Form
              </button>
            </div>

            <JobForm draft={draft} onChange={updateDraft} />

            <button
              className="bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-300 px-5 py-3 rounded-xl font-semibold transition"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Job'}
            </button>
          </section>

          <aside className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 space-y-4">
            <h2 className="text-2xl font-bold">Tools</h2>

            <button
              className="w-full bg-gray-100 text-black hover:bg-white px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              onClick={exportCsv}
              disabled={filteredJobs.length === 0}
            >
              Export current view to CSV
            </button>

            <button
              className="w-full border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              onClick={recheckAllJobs}
              disabled={isRecheckingAll || filteredJobs.length === 0}
            >
              {isRecheckingAll ? 'Rechecking...' : 'Recheck filtered jobs'}
            </button>

            <button
              className="w-full border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              onClick={loadDemoData}
              disabled={isLoadingDemo}
            >
              {isLoadingDemo ? 'Loading demo...' : 'Load demo data'}
            </button>

            <div className="text-sm text-gray-400 space-y-3 border-t border-gray-800 pt-4">
              <p>
                CSV export uses the current search and filters. This is useful for comparing jobs in a spreadsheet.
              </p>
              <p>
                Duplicate URL checks are built into import, save, and edit.
              </p>
              <p>
                Snapshot history starts working after you run the included Supabase SQL file.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">Company Profile</h2>
                <p className="text-gray-400 text-sm">Select a company to see a simple rollup.</p>
              </div>

              <select
                className="bg-gray-950 border border-gray-700 p-2 rounded-xl text-sm outline-none focus:border-blue-500"
                value={selectedCompany}
                onChange={(event) => setSelectedCompany(event.target.value)}
              >
                <option value="all">Choose company</option>
                {filterOptions.companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>

            {companyInsights ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{companyInsights.company}</h3>
                  <p className="text-sm text-gray-400">Latest activity: {formatDate(companyInsights.latestSeen)}</p>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <MiniStat label="Jobs" value={companyInsights.total} />
                  <MiniStat label="Active" value={companyInsights.active} />
                  <MiniStat label="Removed" value={companyInsights.removed} />
                  <MiniStat label="Reposts" value={companyInsights.reposts} />
                </div>

                <div className="text-sm text-gray-400 space-y-2">
                  <p><span className="text-gray-200">Locations:</span> {companyInsights.locations.join(', ') || 'Unknown'}</p>
                  <p><span className="text-gray-200">Pay ranges:</span> {companyInsights.payRanges.join(', ') || 'Unknown'}</p>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-700 rounded-2xl p-8 text-center text-gray-500">
                Choose a company from the dropdown.
              </div>
            )}
          </section>

          <section className="border border-gray-800 bg-gray-900/80 rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Snapshot History</h2>
              <p className="text-gray-400 text-sm">Saves a point-in-time record when jobs are created, edited, reposted, or rechecked.</p>
            </div>

            {snapshots.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-auto pr-1">
                {snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="border border-gray-800 bg-gray-950 rounded-2xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{snapshot.company || 'Unknown Company'}</p>
                        <p className="text-sm text-gray-400">{snapshot.title || 'Untitled Role'}</p>
                      </div>
                      <Badge>{snapshot.snapshot_type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(snapshot.created_at)} • {snapshot.status || 'unknown'} • {snapshot.pay_range || 'No pay listed'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-700 rounded-2xl p-8 text-center text-gray-500">
                Run the snapshot SQL file, then new changes will appear here.
              </div>
            )}
          </section>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Tracked Jobs</h2>
              <p className="text-gray-400 text-sm">
                Search, filter, edit, export, recheck, or update saved jobs.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap justify-start lg:justify-end">
              <button
                className="border border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
              <button
                className="border border-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-gray-800"
                onClick={exportCsv}
                disabled={filteredJobs.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-blue-500"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={statusFilter} onChange={setStatusFilter} label="All statuses" options={filterOptions.statuses} />
            <Select value={sourceFilter} onChange={setSourceFilter} label="All sources" options={filterOptions.sources} />
            <Select value={companyFilter} onChange={setCompanyFilter} label="All companies" options={filterOptions.companies} />
            <Select value={remoteFilter} onChange={setRemoteFilter} label="All remote types" options={filterOptions.remoteTypes} />
          </section>

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
              No jobs match your search or filters.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isEditing={editingId === job.id}
                editDraft={editDraft}
                onEditChange={updateEditDraft}
                onStartEdit={startEditing}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={saveEditedJob}
                onDelete={deleteJob}
                onStatusChange={updateJobStatus}
                onRepost={markReposted}
                onRecheck={recheckJob}
              />
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center text-gray-600 text-sm pb-10">
          JobTrace • Next.js, Supabase, and Recharts
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

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, '').toLowerCase()
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

function statusClasses(tone: StatusTone) {
  if (tone === 'success') {
    return 'border border-green-800 bg-green-950/40 text-green-200 rounded-2xl p-4'
  }

  if (tone === 'error') {
    return 'border border-red-800 bg-red-950/40 text-red-200 rounded-2xl p-4'
  }

  return 'border border-blue-800 bg-blue-950/40 text-blue-200 rounded-2xl p-4'
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const escapeValue = (value: string) => `"${String(value).replace(/"/g, '""')}"`

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header] || '')).join(',')),
  ].join('\n')
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-800 bg-gray-950 rounded-2xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-2xl p-4 shadow-lg">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
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

function Textarea({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  return (
    <textarea
      className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2 outline-none focus:border-blue-500 min-h-24"
      placeholder="Notes"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

function JobForm({ draft, onChange }: { draft: JobDraft; onChange: (field: keyof JobDraft, value: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Input placeholder="Company" value={draft.company} setValue={(value) => onChange('company', value)} />
      <Input placeholder="Job Title" value={draft.title} setValue={(value) => onChange('title', value)} />
      <Input placeholder="Location" value={draft.location} setValue={(value) => onChange('location', value)} />
      <Input placeholder="Pay Range" value={draft.pay_range} setValue={(value) => onChange('pay_range', value)} />
      <Input placeholder="Employment Type" value={draft.employment_type} setValue={(value) => onChange('employment_type', value)} />
      <Input placeholder="Remote / Hybrid / Onsite" value={draft.remote_type} setValue={(value) => onChange('remote_type', value)} />

      <input
        className="bg-gray-950 border border-gray-700 p-3 rounded-xl md:col-span-2 outline-none focus:border-blue-500"
        placeholder="Job URL"
        value={draft.url}
        onChange={(e) => onChange('url', e.target.value)}
      />

      <Textarea value={draft.notes} setValue={(value) => onChange('notes', value)} />
    </div>
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

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  options: string[]
}) {
  return (
    <select
      className="bg-gray-900 border border-gray-700 p-3 rounded-xl outline-none focus:border-blue-500 text-gray-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="all">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function JobCard({
  job,
  isEditing,
  editDraft,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onStatusChange,
  onRepost,
  onRecheck,
}: {
  job: Job
  isEditing: boolean
  editDraft: JobDraft
  onEditChange: (field: keyof JobDraft, value: string) => void
  onStartEdit: (job: Job) => void
  onCancelEdit: () => void
  onSaveEdit: (id: number) => void
  onDelete: (id: number) => void
  onStatusChange: (id: number, status: string) => void
  onRepost: (job: Job) => void
  onRecheck: (job: Job) => void
}) {
  if (isEditing) {
    return (
      <div className="border border-blue-800 bg-gray-900/80 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">Edit Job</h3>
            <p className="text-gray-400 text-sm">Update saved job details.</p>
          </div>
        </div>

        <JobForm draft={editDraft} onChange={onEditChange} />

        <div className="flex flex-wrap gap-2">
          <button
            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold transition"
            onClick={() => onSaveEdit(job.id)}
          >
            Save Changes
          </button>
          <button
            className="border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-xl transition"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-3xl p-5 space-y-4 hover:border-blue-800 transition shadow-xl">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            {job.company || 'Unknown Company'}
          </h3>
          <p className="text-lg text-gray-300">
            {job.title || 'Untitled Role'}
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <button
            className="text-blue-300 hover:text-blue-200 underline"
            onClick={() => onStartEdit(job)}
          >
            Edit
          </button>
          <button
            className="text-red-400 hover:text-red-300 underline"
            onClick={() => onDelete(job.id)}
          >
            Delete
          </button>
        </div>
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
        <ActionButton tone="green" onClick={() => onStatusChange(job.id, 'active')}>
          Active
        </ActionButton>

        <ActionButton tone="yellow" onClick={() => onStatusChange(job.id, 'removed')}>
          Removed
        </ActionButton>

        <ActionButton tone="blue" onClick={() => onRepost(job)}>
          Reposted
        </ActionButton>

        <ActionButton tone="purple" onClick={() => onRecheck(job)}>
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
