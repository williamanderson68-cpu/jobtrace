import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jobSources } from '@/lib/jobSources'

export async function GET() {
  const [
    { count: jobCount },
    { count: eventCount },
    { count: companyCount },
    { count: mappedCount },
    { count: removedCount },
    { data: runs },
    { data: sourceRows },
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).neq('source', 'manual'),
    supabase.from('job_events').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).not('latitude', 'is', null),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('lifecycle_status', 'removed'),
    supabase.from('importer_runs').select('*').order('started_at', { ascending: false }).limit(10),
    supabase.from('jobs').select('source, company').neq('source', 'manual').limit(1000),
  ])

  const sourceCounts: Record<string, number> = {}
  for (const row of sourceRows || []) {
    const key = row.company || row.source || 'unknown'
    sourceCounts[key] = (sourceCounts[key] || 0) + 1
  }

  return NextResponse.json({
    ok: true,
    totals: {
      jobs: jobCount || 0,
      events: eventCount || 0,
      companies: companyCount || 0,
      mapped: mappedCount || 0,
      removed: removedCount || 0,
    },
    configuredSources: jobSources.map((source) => ({
      name: source.name,
      type: source.type,
      enabled: source.enabled,
      importedJobs: sourceCounts[source.name] || 0,
    })),
    recentRuns: runs || [],
  })
}
