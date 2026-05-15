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

function relativeTime(value: string | null) {
  if (!value) return "time unknown";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default async function DashboardEventStream({
  limit = 6,
}: {
  limit?: number;
}) {
  const { data: events, error } = await supabase
    .from("job_events")
    .select(
      "id, event_type, event_title, event_description, company_name, job_title, city, state, region, signal_strength, confidence_score, occurred_at"
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
        Event stream error: {error.message}
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-400">
        No timeline events yet. Run the generate-events endpoint to populate activity.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(events as EventRow[]).map((event) => (
        <a
          key={event.id}
          href="/events"
          className="block rounded-xl border border-zinc-800 bg-black/30 p-4 transition hover:border-zinc-700"
        >
          <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.75)]" />

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">
                {formatEventType(event.event_type)}
              </div>

              <div className="mt-1 text-sm leading-relaxed text-zinc-200">
                {event.event_title}
              </div>

              {event.event_description && (
                <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                  {event.event_description}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                {event.company_name && (
                  <span className="rounded-full border border-zinc-800 px-2 py-1">
                    {event.company_name}
                  </span>
                )}

                {event.region && (
                  <span className="rounded-full border border-zinc-800 px-2 py-1">
                    {event.region}
                  </span>
                )}

                <span className="rounded-full border border-zinc-800 px-2 py-1">
                  {relativeTime(event.occurred_at)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                Signal
              </div>
              <div className="mt-1 text-lg font-semibold text-cyan-300">
                {event.signal_strength || 0}
              </div>
            </div>
          </div>
        </a>
      ))}

      <a
        href="/events"
        className="block rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3 text-center text-sm font-medium text-cyan-200 hover:border-cyan-400/60 hover:text-white"
      >
        Open full labor market timeline →
      </a>
    </div>
  );
}
