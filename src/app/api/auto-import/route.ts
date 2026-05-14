import { NextResponse } from 'next/server'
import { runAutomatedImport } from '@/lib/automatedImporter'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const result = await runAutomatedImport({
      limitPerSource: body.limitPerSource || 25,
      norcalOnly: body.norcalOnly ?? true,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Automated import failed',
      },
      { status: 500 }
    )
  }
}
