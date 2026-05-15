import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { geocodeJob } from '@/lib/geocodeEngine'

export async function POST() {
  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .is('latitude', null)
      .limit(250)

    if (!jobs) {
      return NextResponse.json({
        ok: true,
        updated: 0,
      })
    }

    let updated = 0

    for (const job of jobs) {
      const result = geocodeJob(job.company || '', job.location || '')

      if (!result) continue

      await supabase
        .from('jobs')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
        })
        .eq('id', job.id)

      await supabase
        .from('geocode_queue')
        .insert({
          job_id: job.id,
          company: job.company,
          raw_location: job.location,
          query_used: result.queryUsed,
          latitude: result.latitude,
          longitude: result.longitude,
          confidence: result.confidence,
        })

      updated += 1
    }

    return NextResponse.json({
      ok: true,
      updated,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Geocode pipeline failed',
      },
      { status: 500 }
    )
  }
}
