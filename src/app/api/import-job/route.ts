/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
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
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["'][^>]*>`, 'i'),
  ]

  for (const pattern of patterns) {
    const value = html.match(pattern)?.[1]
    if (value) return stripHtml(value)
  }

  return ''
}

function getPageTitle(html: string) {
  return stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function findJobPosting(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object') return null

  const item = value as Record<string, any>
  const type = item['@type']

  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
    return item
  }

  for (const key of ['@graph', 'mainEntity', 'itemListElement']) {
    const nested = item[key]
    for (const candidate of asArray(nested)) {
      const found = findJobPosting(candidate)
      if (found) return found
    }
  }

  return null
}

function getLocation(job: Record<string, any>) {
  const locations = asArray(job.jobLocation)

  const formatted = locations
    .map((location) => {
      const address = location?.address || {}
      return [address.addressLocality, address.addressRegion, address.addressCountry]
        .filter(Boolean)
        .join(', ')
    })
    .filter(Boolean)

  return formatted.join(' / ')
}

function getPayRange(job: Record<string, any>) {
  const baseSalary = job.baseSalary
  const value = baseSalary?.value

  if (!value) return ''

  const currency = baseSalary.currency || ''
  const unit = value.unitText ? `/${String(value.unitText).toLowerCase()}` : ''
  const min = value.minValue
  const max = value.maxValue
  const single = value.value

  if (min && max) return `${currency} ${min} - ${max}${unit}`.trim()
  if (single) return `${currency} ${single}${unit}`.trim()
  return ''
}

function getRemoteType(job: Record<string, any>) {
  const text = `${job.jobLocationType || ''} ${job.description || ''}`.toLowerCase()

  if (text.includes('telecommute') || text.includes('remote')) return 'Remote'
  if (text.includes('hybrid')) return 'Hybrid'
  if (text.includes('onsite') || text.includes('on-site')) return 'Onsite'
  return ''
}

export async function POST(request: Request) {
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ success: false, error: 'Missing URL' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 JobTraceBot/0.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Could not fetch page. Status ${response.status}` },
        { status: 200 }
      )
    }

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
          const job = findJobPosting(parsed)

          if (job) {
            return NextResponse.json({
              success: true,
              method: 'json-ld',
              title: job.title || '',
              company: job.hiringOrganization?.name || '',
              location: getLocation(job),
              employment_type: Array.isArray(job.employmentType)
                ? job.employmentType.join(', ')
                : job.employmentType || '',
              remote_type: getRemoteType(job),
              pay_range: getPayRange(job),
              date_posted: job.datePosted || '',
              description: stripHtml(job.description || '').slice(0, 500),
              source: detectSource(url),
              url,
            })
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
      remote_type: '',
      pay_range: '',
      date_posted: '',
      description: stripHtml(description).slice(0, 500),
      source: detectSource(url),
      url,
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch or parse URL' },
      { status: 500 }
    )
  }
}
