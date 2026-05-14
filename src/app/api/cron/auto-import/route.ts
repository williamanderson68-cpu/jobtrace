import { NextResponse } from 'next/server'
import { runAutomatedImport } from '@/lib/automatedImporter'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 }
    )
  }

  try {
    const result = await runAutomatedImport({
      limitPerSource: 25,
      norcalOnly: true,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Cron import failed',
      },
      { status: 500 }
    )
  }
}
