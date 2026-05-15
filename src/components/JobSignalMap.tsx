
"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Signal = {
  region: string;
  count: number;
  city: string;
  coordinates: [number, number];
  industries: string[];
  companies: string[];
  latest: string;
};

const SIGNALS: Signal[] = [
  {
    region: "Bay Area Core",
    count: 122,
    city: "San Francisco",
    coordinates: [-122.4194, 37.7749],
    industries: ["Artificial Intelligence", "Cloud", "Software"],
    companies: ["Anthropic", "OpenAI", "Databricks", "Cloudflare"],
    latest: "2 minutes ago",
  },
  {
    region: "South Bay",
    count: 11,
    city: "Santa Clara",
    coordinates: [-121.9552, 37.3541],
    industries: ["Semiconductors", "Infrastructure", "Hardware"],
    companies: ["NVIDIA", "Tesla", "Applied Materials"],
    latest: "8 minutes ago",
  },
  {
    region: "East Bay",
    count: 37,
    city: "Oakland",
    coordinates: [-122.2711, 37.8044],
    industries: ["Logistics", "Construction", "Operations"],
    companies: ["ABC", "Clear Water Services", "Chime"],
    latest: "11 minutes ago",
  },
  {
    region: "Remote / Distributed",
    count: 105,
    city: "Distributed",
    coordinates: [-121.8863, 37.3382],
    industries: ["Remote", "Operations", "Software"],
    companies: ["Reddit", "GitLab", "Figma"],
    latest: "1 minute ago",
  },
];

function SignalPanel({ selected }: { selected: Signal }) {
  return (
    <div className="absolute bottom-4 right-4 z-20 w-[350px] rounded-2xl border border-zinc-800 bg-black/85 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            Signal Intelligence
          </div>

          <h3 className="mt-2 text-2xl font-semibold text-white">
            {selected.region}
          </h3>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Signals
          </div>

          <div className="mt-1 text-2xl font-semibold text-cyan-300">
            {selected.count}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Region
          </div>

          <div className="mt-2 text-sm text-white">{selected.city}</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
            Latest
          </div>

          <div className="mt-2 text-sm text-emerald-300">
            {selected.latest}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
          Active Companies
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {selected.companies.slice(0, 4).map((company) => (
            <a
              key={company}
              href="/companies"
              className="rounded-full border border-zinc-700 bg-zinc-950/70 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-cyan-400/40 hover:text-white"
            >
              {company}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">
          Industries
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {selected.industries.slice(0, 3).map((industry) => (
            <div
              key={industry}
              className="rounded-full border border-cyan-900/40 bg-cyan-950/20 px-2.5 py-1.5 text-xs text-cyan-200"
            >
              {industry}
            </div>
          ))}
        </div>
      </div>

      <a
        href="/map"
        className="mt-4 block rounded-xl border border-cyan-900/50 bg-cyan-950/20 px-4 py-3 text-center text-sm font-medium text-cyan-200 hover:border-cyan-400/60 hover:text-white"
      >
        Open full map explorer →
      </a>
    </div>
  );
}

function AbstractSignalFallback({
  selected,
  setSelected,
  reason,
}: {
  selected: Signal;
  setSelected: (signal: Signal) => void;
  reason?: string;
}) {
  const positions: Record<string, string> = {
    "Bay Area Core": "left-[28%] top-[30%]",
    "South Bay": "left-[55%] top-[62%]",
    "East Bay": "left-[44%] top-[42%]",
    "Remote / Distributed": "left-[72%] top-[45%]",
  };

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:80px_80px]" />

      <a
        href="/map"
        className="absolute right-4 top-4 z-20 rounded-xl border border-cyan-900/50 bg-black/80 px-4 py-2 text-sm text-cyan-200 backdrop-blur hover:border-cyan-400/60 hover:text-white"
      >
        Open full map →
      </a>

      {reason && (
        <div className="absolute left-4 bottom-4 z-20 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          Mapbox fallback active: {reason}
        </div>
      )}

      {SIGNALS.map((signal) => (
        <button
          key={signal.region}
          onClick={() => setSelected(signal)}
          className={`absolute ${positions[signal.region]} z-10 -translate-x-1/2 -translate-y-1/2 transition hover:scale-110`}
        >
          <div
            className={`absolute -left-12 -top-12 h-24 w-24 rounded-full ${
              selected.region === signal.region
                ? "animate-ping bg-cyan-400/30"
                : "bg-cyan-400/10"
            }`}
          />
          <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-cyan-400 shadow-[0_0_60px_#22d3ee]">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
        </button>
      ))}

      <SignalPanel selected={selected} />
    </div>
  );
}

export default function JobSignalMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState<Signal>(SIGNALS[0]);
  const [mapboxReady, setMapboxReady] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadMapbox() {
      const token =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

      if (!token) {
        setFallbackReason("missing token");
        return;
      }

      if (!mapContainerRef.current) {
        setFallbackReason("container not ready");
        return;
      }

      try {
        const mapboxglModule = await import("mapbox-gl");
        const mapboxgl = mapboxglModule.default;

        if (cancelled || !mapContainerRef.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-122.05, 37.62],
          zoom: 7.35,
          pitch: 0,
          bearing: 0,
          attributionControl: true,
        });

        mapRef.current = map;

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          if (cancelled) return;

          setMapboxReady(true);

          resizeTimer = setTimeout(() => {
            if (!cancelled && mapRef.current && typeof mapRef.current.resize === "function") {
              mapRef.current.resize();
            }
          }, 300);
        });

        SIGNALS.forEach((signal) => {
          const element = document.createElement("button");
          element.type = "button";
          element.className =
            "h-6 w-6 rounded-full border border-cyan-100 bg-cyan-400 shadow-[0_0_35px_#22d3ee] hover:scale-110 transition-transform";

          element.addEventListener("click", () => {
            setSelected(signal);

            if (mapRef.current && typeof mapRef.current.flyTo === "function") {
              mapRef.current.flyTo({
                center: signal.coordinates,
                zoom: 9,
                duration: 900,
              });
            }
          });

          const marker = new mapboxgl.Marker(element)
            .setLngLat(signal.coordinates)
            .addTo(map);

          markersRef.current.push(marker);
        });
      } catch (error: any) {
        console.error("Mapbox failed to load:", error);
        setFallbackReason(error?.message || "map load failed");
      }
    }

    loadMapbox();

    return () => {
      cancelled = true;

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") {
          marker.remove();
        }
      });
      markersRef.current = [];

      if (mapRef.current && typeof mapRef.current.remove === "function") {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
  }, []);

  if (fallbackReason) {
    return (
      <AbstractSignalFallback
        selected={selected}
        setSelected={setSelected}
        reason={fallbackReason}
      />
    );
  }

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#050505]">
      <div ref={mapContainerRef} className="h-full w-full" />

      <a
        href="/map"
        className="absolute right-4 top-4 z-20 rounded-xl border border-cyan-900/50 bg-black/80 px-4 py-2 text-sm text-cyan-200 backdrop-blur hover:border-cyan-400/60 hover:text-white"
      >
        Open full map →
      </a>

      {!mapboxReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 text-center">
            <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_25px_#22d3ee]" />
            <div className="mt-4 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Loading Mapbox
            </div>
          </div>
        </div>
      )}

      <div className="absolute left-4 top-4 z-10 w-64 rounded-2xl border border-zinc-800 bg-black/80 p-4 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
          Region Filter
        </div>

        <div className="mt-3 space-y-2">
          {SIGNALS.map((signal) => (
            <button
              key={signal.region}
              onClick={() => {
                setSelected(signal);

                if (mapRef.current && typeof mapRef.current.flyTo === "function") {
                  mapRef.current.flyTo({
                    center: signal.coordinates,
                    zoom: 9,
                    duration: 900,
                  });
                }
              }}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                selected.region === signal.region
                  ? "border-cyan-400/40 bg-cyan-950/20"
                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-200">{signal.region}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{signal.city}</div>
                </div>

                <div className="text-lg font-semibold text-cyan-300">
                  {signal.count}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <SignalPanel selected={selected} />
    </div>
  );
}
