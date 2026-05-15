import { supabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  event_type: string;
  event_title: string;
  event_description: string | null;
  company_name: string | null;
  job_title: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  signal_strength: number | null;
  confidence_score: number | null;
  occurred_at: string | null;
};

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "Unknown time";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Unknown time";
  }
}

export default async function LaborEventFeed({
  limit = 12,
  companyId,
}: {
  limit?: number;
  companyId?: string;
}) {
  let query = supabase
    .from("job_events")
    .select(
      "id, event_type, event_title, event_description, company_name, job_title, city, state, region, signal_strength, confidence_score, occurred_at"
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const { data: events, error } = await query;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-red-200">
        Event feed error: {error.message}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-zinc-400">
        No timeline events found yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(events as EventRow[]).map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-cyan-400/80">
                {formatEventType(event.event_type)}
              </div>

              <div className="mt-2 text-lg font-semibold text-white">
                {event.event_title}
              </div>

              {event.event_description && (
                <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {event.event_description}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                {event.company_name && (
                  <span className="rounded-full border border-zinc-800 px-3 py-1">
                    {event.company_name}
                  </span>
                )}

                {event.region && (
                  <span className="rounded-full border border-zinc-800 px-3 py-1">
                    {event.region}
                  </span>
                )}

                {(event.city || event.state) && (
                  <span className="rounded-full border border-zinc-800 px-3 py-1">
                    {event.city || "Unknown"}
                    {event.state ? `, ${event.state}` : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-28 text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                Signal
              </div>

              <div className="mt-1 text-3xl font-semibold text-cyan-300">
                {event.signal_strength || 0}
              </div>

              <div className="mt-3 text-xs text-zinc-500">
                {formatDate(event.occurred_at)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
