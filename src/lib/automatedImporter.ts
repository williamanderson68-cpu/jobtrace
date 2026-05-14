import { importJobWithEvents, type JobPayload } from '@/lib/jobEventEngine'
import { inferCoordinates } from '@/lib/geo'
import { jobSources, type JobSource } from '@/lib/jobSources'

type ImportResult = {
  source: string
  attempted: number
  imported: number
  failed: number
  events: string[]
  errors: string[]
}

function withCoordinates(job: JobPayload): JobPayload {
  const coordinates = inferCoordinates(job.location)

  return {
    ...job,
    latitude: job.latitude ?? coordinates?.latitude ?? null,
    longitude: job.longitude ?? coordinates?.longitude ?? null,
  }
}

function getSalaryFromGreenhouseJob(job: any) {
  const metadata = Array.isArray(job.metadata) ? job.metadata : []

  const compensationMetadata = metadata.find((item: any) => {
    const name = String(item?.name || '').toLowerCase()
    return (
      name.includes('salary') ||
      name.includes('compensation') ||
      name.includes('pay range')
    )
  })

  if (compensationMetadata?.value) {
    return String(compensationMetadata.value)
  }

  return null
}

function normalizeGreenhouseJob(job: any, sourceName: string): JobPayload | null {
  if (!job?.title || !job?.absolute_url) {
    return null
  }

  return withCoordinates({
    title: String(job.title),
    company: sourceName,
    location: String(job.location?.name || 'Location not listed'),
    salary: getSalaryFromGreenhouseJob(job),
    url: String(job.absolute_url),
    source: 'greenhouse',
  })
}

function getSalaryFromLeverPosting(posting: any) {
  const salaryDescription =
    posting?.salaryDescription ||
    posting?.additionalPlain ||
    posting?.descriptionPlain ||
    ''

  const salaryMatch = String(salaryDescription).match(
    /\$[\d,]+(?:\s?-\s?\$?[\d,]+)?(?:\s?(?:\/|per)\s?(?:year|yr|hour|hr))?/i
  )

  return salaryMatch ? salaryMatch[0] : null
}

function normalizeLeverPosting(posting: any, sourceName: string): JobPayload | null {
  if (!posting?.text || !posting?.hostedUrl) {
    return null
  }

  return withCoordinates({
    title: String(posting.text),
    company: sourceName,
    location: String(posting.categories?.location || 'Location not listed'),
    salary: getSalaryFromLeverPosting(posting),
    url: String(posting.hostedUrl),
    source: 'lever',
  })
}

async function fetchGreenhouseJobs(source: Extract<JobSource, { type: 'greenhouse' }>) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${source.boardToken}/jobs?content=true`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Greenhouse ${source.name} failed: ${response.status}`)
  }

  const data = await response.json()
  const jobs = Array.isArray(data?.jobs) ? data.jobs : []

  return jobs
    .map((job: any) => normalizeGreenhouseJob(job, source.name))
    .filter(Boolean) as JobPayload[]
}

async function fetchLeverJobs(source: Extract<JobSource, { type: 'lever' }>) {
  const url = `https://api.lever.co/v0/postings/${source.companySlug}?mode=json`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Lever ${source.name} failed: ${response.status}`)
  }

  const data = await response.json()
  const jobs = Array.isArray(data) ? data : []

  return jobs
    .map((job: any) => normalizeLeverPosting(job, source.name))
    .filter(Boolean) as JobPayload[]
}

async function fetchSourceJobs(source: JobSource) {
  if (source.type === 'greenhouse') {
    return fetchGreenhouseJobs(source)
  }

  if (source.type === 'lever') {
    return fetchLeverJobs(source)
  }

  return []
}

function isNorthernCalifornia(job: JobPayload) {
  const text = `${job.location} ${job.title} ${job.company}`.toLowerCase()

  const norcalTerms = [
    'san francisco',
    'sf',
    'bay area',
    'oakland',
    'berkeley',
    'san jose',
    'santa clara',
    'sunnyvale',
    'mountain view',
    'palo alto',
    'fremont',
    'sacramento',
    'stockton',
    'modesto',
    'santa rosa',
    'napa',
    'vallejo',
    'concord',
    'walnut creek',
    'redwood city',
    'san mateo',
    'california',
    'ca',
    'remote',
  ]

  return norcalTerms.some((term) => text.includes(term))
}

export async function runAutomatedImport({
  limitPerSource = 25,
  norcalOnly = true,
}: {
  limitPerSource?: number
  norcalOnly?: boolean
} = {}) {
  const enabledSources = jobSources.filter((source) => source.enabled)
  const results: ImportResult[] = []

  for (const source of enabledSources) {
    const result: ImportResult = {
      source: source.name,
      attempted: 0,
      imported: 0,
      failed: 0,
      events: [],
      errors: [],
    }

    try {
      const fetchedJobs = await fetchSourceJobs(source)

      const filteredJobs = norcalOnly
        ? fetchedJobs.filter(isNorthernCalifornia)
        : fetchedJobs

      const jobsToImport = filteredJobs.slice(0, limitPerSource)

      result.attempted = jobsToImport.length

      for (const job of jobsToImport) {
        try {
          const imported = await importJobWithEvents(job)

          result.imported += 1
          result.events.push(...imported.events)
        } catch (error) {
          result.failed += 1
          result.errors.push(
            error instanceof Error ? error.message : 'Unknown import error'
          )
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown source fetch error'
      )
    }

    results.push(result)
  }

  return {
    ok: true,
    ranAt: new Date().toISOString(),
    sourceCount: enabledSources.length,
    totals: {
      attempted: results.reduce((sum, item) => sum + item.attempted, 0),
      imported: results.reduce((sum, item) => sum + item.imported, 0),
      failed: results.reduce((sum, item) => sum + item.failed, 0),
      events: results.reduce((sum, item) => sum + item.events.length, 0),
    },
    results,
  }
}
