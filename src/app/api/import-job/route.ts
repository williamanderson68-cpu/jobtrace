import { NextResponse } from 'next/server'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function detectSource(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('greenhouse')) return 'Greenhouse'
  if (lower.includes('lever')) return 'Lever'
  if (lower.includes('ashby')) return 'Ashby'
  if (lower.includes('linkedin')) return 'LinkedIn'
  if (lower.includes('indeed')) return 'Indeed'
  if (lower.includes('workday')) return 'Workday'
  return 'Other'
}

function getMeta(html: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  )

  return html.match(regex)?.[1] || ''
}

function getPageTitle(html: string) {
  return stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
}

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

    const html = await response.text()

    const jsonLdMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )

    if (jsonLdMatches) {
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
                method: 'json-ld',
                title: job.title || '',
                company: job.hiringOrganization?.name || '',
                location:
                  job.jobLocation?.address?.addressLocality ||
                  job.jobLocation?.address?.addressRegion ||
                  job.jobLocation?.address?.addressCountry ||
                  '',
                employment_type: Array.isArray(job.employmentType)
                  ? job.employmentType.join(', ')
                  : job.employmentType || '',
                date_posted: job.datePosted || '',
                description: stripHtml(job.description || '').slice(0, 500),
                source: detectSource(url),
                url,
              })
            }
          }
        } catch {
          continue
        }
      }
    }

    const pageTitle = getMeta(html, 'og:title') || getPageTitle(html)
    const description =
      getMeta(html, 'og:description') ||
      getMeta(html, 'description') ||
      ''

    return NextResponse.json({
      success: true,
      method: 'fallback',
      title: pageTitle || 'Imported job link',
      company: '',
      location: '',
      employment_type: '',
      date_posted: '',
      description: stripHtml(description).slice(0, 500),
      source: detectSource(url),
      url,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch or parse URL' },
      { status: 500 }
    )
  }
}