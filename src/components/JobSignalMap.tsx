"use client";

import { useState } from "react";

type Signal = {
  region: string;
  count: number;
  city: string;
  x: string;
  y: string;
};

const SIGNALS: Signal[] = [
  {
    region: "Bay Area Core",
    count: 122,
    city: "San Francisco",
    x: "34%",
    y: "36%",
  },
  {
    region: "East Bay",
    count: 37,
    city: "Oakland",
    x: "48%",
    y: "45%",
  },
  {
    region: "South Bay",
    count: 11,
    city: "Santa Clara",
    x: "58%",
    y: "67%",
  },
  {
    region: "Remote / Distributed",
    count: 105,
    city: "Distributed",
    x: "74%",
    y: "52%",
  },
];

export default function JobSignalMap() {
  const [selected, setSelected] = useState<Signal>(SIGNALS[0]);

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />

      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="absolute left-6 top-6 z-20 rounded-2xl border border-zinc-800 bg-black/75 p-4 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          Preview Layer
        </div>

        <div className="mt-2 text-lg font-semibold text-white">
          Regional Hiring Signals
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Open full map for interactive Mapbox exploration.
        </div>
      </div>

      <a
        href="/map"
        className="absolute right-6 top-6 z-20 rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3 text-sm font-medium text-cyan-200 backdrop-blur hover:border-cyan-400/60 hover:text-white"
      >
        Open full map →
      </a>

      {SIGNALS.map((signal) => {
        const active = selected.region === signal.region;

        return (
          <button
            key={signal.region}
            onClick={() => setSelected(signal)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110"
            style={{ left: signal.x, top: signal.y }}
            aria-label={signal.region}
          >
            <div
              className={`absolute -left-14 -top-14 h-28 w-28 rounded-full ${
                active ? "bg-cyan-400/20" : "bg-cyan-400/10"
              } blur-xl`}
            />

            <div
              className={`absolute -left-10 -top-10 h-20 w-20 rounded-full ${
                active ? "animate-pulse bg-cyan-400/20" : "bg-cyan-400/10"
              }`}
            />

            <div
              className={`relative flex items-center justify-center rounded-full border ${
                active
                  ? "h-8 w-8 border-white bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.8)]"
                  : "h-5 w-5 border-cyan-100/80 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.45)]"
              }`}
            >
              {active && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
            </div>

            <div
              className={`mt-3 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                active
                  ? "border-cyan-400/50 bg-cyan-950/30 text-cyan-100"
                  : "border-zinc-800 bg-black/70 text-zinc-400"
              }`}
            >
              {signal.region}
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-6 left-6 z-20 w-72 rounded-2xl border border-zinc-800 bg-black/80 p-4 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Selected Signal
        </div>

        <div className="mt-2 text-2xl font-semibold text-white">
          {selected.region}
        </div>

        <div className="mt-1 text-sm text-zinc-400">
          {selected.city}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-zinc-800 pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-600">
            Active Signals
          </div>

          <div className="text-3xl font-semibold text-cyan-300">
            {selected.count}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 rounded-2xl border border-zinc-800 bg-black/80 p-4 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Mapbox
        </div>

        <div className="mt-2 text-sm text-zinc-300">
          Available on full map
        </div>
      </div>
    </div>
  );
}
