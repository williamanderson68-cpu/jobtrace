"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
};

export default function DashboardClient() {
  const searchParams = useSearchParams();

  const initialKeyword = searchParams.get("keyword") || "";
  const initialLocation = searchParams.get("location") || "";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);

      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,company,location,pay_range,source,url,status,employment_type,remote_type,first_seen_at,last_checked_at,data_quality"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Supabase error:", error);
        setJobs([]);
      } else {
        setJobs(data || []);
      }

      setLoading(false);
    }

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const keywordText = `${job.title || ""} ${job.company || ""}`.toLowerCase();
      const locationText = `${job.location || ""}`.toLowerCase();

      const keywordMatch =
        keyword.trim() === "" || keywordText.includes(keyword.toLowerCase());

      const locationMatch =
        location.trim() === "" || locationText.includes(location.toLowerCase());

      return keywordMatch && locationMatch;
    });
  }, [jobs, keyword, location]);

  const activeJobs = filteredJobs.filter(
    (job) => job.status?.toLowerCase() === "active"
  ).length;

  const companies = new Set(filteredJobs.map((job) => job.company).filter(Boolean));
  const payListed = filteredJobs.filter((job) => job.pay_range).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm text-cyan-300 hover:underline">
              ← Back to search
            </Link>

            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
              Job Market Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Results are pulled from your Supabase jobs table and filtered by
              search terms.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
          >
            Admin / Import
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Filter by title, keyword, or company"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by city or region"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>
        </div>

        {loading && (
          <p className="mt-8 text-slate-400">Loading jobs from Supabase...</p>
        )}

        {!loading && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">Matching Jobs</p>
                <p className="mt-2 text-4xl font-bold">{filteredJobs.length}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">Active Postings</p>
                <p className="mt-2 text-4xl font-bold">{activeJobs}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">Companies</p>
                <p className="mt-2 text-4xl font-bold">{companies.size}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">With Pay Listed</p>
                <p className="mt-2 text-4xl font-bold">{payListed}</p>
              </div>
            </section>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-5 py-4">Job</th>
                    <th className="px-5 py-4">Company</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Pay</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Source</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="border-t border-slate-800">
                      <td className="px-5 py-4 font-medium">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-cyan-300 hover:underline"
                        >
                          {job.title || "Unknown Title"}
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {job.company || "Unknown Company"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {job.location || "Unknown Location"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {job.pay_range || "Not Listed"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {job.employment_type || job.remote_type || "Unknown"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            job.status?.toLowerCase() === "active"
                              ? "bg-green-400/10 text-green-300"
                              : "bg-red-400/10 text-red-300"
                          }`}
                        >
                          {job.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {job.source || "Manual"}
                      </td>
                    </tr>
                  ))}

                  {filteredJobs.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-slate-400"
                      >
                        No jobs found. Try a different search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
