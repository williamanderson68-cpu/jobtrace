import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 45)

  const { data: staleJobs, error } = await supabase
    .from('jobs')
    .select('*')
    .lt('last_seen', cutoff.toISOString())
    .neq('lifecycle_status', 'removed')
    .limit(250)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  let removed = 0

  for (const job of staleJobs || []) {
    await supabase.from('jobs').update({
      lifecycle_status: 'removed',
      status: 'removed',
      removed_at: new Date().toISOString(),
    }).eq('id', job.id)

    await supabase.from('job_events').insert({
      job_id: job.id,
      event_type: 'removed',
      event_title: `${job.title} at ${job.company} appears to have been removed`,
      event_description: 'This posting has not been observed recently and was marked as removed.',
      metadata: { company: job.company, title: job.title, location: job.location, source: job.source },
    })

    removed += 1
  }

  return NextResponse.json({ ok: true, removed, cutoff: cutoff.toISOString() })
}
