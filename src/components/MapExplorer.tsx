
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

export default function MapExplorer() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerElementsRef = useRef<HTMLButtonElement[]>([]);
  const [selected, setSelected] = useState<Signal>(SIGNALS[0]);
  const [mapboxReady, setMapboxReady] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  function updateMarkerStyles(activeRegion: string) {
    markerElementsRef.current.forEach((el) => {
      const isActive = el.dataset.region === activeRegion;
      el.className = isActive
        ? "h-5 w-5 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-transform"
        : "h-3.5 w-3.5 rounded-full border border-cyan-100/80 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-transform hover:scale-125";
    });
  }

  function flyToSignal(signal: Signal) {
    setSelected(signal);
    updateMarkerStyles(signal.region);

    if (mapRef.current && typeof mapRef.current.easeTo === "function") {
      mapRef.current.easeTo({
        center: signal.coordinates,
        zoom: 8.8,
        duration: 650,
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadMapbox() {
      const token =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

      if (!token) {
        setFallbackReason("missing Mapbox token");
        return;
      }

      if (!mapContainerRef.current) {
        setFallbackReason("map container not ready");
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
          zoom: 7.45,
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
          const el = document.createElement("button");
          el.type = "button";
          el.dataset.region = signal.region;
          el.setAttribute("aria-label", signal.region);
          el.className =
            signal.region === selected.region
              ? "h-5 w-5 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-transform"
              : "h-3.5 w-3.5 rounded-full border border-cyan-100/80 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-transform hover:scale-125";

          el.addEventListener("click", () => flyToSignal(signal));

          const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat(signal.coordinates)
            .addTo(map);

          markersRef.current.push(marker);
          markerElementsRef.current.push(el);
        });
      } catch (error: any) {
        setFallbackReason(error?.message || "Mapbox failed to load");
      }
    }

    loadMapbox();

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);

      markersRef.current.forEach((marker) => {
        if (marker && typeof marker.remove === "function") marker.remove();
      });
      markersRef.current = [];
      markerElementsRef.current = [];

      if (mapRef.current && typeof mapRef.current.remove === "function") {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
  }, []);

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

      <main className="grid min-h-[calc(100vh-73px)] grid-cols-[340px_1fr_420px]">
        <aside className="border-r border-zinc-800 bg-black/50 p-6">
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
                onClick={() => flyToSignal(signal)}
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
          <div ref={mapContainerRef} className="h-full min-h-[calc(100vh-73px)] w-full" />

          {!mapboxReady && !fallbackReason && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 text-center">
                <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_25px_#22d3ee]" />
                <div className="mt-4 text-sm uppercase tracking-[0.3em] text-zinc-500">
                  Loading Mapbox
                </div>
              </div>
            </div>
          )}

          {fallbackReason && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="max-w-lg rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6 text-amber-100">
                <div className="text-xs uppercase tracking-[0.35em] text-amber-300">
                  Mapbox Fallback
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  Map could not load
                </div>
                <div className="mt-3 text-sm text-amber-200">
                  {fallbackReason}
                </div>
              </div>
            </div>
          )}
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
