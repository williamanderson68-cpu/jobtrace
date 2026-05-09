import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Job = {
  id: number
  company: string | null
  title: string | null
  location: string | null
  pay_range: string | null
  url: string | null
  employment_type: string | null
  remote_type: string | null
  status: string | null
  source: string | null
  repost_count: number | null
  first_seen: string | null
  last_seen: string | null
  last_check_status: string | null
}

type CheckResult = {
  jobId: number
  company: string
  title: string
  url: string
  previousStatus: string
  newStatus: string
  reachable: boolean
  statusCode: number
  changed: boolean
  message: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cronSecret = process.env.CRON_SECRET
const batchSize = Number(process.env.CRON_RECHECK_LIMIT || 25)

function makeSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function isAuthorized(request: Request) {
  if (!cronSecret) return true

  const authHeader = request.headers.get('authorization') || ''
  const querySecret = new URL(request.url).searchParams.get('secret')

  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret
}

async function checkUrl(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 JobTraceBot/0.2 (+automated job posting monitor)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    return {
      reachable: response.ok,
      statusCode: response.status,
    }
  } catch {
    return {
      reachable: false,
      statusCode: 0,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function getNewStatus(job: Job, reachable: boolean) {
  if (!reachable) return 'removed'

  const currentStatus = job.status || 'active'

  if (currentStatus === 'removed') return 'active'
  return currentStatus
}

function buildChangeMessage(job: Job, reachable: boolean, statusCode: number, newStatus: string) {
  const oldStatus = job.status || 'active'

  if (oldStatus !== newStatus) {
    return `Status changed from ${oldStatus} to ${newStatus}. HTTP status: ${statusCode}.`
  }

  if (reachable) {
    return `Posting was reachable. HTTP status: ${statusCode}.`
  }

  return `Posting was not reachable. HTTP status: ${statusCode}.`
}

async function createSnapshot(
  supabase: ReturnType<typeof createClient>,
  job: Job,
  snapshotType: string,
  notes: string
) {
  await supabase.from('job_snapshots').insert({
    job_id: job.id,
    company: job.company || '',
    title: job.title || '',
    location: job.location || '',
    pay_range: job.pay_range || '',
    status: job.status || 'active',
    source: job.source || '',
    url: job.url || '',
    remote_type: job.remote_type || '',
    employment_type: job.employment_type || '',
    snapshot_type: snapshotType,
    notes,
  })
}

async function insertRunLog(
  supabase: ReturnType<typeof createClient>,
  data: {
    startedAt: string
    finishedAt: string
    checkedCount: number
    reachableCount: number
    removedCount: number
    changedCount: number
    failedCount: number
    notes: string
  }
) {
  await supabase.from('job_check_runs').insert({
    started_at: data.startedAt,
    finished_at: data.finishedAt,
    checked_count: data.checkedCount,
    reachable_count: data.reachableCount,
    removed_count: data.removedCount,
    changed_count: data.changedCount,
    failed_count: data.failedCount,
    notes: data.notes,
  })
}

async function runRecheck(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const supabase = makeSupabaseServerClient()

  const requestedLimit = Number(new URL(request.url).searchParams.get('limit') || batchSize)
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 50)

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .not('url', 'is', null)
    .neq('url', '')
    .order('last_seen', { ascending: true, nullsFirst: true })
    .limit(safeLimit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: CheckResult[] = []
  let reachableCount = 0
  let removedCount = 0
  let changedCount = 0
  let failedCount = 0

  for (const job of (jobs || []) as Job[]) {
    const url = job.url || ''

    try {
      const checkedAt = new Date().toISOString()
      const check = await checkUrl(url)
      const newStatus = getNewStatus(job, check.reachable)
      const previousStatus = job.status || 'active'
      const changed = previousStatus !== newStatus
      const message = buildChangeMessage(job, check.reachable, check.statusCode, newStatus)

      if (check.reachable) reachableCount += 1
      if (!check.reachable) removedCount += 1
      if (changed) changedCount += 1

      const updatedJob = {
        ...job,
        status: newStatus,
        last_seen: checkedAt,
        last_check_status: check.reachable ? 'reachable' : 'not reachable',
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: newStatus,
          last_seen: checkedAt,
          last_check_status: check.reachable ? 'reachable' : 'not reachable',
        })
        .eq('id', job.id)

      if (updateError) throw updateError

      await createSnapshot(
        supabase,
        updatedJob,
        changed ? 'auto_status_changed' : 'auto_rechecked',
        message
      )

      results.push({
        jobId: job.id,
        company: job.company || 'Unknown Company',
        title: job.title || 'Untitled Role',
        url,
        previousStatus,
        newStatus,
        reachable: check.reachable,
        statusCode: check.statusCode,
        changed,
        message,
      })
    } catch (error) {
      failedCount += 1
      results.push({
        jobId: job.id,
        company: job.company || 'Unknown Company',
        title: job.title || 'Untitled Role',
        url,
        previousStatus: job.status || 'active',
        newStatus: job.status || 'active',
        reachable: false,
        statusCode: 0,
        changed: false,
        message: error instanceof Error ? error.message : 'Unknown recheck error',
      })
    }
  }

  const finishedAt = new Date().toISOString()

  await insertRunLog(supabase, {
    startedAt,
    finishedAt,
    checkedCount: results.length,
    reachableCount,
    removedCount,
    changedCount,
    failedCount,
    notes: `Automated recheck completed for ${results.length} jobs.`,
  })

  return NextResponse.json({
    success: true,
    startedAt,
    finishedAt,
    checkedCount: results.length,
    reachableCount,
    removedCount,
    changedCount,
    failedCount,
    results,
  })
}

export async function GET(request: Request) {
  return runRecheck(request)
}

export async function POST(request: Request) {
  return runRecheck(request)
}
