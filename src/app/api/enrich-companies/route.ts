import { NextResponse } from 'next/server'
import { enrichCompany, enrichTrackedCompanies } from '@/lib/companyEnrichment'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    if (body.company) {
      const company = await enrichCompany(body.company)

      return NextResponse.json({
        ok: true,
        mode: 'single',
        company,
      })
    }

    const result = await enrichTrackedCompanies()

    return NextResponse.json({
      ...result,
      mode: 'all',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Company enrichment failed',
      },
      { status: 500 }
    )
  }
}
