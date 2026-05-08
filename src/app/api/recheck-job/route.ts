import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 JobTraceBot/0.1',
      },
    })

    return NextResponse.json({
      success: true,
      reachable: response.ok,
      statusCode: response.status,
      checkedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({
      success: true,
      reachable: false,
      statusCode: 0,
      checkedAt: new Date().toISOString(),
    })
  }
}