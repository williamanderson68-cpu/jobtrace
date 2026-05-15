import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function regionFromLocation(city?: string | null, state?: string | null) {
  const c = (city || "").toLowerCase();

  if (["san francisco", "oakland", "berkeley", "emeryville", "san mateo"].includes(c)) {
    return "Bay Area Core";
  }

  if (["san jose", "santa clara", "sunnyvale", "cupertino", "mountain view", "palo alto"].includes(c)) {
    return "South Bay";
  }

  if (["fremont", "hayward", "pleasanton", "dublin", "livermore"].includes(c)) {
    return "East Bay";
  }

  if (state === "CA") {
    return "California";
  }

  return "Other / Remote";
}

function signalStrengthFromJob(job: any) {
  let score = 50;

  if (job.salary_min || job.salary_max) score += 10;
  if (job.city || job.location) score += 10;
  if (job.company_id) score += 10;
  if (job.status === "active") score += 5;

  return Math.min(score, 95);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body.limit || 50);

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        company,
        company_id,
        city,
        state,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (jobsError) {
      return NextResponse.json(
        { ok: false, error: jobsError.message },
        { status: 500 }
      );
    }

    const eventsToInsert = (jobs || []).map((job: any) => {
      const region = regionFromLocation(job.city, job.state);
      const companyName = job.company || "Unknown Company";
      const jobTitle = job.title || "Untitled job";

      return {
        event_type: "job_detected",
        event_title: `${companyName} detected hiring activity`,
        event_description: `${jobTitle} was detected as an active labor-market signal.`,
        job_id: job.id,
        company_id: job.company_id || null,
        company_name: companyName,
        job_title: jobTitle,
        city: job.city || null,
        state: job.state || null,
        region,
        signal_strength: signalStrengthFromJob(job),
        confidence_score: job.company_id ? 80 : 60,
        metadata: {
          source: "generate-events:v1",
          job_status: job.status || null,
        },
        occurred_at: job.updated_at || job.created_at || new Date().toISOString(),
      };
    });

    if (!eventsToInsert.length) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        message: "No jobs found to generate events from.",
      });
    }

    // Avoid duplicate job_detected events for the same job.
    const { data: existingEvents } = await supabase
      .from("job_events")
      .select("job_id")
      .eq("event_type", "job_detected")
      .in(
        "job_id",
        eventsToInsert.map((event: any) => event.job_id)
      );

    const existingJobIds = new Set((existingEvents || []).map((event: any) => event.job_id));

    const newEvents = eventsToInsert.filter(
      (event: any) => !existingJobIds.has(event.job_id)
    );

    if (!newEvents.length) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        skipped: eventsToInsert.length,
        message: "Events already exist for these jobs.",
      });
    }

    const { error: insertError } = await supabase
      .from("job_events")
      .insert(newEvents);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: newEvents.length,
      skipped: eventsToInsert.length - newEvents.length,
      event_type: "job_detected",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Unknown event generation error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/generate-events",
    usage: {
      generateRecentJobEvents: 'POST {"limit":50}',
    },
  });
}
