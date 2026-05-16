import { supabase } from "./supabase";
import { analyzeJob } from "./analyze-job";

type ImportedJob = {
  url: string;
  company: string;
  title: string;
  location: string;
  pay_range?: string | null;
  source: string;
  employment_type?: string | null;
  remote_type?: string | null;
  notes?: string | null;
};

/**
 * V1 importer.
 *
 * This is intentionally simple:
 * - It imports a small seed list of jobs.
 * - It upserts by URL.
 * - Later, we can replace SAMPLE_JOBS with real source fetchers.
 */
const SAMPLE_JOBS: ImportedJob[] = [
  {
    url: "https://example.com/jobs/construction-project-manager-santa-rosa",
    company: "Sample Contractor",
    title: "Construction Project Manager",
    location: "Santa Rosa, CA",
    pay_range: "$110k - $145k",
    source: "manual_seed",
    employment_type: "Full-time",
    remote_type: "On-site",
    notes: "V1.1 sample job. Replace with real import source.",
  },
  {
    url: "https://example.com/jobs/water-treatment-operator-oakland",
    company: "Sample Water Services",
    title: "Water Treatment Operator",
    location: "Oakland, CA",
    pay_range: "$34 - $45/hr",
    source: "manual_seed",
    employment_type: "Full-time",
    remote_type: "On-site",
    notes: "V1.1 sample job. Replace with real import source.",
  },
  {
    url: "https://example.com/jobs/field-service-tech-sacramento",
    company: "Sample Industrial Systems",
    title: "Field Service Technician",
    location: "Sacramento, CA",
    pay_range: "$30 - $42/hr",
    source: "manual_seed",
    employment_type: "Full-time",
    remote_type: "Field",
    notes: "V1.1 sample job. Replace with real import source.",
  },
];

function todayIso() {
  return new Date().toISOString();
}

export async function runJobImport() {
  const now = todayIso();

  const rows = SAMPLE_JOBS.map((job) => ({
    url: job.url,
    company: job.company,
    title: job.title,
    location: job.location,
    pay_range: job.pay_range ?? null,
    source: job.source,
    employment_type: job.employment_type ?? null,
    remote_type: job.remote_type ?? null,
    notes: job.notes ?? null,
    status: "active",
    imported: true,
    data_quality: "seed",
    last_checked_at: now,
    last_check_status: "ok",
  }));

  const { data, error } = await supabase
    .from("jobs")
    .upsert(rows, { onConflict: "url" })
    .select("id,url,title,company,location");

  if (error) {
    return {
      ok: false,
      imported: 0,
      error: error.message,
    };
  }

  if (data?.length) {
    await Promise.allSettled(data.map((job) => analyzeJob(job.id)));
  }

  return {
    ok: true,
    imported: data?.length ?? 0,
    jobs: data ?? [],
  };
}
