
"use client";

import { useState } from "react";

const SIGNALS = [
  {
    region: "Bay Area Core",
    count: 122,
    city: "San Francisco",
    industries: ["Artificial Intelligence", "Cloud", "Software"],
    companies: ["Anthropic", "OpenAI", "Databricks", "Cloudflare"],
    latest: "2 minutes ago",
    x: "30%",
    y: "30%",
  },
  {
    region: "South Bay",
    count: 11,
    city: "Santa Clara",
    industries: ["Semiconductors", "Infrastructure", "Hardware"],
    companies: ["NVIDIA", "Tesla", "Applied Materials"],
    latest: "8 minutes ago",
    x: "52%",
    y: "58%",
  },
  {
    region: "Remote / Distributed",
    count: 105,
    city: "Distributed",
    industries: ["Remote", "Operations", "Software"],
    companies: ["Reddit", "GitLab", "Figma"],
    latest: "1 minute ago",
    x: "70%",
    y: "42%",
  },
  {
    region: "East Bay",
    count: 37,
    city: "Oakland",
    industries: ["Logistics", "Construction", "Operations"],
    companies: ["ABC", "Clear Water Services", "Chime"],
    latest: "11 minutes ago",
    x: "43%",
    y: "39%",
  },
];

export default function MapExplorer() {
  const [selected, setSelected] = useState(SIGNALS[0]);

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="hover:opacity-90">
            <div className="text-xl font-semibold tracking-tight text-white">
              JobTrace
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Map Intelligence
            </div>
          </a>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/dashboard" className="hover:text-white transition">
              Dashboard
            </a>
            <a href="/companies" className="hover:text-white transition">
              Companies
            </a>
            <a href="/map" className="text-white">
              Map
            </a>
            <a href="/" className="hover:text-white transition">
              Search
            </a>
          </nav>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-73px)] grid-cols-[360px_1fr_420px]">
        <aside className="border-r border-zinc-800 bg-black/40 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
            Regional Signals
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-white">
            Explore Hiring Geography
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Click a regional signal to inspect companies, industries, and hiring activity.
          </p>

          <div className="mt-8 space-y-3">
            {SIGNALS.map((signal) => (
              <button
                key={signal.region}
                onClick={() => setSelected(signal)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected.region === signal.region
                    ? "border-cyan-400/50 bg-cyan-950/20"
                    : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-zinc-100">
                      {signal.region}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {signal.city}
                    </div>
                  </div>

                  <div className="text-2xl font-semibold text-cyan-300">
                    {signal.count}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="relative overflow-hidden bg-[#030303]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:80px_80px]" />

          <div className="absolute left-8 top-8 rounded-2xl border border-zinc-800 bg-black/70 p-5 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
              Active Region
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {selected.region}
            </div>
          </div>

          {SIGNALS.map((signal) => (
            <button
              key={signal.region}
              onClick={() => setSelected(signal)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition hover:scale-110"
              style={{ left: signal.x, top: signal.y }}
            >
              <div
                className={`absolute -left-12 -top-12 h-24 w-24 rounded-full ${
                  selected.region === signal.region
                    ? "bg-cyan-400/30 animate-ping"
                    : "bg-cyan-400/10"
                }`}
              />
              <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-cyan-400 shadow-[0_0_60px_#22d3ee]">
                <div className="h-3 w-3 rounded-full bg-white" />
              </div>
              <div className="mt-3 whitespace-nowrap rounded-full border border-zinc-800 bg-black/80 px-3 py-1 text-xs text-zinc-300">
                {signal.region}
              </div>
            </button>
          ))}

          <div className="absolute bottom-8 left-8 rounded-2xl border border-zinc-800 bg-black/70 p-5 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
              Map Status
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-zinc-300">
                Exploratory signal layer active
              </span>
            </div>
          </div>
        </section>

        <aside className="border-l border-zinc-800 bg-black/50 p-6">
          <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
            Signal Intelligence
          </div>

          <h2 className="mt-3 text-4xl font-semibold text-white">
            {selected.region}
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Signals
              </div>
              <div className="mt-2 text-3xl font-semibold text-cyan-300">
                {selected.count}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Latest
              </div>
              <div className="mt-2 text-lg text-emerald-300">
                {selected.latest}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Companies Active Here
            </div>

            <div className="mt-4 space-y-3">
              {selected.companies.map((company) => (
                <a
                  key={company}
                  href="/companies"
                  className="block rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 hover:border-cyan-400/40"
                >
                  <div className="text-lg font-medium text-white">
                    {company}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    View company intelligence →
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">
              Dominant Industries
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-full border border-cyan-900/50 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-200"
                >
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
