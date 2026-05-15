import { supabase } from '@/lib/supabase'

type CompanyDossier = {
  industry: string
  headquarters: string
  website: string
  companyBio: string
  intelligenceSummary: string
  recentNews: Array<{
    title: string
    summary: string
    source: string
    url?: string
  }>
}

const knownCompanyDossiers: Record<string, CompanyDossier> = {
  astranis: {
    industry: 'Satellite communications / aerospace',
    headquarters: 'San Francisco, CA',
    website: 'https://www.astranis.com',
    companyBio:
      'Astranis builds small, low-cost telecommunications satellites designed to provide dedicated broadband capacity from geostationary orbit.',
    intelligenceSummary:
      'Hiring signals from Astranis should be read as aerospace, hardware, manufacturing, engineering, and operations demand. Growth in production, RF, spacecraft, supply chain, and mission operations roles may indicate satellite program scaling.',
    recentNews: [
      {
        title: 'Aerospace hiring concentration',
        summary:
          'Track hardware, manufacturing, RF engineering, spacecraft operations, and supply chain roles for expansion signals.',
        source: 'JobTrace inferred dossier',
      },
    ],
  },
  'scale ai': {
    industry: 'Artificial intelligence / data infrastructure',
    headquarters: 'San Francisco, CA',
    website: 'https://scale.com',
    companyBio:
      'Scale AI provides data infrastructure and services used to support artificial intelligence model development, evaluation, and deployment.',
    intelligenceSummary:
      'Hiring signals from Scale AI should be watched for AI infrastructure demand, government/defense AI expansion, data operations growth, and go-to-market hiring surges.',
    recentNews: [
      {
        title: 'AI infrastructure labor signal',
        summary:
          'Track engineering, data operations, federal, security, and GTM roles for signs of expansion into new AI markets.',
        source: 'JobTrace inferred dossier',
      },
    ],
  },
  openai: {
    industry: 'Artificial intelligence',
    headquarters: 'San Francisco, CA',
    website: 'https://openai.com',
    companyBio:
      'OpenAI is an artificial intelligence research and deployment company building AI models, products, infrastructure, and developer platforms.',
    intelligenceSummary:
      'Hiring changes at OpenAI may signal shifts in AI infrastructure, product strategy, policy, safety, enterprise adoption, and model deployment priorities.',
    recentNews: [
      {
        title: 'AI platform labor signal',
        summary:
          'Track infrastructure, product, safety, policy, enterprise, and research hiring patterns for directional intelligence.',
        source: 'JobTrace inferred dossier',
      },
    ],
  },
}

function normalizeCompanyName(name: string) {
  return name.trim().toLowerCase()
}

function buildFallbackDossier(name: string): CompanyDossier {
  return {
    industry: 'Unknown / to be enriched',
    headquarters: 'Unknown',
    website: '',
    companyBio:
      `${name} is currently tracked by JobTrace through imported job postings. A richer company biography can be added through future enrichment sources.`,
    intelligenceSummary:
      `JobTrace is tracking ${name} for hiring velocity, repost behavior, compensation movement, geographic concentration, and role mix changes.`,
    recentNews: [
      {
        title: 'Dossier awaiting enrichment',
        summary:
          'This employer has active labor-market tracking but does not yet have external company metadata attached.',
        source: 'JobTrace enrichment placeholder',
      },
    ],
  }
}

export async function enrichCompany(companyName: string) {
  const normalized = normalizeCompanyName(companyName)
  const dossier = knownCompanyDossiers[normalized] || buildFallbackDossier(companyName)

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('name', companyName)
    .maybeSingle()

  if (!company) {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        normalized_name: normalized,
        industry: dossier.industry,
        headquarters: dossier.headquarters,
        website: dossier.website,
        company_bio: dossier.companyBio,
        intelligence_summary: dossier.intelligenceSummary,
        recent_news: dossier.recentNews,
        enrichment_source: 'jobtrace_seed',
        enriched_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('companies')
    .update({
      industry: dossier.industry,
      headquarters: dossier.headquarters,
      website: dossier.website,
      company_bio: dossier.companyBio,
      intelligence_summary: dossier.intelligenceSummary,
      recent_news: dossier.recentNews,
      enrichment_source: 'jobtrace_seed',
      enriched_at: new Date().toISOString(),
    })
    .eq('id', company.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function enrichTrackedCompanies() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('name')
    .limit(100)

  if (error) throw error

  let enriched = 0
  const errors: string[] = []

  for (const company of companies || []) {
    try {
      await enrichCompany(company.name)
      enriched += 1
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `${company.name}: ${error.message}`
          : `${company.name}: unknown enrichment error`
      )
    }
  }

  return {
    ok: true,
    enriched,
    errors,
  }
}
