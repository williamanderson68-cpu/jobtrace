
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Company = {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  hq_city?: string | null;
  hq_state?: string | null;
};

type EnrichmentResult = {
  website?: string;
  industry?: string;
  hq_city?: string;
  hq_state?: string;
  careers_url?: string;
  website_confidence: number;
  industry_confidence: number;
  hq_confidence: number;
  enrichment_status: "enriched" | "partial" | "needs_review";
  enrichment_source: string;
};

const KNOWN_COMPANIES: Record<
  string,
  Partial<EnrichmentResult>
> = {
  anthropic: {
    website: "https://www.anthropic.com",
    careers_url: "https://www.anthropic.com/careers",
    industry: "Artificial Intelligence",
    hq_city: "San Francisco",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 95,
    hq_confidence: 90,
  },
  openai: {
    website: "https://openai.com",
    careers_url: "https://openai.com/careers",
    industry: "Artificial Intelligence",
    hq_city: "San Francisco",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 95,
    hq_confidence: 90,
  },
  tesla: {
    website: "https://www.tesla.com",
    careers_url: "https://www.tesla.com/careers",
    industry: "Automotive / Energy",
    hq_city: "Austin",
    hq_state: "TX",
    website_confidence: 95,
    industry_confidence: 90,
    hq_confidence: 85,
  },
  apple: {
    website: "https://www.apple.com",
    careers_url: "https://www.apple.com/careers",
    industry: "Technology",
    hq_city: "Cupertino",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 90,
    hq_confidence: 95,
  },
  google: {
    website: "https://www.google.com",
    careers_url: "https://www.google.com/about/careers",
    industry: "Technology",
    hq_city: "Mountain View",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 90,
    hq_confidence: 95,
  },
  meta: {
    website: "https://www.meta.com",
    careers_url: "https://www.metacareers.com",
    industry: "Technology",
    hq_city: "Menlo Park",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 90,
    hq_confidence: 95,
  },
  nvidia: {
    website: "https://www.nvidia.com",
    careers_url: "https://www.nvidia.com/en-us/about-nvidia/careers/",
    industry: "Semiconductors / Artificial Intelligence",
    hq_city: "Santa Clara",
    hq_state: "CA",
    website_confidence: 95,
    industry_confidence: 95,
    hq_confidence: 95,
  },
};

function normalizeCompanyName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(inc|inc\.|llc|ltd|ltd\.|corp|corp\.|corporation|company|co|co\.|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugForDomain(name: string) {
  return normalizeCompanyName(name).replace(/\s+/g, "");
}

function inferIndustry(name: string, jobTitles: string[]) {
  const text = `${name} ${jobTitles.join(" ")}`.toLowerCase();

  if (text.match(/ai|artificial intelligence|machine learning|llm|model|robotics|data scientist/)) {
    return { industry: "Artificial Intelligence", confidence: 75 };
  }

  if (text.match(/construction|engineer|project manager|superintendent|estimator|civil|infrastructure/)) {
    return { industry: "Construction / Infrastructure", confidence: 65 };
  }

  if (text.match(/health|medical|clinic|hospital|nurse|pharma|biotech/)) {
    return { industry: "Healthcare / Life Sciences", confidence: 65 };
  }

  if (text.match(/logistics|warehouse|supply chain|driver|fleet|transportation|delivery/)) {
    return { industry: "Logistics / Transportation", confidence: 65 };
  }

  if (text.match(/manufacturing|production|operator|technician|assembly|factory/)) {
    return { industry: "Manufacturing", confidence: 60 };
  }

  if (text.match(/solar|energy|battery|utility|water|environmental|stormwater/)) {
    return { industry: "Energy / Environmental Services", confidence: 65 };
  }

  if (text.match(/retail|store|restaurant|food|hospitality|hotel/)) {
    return { industry: "Retail / Hospitality", confidence: 60 };
  }

  if (text.match(/software|developer|platform|cloud|security|product manager/)) {
    return { industry: "Technology", confidence: 65 };
  }

  return { industry: undefined, confidence: 0 };
}

function enrichCompany(company: Company, jobTitles: string[]): EnrichmentResult {
  const normalized = normalizeCompanyName(company.name);
  const known = KNOWN_COMPANIES[normalized];

  const domainSlug = slugForDomain(company.name);
  const guessedWebsite = domainSlug ? `https://www.${domainSlug}.com` : undefined;

  const industryGuess = inferIndustry(company.name, jobTitles);

  const website = company.website || known?.website || guessedWebsite;
  const industry = company.industry || known?.industry || industryGuess.industry;
  const hq_city = company.hq_city || known?.hq_city;
  const hq_state = company.hq_state || known?.hq_state;
  const careers_url = known?.careers_url || (website ? `${website.replace(/\/$/, "")}/careers` : undefined);

  const websiteConfidence = company.website
    ? 100
    : known?.website_confidence || (guessedWebsite ? 45 : 0);

  const industryConfidence = company.industry
    ? 100
    : known?.industry_confidence || industryGuess.confidence;

  const hqConfidence = company.hq_city || company.hq_state
    ? 100
    : known?.hq_confidence || 0;

  const filledCount = [website, industry, hq_city || hq_state].filter(Boolean).length;

  return {
    website,
    industry,
    hq_city,
    hq_state,
    careers_url,
    website_confidence: websiteConfidence,
    industry_confidence: industryConfidence,
    hq_confidence: hqConfidence,
    enrichment_status:
      filledCount >= 3 ? "enriched" : filledCount >= 1 ? "partial" : "needs_review",
    enrichment_source: "heuristic:v1",
  };
}

async function enrichOneCompany(company: Company) {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("title")
    .eq("company_id", company.id)
    .limit(50);

  const jobTitles = (jobs || [])
    .map((job: any) => job.title)
    .filter(Boolean);

  const enrichment = enrichCompany(company, jobTitles);

  const { error: updateError } = await supabase
    .from("companies")
    .update({
      website: enrichment.website || company.website || null,
      industry: enrichment.industry || company.industry || null,
      hq_city: enrichment.hq_city || company.hq_city || null,
      hq_state: enrichment.hq_state || company.hq_state || null,
      careers_url: enrichment.careers_url || null,
      website_confidence: enrichment.website_confidence,
      industry_confidence: enrichment.industry_confidence,
      hq_confidence: enrichment.hq_confidence,
      enrichment_status: enrichment.enrichment_status,
      enrichment_source: enrichment.enrichment_source,
      last_enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", company.id);

  if (updateError) {
    throw updateError;
  }

  return {
    companyId: company.id,
    companyName: company.name,
    enrichment,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const companyId = body.companyId as string | undefined;
    const limit = Number(body.limit || 10);

    if (companyId) {
      const { data: company, error } = await supabase
        .from("companies")
        .select("id, name, website, industry, hq_city, hq_state")
        .eq("id", companyId)
        .single();

      if (error || !company) {
        return NextResponse.json(
          { ok: false, error: error?.message || "Company not found" },
          { status: 404 }
        );
      }

      const result = await enrichOneCompany(company);

      return NextResponse.json({ ok: true, mode: "single", result });
    }

    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, website, industry, hq_city, hq_state")
      .or("enrichment_status.is.null,enrichment_status.eq.pending,enrichment_status.eq.needs_review,enrichment_status.eq.partial")
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const results = [];

    for (const company of companies || []) {
      results.push(await enrichOneCompany(company));
    }

    return NextResponse.json({
      ok: true,
      mode: "batch",
      count: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Unknown enrichment error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/enrich-company",
    usage: {
      enrichOne: 'POST {"companyId":"company-uuid"}',
      enrichBatch: 'POST {"limit":10}',
    },
  });
}
