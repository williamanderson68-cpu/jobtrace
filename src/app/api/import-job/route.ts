import { NextResponse } from 'next/server'
import { importJobWithEvents } from '@/lib/jobEventEngine'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || !body.company || !body.location) {
      return NextResponse.json(
        {
          error: 'Missing required fields: title, company, location',
        },
        { status: 400 }
      )
    }

    const result = await importJobWithEvents({
      title: body.title,
      company: body.company,
      location: body.location,
      salary: body.salary || null,
      url: body.url || null,
      source: body.source || 'manual',
      latitude: body.latitude || null,
      longitude: body.longitude || null,
    })

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Import failed',
      },
      { status: 500 }
    )
  }
}
