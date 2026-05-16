import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST() {
  try {
    const { data: jobs, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .is("ai_analysis", null)
      .limit(10);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ ok: true, analyzed: 0, failed: 0, results: [] });
    }

    let analyzed = 0;
    let failed = 0;
    const results: { jobId: string; ok: boolean; error?: string }[] = [];

    for (const job of jobs) {
      try {
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: `
You are analyzing a job posting for JobTrace, a labor-market data product.

Return ONLY valid JSON. No markdown.

Use this exact shape:
{
  "summary": "string",
  "industry": "string",
  "seniority": "string",
  "department": "string",
  "remote_type": "onsite | hybrid | remote | unclear",
  "location_confidence": 0,
  "wage_transparency_score": 0,
  "real_job_confidence": 0,
  "ai_exposure_score": 0,
  "data_quality_score": 0,
  "notes": "string"
}

Scores must be 0-100.

Job posting data:
${JSON.stringify(job, null, 2)}
          `,
        });

        const analysis = extractJson(response.output_text);

        const { error: updateError } = await supabase
          .from("jobs")
          .update({
            ai_analysis: analysis,
            ai_summary: analysis.summary,
            ai_score: analysis.data_quality_score,
          })
          .eq("id", job.id);

        if (updateError) throw new Error(updateError.message);

        analyzed++;
        results.push({ jobId: job.id, ok: true });
      } catch (err: any) {
        failed++;
        results.push({ jobId: job.id, ok: false, error: err.message ?? "Unknown error" });
      }
    }

    return NextResponse.json({ ok: true, analyzed, failed, results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Batch analysis failed" },
      { status: 500 }
    );
  }
}
