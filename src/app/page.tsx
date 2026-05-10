"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("keyword", keyword.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
            JobTrace
          </p>

          <h1 className="max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">
            Find out who is hiring, where, and for how much.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Search job posting data by role, company, or location. JobTrace
            turns listings into labor market intelligence.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Job title, keyword, or company"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
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

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="rounded-full border border-slate-800 px-4 py-2">
            Northern California focus
          </span>
          <span className="rounded-full border border-slate-800 px-4 py-2">
            Pay range tracking
          </span>
          <span className="rounded-full border border-slate-800 px-4 py-2">
            Daily job import ready
          </span>
        </div>
      </section>
    </main>
  );
}
