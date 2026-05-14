import { supabase } from '@/lib/supabase'

export type JobPayload = {
  title: string
  company: string
  location: string
  salary?: string | null
  url?: string | null
  source?: string | null
  latitude?: number | null
  longitude?: number | null
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() || ''
}

function buildEventTitle(eventType: string, job: JobPayload) {
  switch (eventType) {
    case 'created':
      return `New ${job.title} role detected at ${job.company}`
    case 'salary_changed':
      return `Compensation changed for ${job.title} at ${job.company}`
    case 'location_changed':
      return `Location changed for ${job.title} at ${job.company}`
    case 'reposted':
      return `${job.title} at ${job.company} appears to have been reposted`
    case 'seen':
      return `${job.title} at ${job.company} observed again`
    default:
      return `Job activity detected for ${job.title} at ${job.company}`
  }
}

async function createJobEvent({
  jobId,
  eventType,
  job,
  oldValue,
  newValue,
  description,
}: {
  jobId: number
  eventType: string
  job: JobPayload
  oldValue?: string | null
  newValue?: string | null
  description?: string | null
}) {
  const eventTitle = buildEventTitle(eventType, job)

  await supabase.from('job_events').insert({
    job_id: jobId,
    event_type: eventType,
    event_title: eventTitle,
    event_description: description || null,
    old_value: oldValue || null,
    new_value: newValue || null,
    metadata: {
      company: job.company,
      title: job.title,
      location: job.location,
      source: job.source || 'manual',
    },
  })
}

async function upsertCompany(companyName: string) {
  const normalizedName = normalizeText(companyName)

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('name', companyName)
    .maybeSingle()

  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('company', companyName)

  if (!company) {
    await supabase.from('companies').insert({
      name: companyName,
      normalized_name: normalizedName,
      total_openings: count || 0,
      hiring_velocity: 0,
      expansion_score: Math.min((count || 0) * 8, 100),
      last_seen: new Date().toISOString(),
    })

    return
  }

  await supabase
    .from('companies')
    .update({
      total_openings: count || 0,
      expansion_score: Math.min((count || 0) * 8, 100),
      last_seen: new Date().toISOString(),
    })
    .eq('id', company.id)
}

export async function importJobWithEvents(job: JobPayload) {
  const normalizedUrl = normalizeText(job.url)
  const normalizedTitle = normalizeText(job.title)
  const normalizedCompany = normalizeText(job.company)
  const normalizedLocation = normalizeText(job.location)

  let existingQuery = supabase.from('jobs').select('*')

  if (normalizedUrl) {
    existingQuery = existingQuery.eq('url', job.url)
  } else {
    existingQuery = existingQuery
      .ilike('title', job.title)
      .ilike('company', job.company)
      .ilike('location', job.location)
  }

  const { data: existing } = await existingQuery.maybeSingle()

  if (!existing) {
    const { data: inserted, error } = await supabase
      .from('jobs')
      .insert({
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary || null,
        url: job.url || null,
        source: job.source || 'manual',
        latitude: job.latitude || null,
        longitude: job.longitude || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    await createJobEvent({
      jobId: inserted.id,
      eventType: 'created',
      job,
      description: 'A new job posting was added to the labor market dataset.',
    })

    await upsertCompany(job.company)

    return {
      job: inserted,
      created: true,
      events: ['created'],
    }
  }

  const events: string[] = []
  const updates: Record<string, unknown> = {
    last_seen: new Date().toISOString(),
    status: 'active',
  }

  if (normalizeText(existing.salary) !== normalizeText(job.salary)) {
    updates.salary = job.salary || null
    events.push('salary_changed')

    await createJobEvent({
      jobId: existing.id,
      eventType: 'salary_changed',
      job,
      oldValue: existing.salary,
      newValue: job.salary,
      description: 'Compensation information changed between observations.',
    })
  }

  if (normalizeText(existing.location) !== normalizedLocation) {
    updates.location = job.location
    updates.latitude = job.latitude || existing.latitude
    updates.longitude = job.longitude || existing.longitude
    events.push('location_changed')

    await createJobEvent({
      jobId: existing.id,
      eventType: 'location_changed',
      job,
      oldValue: existing.location,
      newValue: job.location,
      description: 'The job posting location changed between observations.',
    })
  }

  const daysSinceFirstSeen =
    existing.first_seen
      ? Math.floor(
          (Date.now() - new Date(existing.first_seen).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

  if (daysSinceFirstSeen >= 21 && events.length === 0) {
    events.push('reposted')

    await createJobEvent({
      jobId: existing.id,
      eventType: 'reposted',
      job,
      description:
        'The same role was observed again after a long active window. This may indicate reposting or difficulty filling the position.',
    })
  }

  if (events.length === 0) {
    events.push('seen')

    await createJobEvent({
      jobId: existing.id,
      eventType: 'seen',
      job,
      description: 'Existing job posting observed again during import.',
    })
  }

  const { data: updated, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  await upsertCompany(job.company)

  return {
    job: updated,
    created: false,
    events,
  }
}
