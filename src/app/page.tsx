"use client";

import { useMemo, useState } from "react";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  pay: string;
  status: "Active" | "Expired";
  daysOpen: number;
};

const jobs: Job[] = [
  {
    id: 1,
    title: "Construction Project Manager",
    company: "Ghilotti Construction",
    location: "Santa Rosa, CA",
    pay: "$110k - $145k",
    status: "Active",
    daysOpen: 18,
  },
  {
    id: 2,
    title: "Water Treatment Operator",
    company: "Clear Water Services",
    location: "Oakland, CA",
    pay: "$34 - $45/hr",
    status: "Active",
    daysOpen: 9,
  },
  {
    id: 3,
    title: "Estimator",
    company: "Bay Area Contractor",
    location: "Walnut Creek, CA",
    pay: "$95k - $130k",
    status: "Expired",
    daysOpen: 41,
  },
  {
    id: 4,
    title: "Field Service Technician",
    company: "Industrial Pump Systems",
    location: "Sacramento, CA",
    pay: "$30 - $42/hr",
    status: "Active",
    daysOpen: 26,
  },
];

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const keywordMatch =
        keyword.trim() === "" ||
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.company.toLowerCase().includes(keyword.toLowerCase());

      const locationMatch =
        location.trim() === "" ||
        job.location.toLowerCase().includes(location.toLowerCase());

      return keywordMatch && locationMatch;
    });
  }, [keyword, location]);

  const activeJobs = filteredJobs.filter((job) => job.status === "Active").length;
  const expiredJobs = filteredJobs.filter((job) => job.status === "Expired").length;
  const avgDaysOpen =
    filteredJobs.length > 0
      ? Math.round(
          filteredJobs.reduce((sum, job) => sum + job.daysOpen, 0) /
            filteredJobs.length
        )
      : 0;

  function handleSearch() {
    setHasSearched(true);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              JobTrace
            </p>
            <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
              Search jobs like labor market data, not classified ads.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Track who is hiring, where jobs are located, how much they pay,
              and how long postings stay online.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, keyword, or company"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or region"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
              <button
                onClick={handleSearch}
                className="rounded-2xl bg-cyan-400 px-8 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Search
              </button>
            </div>
          </div>

          {hasSearched && (
            <section className="mt-10">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Matching Jobs</p>
                  <p className="mt-2 text-4xl font-bold">{filteredJobs.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Active Postings</p>
                  <p className="mt-2 text-4xl font-bold">{activeJobs}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">Avg. Days Open</p>
                  <p className="mt-2 text-4xl font-bold">{avgDaysOpen}</p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-5 py-4">Job</th>
                      <th className="px-5 py-4">Company</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">Pay</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Days Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="border-t border-slate-800">
                        <td className="px-5 py-4 font-medium">{job.title}</td>
                        <td className="px-5 py-4 text-slate-300">{job.company}</td>
                        <td className="px-5 py-4 text-slate-300">{job.location}</td>
                        <td className="px-5 py-4 text-slate-300">{job.pay}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              job.status === "Active"
                                ? "bg-green-400/10 text-green-300"
                                : "bg-red-400/10 text-red-300"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{job.daysOpen}</td>
                      </tr>
                    ))}

                    {filteredJobs.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-slate-400"
                        >
                          No jobs found. Try a different search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}