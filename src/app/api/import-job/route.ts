import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    const html = await response.text()

    const jsonLdMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )

    if (!jsonLdMatches) {
      return NextResponse.json({
        success: false,
        message: 'No JobPosting structured data found',
        url,
      })
    }

    for (const script of jsonLdMatches) {
      const jsonText = script
        .replace(/<script[^>]*>/i, '')
        .replace(/<\/script>/i, '')
        .trim()

      try {
        const parsed = JSON.parse(jsonText)
        const items = Array.isArray(parsed) ? parsed : [parsed]

        for (const item of items) {
          const job = item['@type'] === 'JobPosting' ? item : null

          if (job) {
            return NextResponse.json({
              success: true,
              title: job.title || '',
              company: job.hiringOrganization?.name || '',
              location:
                job.jobLocation?.address?.addressLocality ||
                job.jobLocation?.address?.addressRegion ||
                '',
              employment_type: Array.isArray(job.employmentType)
                ? job.employmentType.join(', ')
                : job.employmentType || '',
              date_posted: job.datePosted || '',
              description: job.description || '',
              url,
            })
          }
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({
      success: false,
      message: 'No usable JobPosting data found',
      url,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch or parse URL' },
      { status: 500 }
    )
  }
}