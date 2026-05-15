import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runAutomatedImport } from '@/lib/automatedImporter'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const { data: run } = await supabase
    .from('importer_runs')
    .insert({ run_type: 'auto_import', status: 'started' })
    .select()
    .single()

  try {
    const result = await runAutomatedImport({
      limitPerSource: body.limitPerSource || 10,
      norcalOnly: body.norcalOnly ?? true,
    })

    await supabase.from('importer_runs').update({
      status: 'completed',
      attempted: result.totals.attempted,
      imported: result.totals.imported,
      failed: result.totals.failed,
      events_created: result.totals.events,
      summary: result,
      finished_at: new Date().toISOString(),
    }).eq('id', run?.id)

    return NextResponse.json(result)
  } catch (error) {
    await supabase.from('importer_runs').update({
      status: 'failed',
      summary: { error: error instanceof Error ? error.message : 'Unknown error' },
      finished_at: new Date().toISOString(),
    }).eq('id', run?.id)

    return NextResponse.json({ ok: false, error: 'Admin auto import failed' }, { status: 500 })
  }
}
