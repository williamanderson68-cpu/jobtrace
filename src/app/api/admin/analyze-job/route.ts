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

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

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
      .eq("id", jobId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      jobId,
      analysis,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "AI analysis failed" },
      { status: 500 }
    );
  }
}