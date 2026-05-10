"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Job = {
  id: number | string;
  title: string | null;
  company: string | null;
  location: string | null;
  pay_range: string | null;
  source: string | null;
  url: string | null;
  status: string | null;
  employment_type: string | null;
  remote_type: string | null;
  first_seen_at: string | null;
  last_checked_at: string | null;
  data_quality: string | null;
  notes: string | null;
};

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,company,location,pay_range,source,url,status,employment_type,remote_type,first_seen_at,last_checked_at,data_quality,notes"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        setJob(null);
      } else {
        setJob(data);
      }

      setLoading(false);
    }

    fetchJob();
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-cyan-300 hover:underline">
          ← Back to dashboard
        </Link>

        {loading && <p className="mt-8 text-slate-400">Loading job...</p>}

        {!loading && !job && (
          <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-6">
            <p className="text-red-300">Job not found.</p>
          </div>
        )}

        {!loading && job && (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              {job.company || "Unknown Company"}
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              {job.title || "Unknown Title"}
            </h1>

            <p className="mt-4 text-lg text-slate-300">
              {job.location || "Unknown Location"}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Info label="Pay Range" value={job.pay_range || "Not Listed"} />
              <Info label="Status" value={job.status || "Unknown"} />
              <Info
                label="Employment Type"
                value={job.employment_type || "Unknown"}
              />
              <Info label="Remote Type" value={job.remote_type || "Unknown"} />
              <Info label="Source" value={job.source || "Manual"} />
              <Info label="Data Quality" value={job.data_quality || "Unknown"} />
              <Info label="First Seen" value={job.first_seen_at || "Unknown"} />
              <Info
                label="Last Checked"
                value={job.last_checked_at || "Unknown"}
              />
            </div>

            {job.notes && (
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Notes</p>
                <p className="mt-2 text-slate-200">{job.notes}</p>
              </div>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300"
              >
                Open Original Posting
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-medium text-slate-100">{value}</p>
    </div>
  );
}
