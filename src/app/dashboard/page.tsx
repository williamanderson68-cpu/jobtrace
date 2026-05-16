import { supabase } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

type JobRow = {
  id: string;
  title: string;
  company: string;
  ai_score: number | null;
  ai_analysis: {
    wage_transparency_score?: number;
    ai_exposure_score?: number;
    real_job_confidence?: number;
  } | null;
};

export type AiJob = {
  id: string;
  title: string;
  company: string;
  ai_score: number | null;
  wage_transparency_score: number | null;
  ai_exposure_score: number | null;
  real_job_confidence: number | null;
};

export type AiInsights = {
  analyzedCount: number;
  avgScore: number | null;
  avgWageTransparency: number | null;
  topExposure: { id: string; title: string; company: string; score: number }[];
  topConfidence: { id: string; title: string; company: string; score: number }[];
  jobs: AiJob[];
};

export default async function DashboardPage() {
  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, ai_score, ai_analysis")
    .not("ai_analysis", "is", null);

  const jobs = (data ?? []) as JobRow[];

  function avg(values: (number | undefined | null)[]): number | null {
    const nums = values.filter((v): v is number => v != null);
    return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  }

  const avgScore = avg(jobs.map((j) => j.ai_score));
  const avgWageTransparency = avg(jobs.map((j) => j.ai_analysis?.wage_transparency_score));

  const topExposure = [...jobs]
    .filter((j) => j.ai_analysis?.ai_exposure_score != null)
    .sort((a, b) => (b.ai_analysis!.ai_exposure_score ?? 0) - (a.ai_analysis!.ai_exposure_score ?? 0))
    .slice(0, 3)
    .map((j) => ({ id: j.id, title: j.title, company: j.company, score: j.ai_analysis!.ai_exposure_score! }));

  const topConfidence = [...jobs]
    .filter((j) => j.ai_analysis?.real_job_confidence != null)
    .sort((a, b) => (b.ai_analysis!.real_job_confidence ?? 0) - (a.ai_analysis!.real_job_confidence ?? 0))
    .slice(0, 3)
    .map((j) => ({ id: j.id, title: j.title, company: j.company, score: j.ai_analysis!.real_job_confidence! }));

  const aiInsights: AiInsights = {
    analyzedCount: jobs.length,
    avgScore,
    avgWageTransparency,
    topExposure,
    topConfidence,
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      ai_score: j.ai_score,
      wage_transparency_score: j.ai_analysis?.wage_transparency_score ?? null,
      ai_exposure_score: j.ai_analysis?.ai_exposure_score ?? null,
      real_job_confidence: j.ai_analysis?.real_job_confidence ?? null,
    })),
  };

  return <DashboardClient aiInsights={aiInsights} />;
}
