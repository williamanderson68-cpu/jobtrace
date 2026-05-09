import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type Job = {
  id: number
  company: string | null
  title: string | null
  location: string | null
  pay_range: string | null
  url: string | null
  status: string | null
  source: string | null
  remote_type: string | null
  employment_type: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cronSecret = process.env.CRON_SECRET

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null

export async function GET(request: Request) {
  const startedAt = new Date().toISOString()

  const requestUrl = new URL(request.url)
  const suppliedSecret = requestUrl.searchParams.get('secret')
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.replace('Bearer ', '')

  const isAuthorized =
    suppliedSecret === cronSecret || bearerToken === cronSecret

  if (!cronSecret || !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase server client is not configured.' },
      { status: 500 }
    )
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(
      'id, company, title, location, pay_range, url, status, source, remote_type, employment_type'
    )
    .not('url', 'is', null)
    .order('last_seen', { ascending: true, nullsFirst: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []

  for (const job of (jobs || []) as Job[]) {
    const result = await checkJob(job)
    results.push(result)
  }

  const finishedAt = new Date().toISOString()

  return NextResponse.json({
    success: true,
    startedAt,
    finishedAt,
    checkedCount: results.length,
    reachableCount: results.filter((result) => result.reachable).length,
    removedCount: results.filter((result) => !result.reachable).length,
    changedCount: results.filter((result) => result.changed).length,
    results,
  })
}

async function checkJob(job: Job) {
  const previousStatus = job.status || 'active'
  const checkedAt = new Date().toISOString()

  let reachable = false
  let statusCode: number | null = null
  let newStatus = previousStatus
  let message = ''

  try {
    const response = await fetch(job.url || '', {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; JobTrace/1.0; +https://jobtrace.app)',
      },
    })

    statusCode = response.status
    reachable = response.ok

    if (reachable) {
      newStatus = previousStatus === 'removed' ? 'active' : previousStatus
      message = `Posting was reachable. HTTP status: ${statusCode}.`
    } else {
      newStatus = 'removed'
      message = `Posting was not reachable. HTTP status: ${statusCode}.`
    }
  } catch (error) {
    reachable = false
    statusCode = null
    newStatus = 'removed'
    message =
      error instanceof Error
        ? `Recheck failed: ${error.message}`
        : 'Recheck failed.'
  }

  const changed = previousStatus !== newStatus

  await supabase!
    .from('jobs')
    .update({
      status: newStatus,
      last_seen: checkedAt,
      last_check_status: reachable ? 'reachable' : 'not reachable',
    } as any)
    .eq('id', job.id)

  const snapshot = {
    job_id: job.id,
    company: job.company || '',
    title: job.title || '',
    location: job.location || '',
    pay_range: job.pay_range || '',
    url: job.url || '',
    previous_status: previousStatus,
    status: newStatus,
    source: job.source || '',
    remote_type: job.remote_type || '',
    employment_type: job.employment_type || '',
    snapshot_type: 'scheduled_recheck',
    notes: message,
    reachable,
    status_code: statusCode,
    change_detected: changed,
    checked_at: checkedAt,
  }

  await supabase!
    .from('job_snapshots')
    .insert(snapshot as any)

  return {
    jobId: job.id,
    company: job.company || '',
    title: job.title || '',
    url: job.url || '',
    previousStatus,
    newStatus,
    reachable,
    statusCode,
    changed,
    message,
  }
}