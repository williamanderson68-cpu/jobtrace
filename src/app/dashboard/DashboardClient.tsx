"use client";

import JobSignalMap from "@/components/JobSignalMap";
import DashboardEventStream from "@/components/DashboardEventStream";
import type { AiInsights } from "./page";

export default function DashboardClient({ aiInsights }: { aiInsights: AiInsights }) {
  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />

              <div>
                <div className="text-2xl font-semibold tracking-tight text-white">
                  JobTrace
                </div>

                <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Labor Market Intelligence
                </div>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/dashboard" className="text-white">
              Dashboard
            </a>

            <a href="/companies" className="hover:text-white transition">
              Companies
            </a>

            <a href="/map" className="hover:text-white transition">
              Map
            </a>

            <a href="/events" className="hover:text-white transition">
              Events
            </a>

            <a href="/" className="hover:text-white transition">
              Search
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs">
          <div className="rounded-full border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-emerald-300">
            ● SYSTEM ACTIVE
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-zinc-400">
            Timeline engine online
          </div>

          <div className="rounded-full border border-cyan-900/60 bg-cyan-950/40 px-3 py-1 text-cyan-300">
            Event stream connected
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-zinc-400">
            Northern California Region
          </div>
        </div>

        <div className="mb-10">
          <div className="mb-2 text-xs uppercase tracking-[0.35em] text-zinc-600">
            Intelligence Query
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-white">
            Northern California Labor Market
          </h1>

          <p className="mt-4 max-w-3xl text-2xl text-zinc-400">
            Labor Market Intelligence, not ads.
          </p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[
            ["Jobs Tracked", "300", "text-cyan-300"],
            ["Companies Hiring", "17", "text-white"],
            ["Mapped Signals", "238", "text-emerald-300"],
            ["Timeline Events", "Live", "text-emerald-300"],
            ["Regions Active", "8", "text-cyan-300"],
            ["Cities Covered", "107", "text-white"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
            >
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                {label}
              </div>

              <div className={`mt-4 text-5xl font-semibold ${color}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {aiInsights.analyzedCount > 0 ? (
          <div className="mb-10">
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-600">
              AI Insights
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {[
                ["Jobs Analyzed", String(aiInsights.analyzedCount), "text-white"],
                ["Avg AI Score", aiInsights.avgScore != null ? String(aiInsights.avgScore) : "—", "text-cyan-300"],
                ["Avg Wage Transparency", aiInsights.avgWageTransparency != null ? String(aiInsights.avgWageTransparency) : "—", "text-emerald-300"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">{label}</div>
                  <div className={`mt-4 text-5xl font-semibold ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="mb-4 text-xs uppercase tracking-[0.25em] text-zinc-600">
                  Highest AI Exposure
                </div>
                {aiInsights.topExposure.length === 0 ? (
                  <p className="text-sm text-zinc-600">No data yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {aiInsights.topExposure.map((job, i) => (
                      <li key={job.id}>
                        <a href={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 hover:border-zinc-700 transition">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-600">#{i + 1}</span>
                              <span className="truncate text-sm text-zinc-200">{job.title}</span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{job.company}</div>
                          </div>
                          <span className="shrink-0 text-lg font-semibold text-amber-300">{job.score}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <div className="mb-4 text-xs uppercase tracking-[0.25em] text-zinc-600">
                  Highest Confidence Jobs
                </div>
                {aiInsights.topConfidence.length === 0 ? (
                  <p className="text-sm text-zinc-600">No data yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {aiInsights.topConfidence.map((job, i) => (
                      <li key={job.id}>
                        <a href={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 hover:border-zinc-700 transition">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-600">#{i + 1}</span>
                              <span className="truncate text-sm text-zinc-200">{job.title}</span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{job.company}</div>
                          </div>
                          <span className="shrink-0 text-lg font-semibold text-emerald-300">{job.score}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.8fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
                  Geographic Intelligence
                </div>

                <h2 className="mt-3 text-4xl font-semibold text-white">
                  Live Map of Hiring Signals
                </h2>
              </div>

              <a
                href="/map"
                className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3 text-sm font-medium text-cyan-200 hover:border-cyan-400/60 hover:text-white"
              >
                Open full map →
              </a>
            </div>

            <JobSignalMap />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
            <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
              Event Stream
            </div>

            <h2 className="mt-3 text-4xl font-semibold text-white">
              Market Activity
            </h2>

            <div className="mt-6">
              <DashboardEventStream limit={6} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
