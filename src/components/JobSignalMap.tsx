
"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Signal = {
  region: string;
  count: number;
  city: string;
  coordinates: [number, number];
};

const SIGNALS: Signal[] = [
  { region: "Bay Area Core", count: 122, city: "San Francisco", coordinates: [-122.4194, 37.7749] },
  { region: "South Bay", count: 11, city: "Santa Clara", coordinates: [-121.9552, 37.3541] },
  { region: "East Bay", count: 37, city: "Oakland", coordinates: [-122.2711, 37.8044] },
  { region: "Remote / Distributed", count: 105, city: "Distributed", coordinates: [-121.8863, 37.3382] },
];

export default function JobSignalMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerElementsRef = useRef<HTMLButtonElement[]>([]);
  const [mapboxReady, setMapboxReady] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [selected, setSelected] = useState<Signal>(SIGNALS[0]);

  function updateMarkerStyles(activeRegion: string) {
    markerElementsRef.current.forEach((el) => {
      const isActive = el.dataset.region === activeRegion;
      el.className = isActive
        ? "h-4 w-4 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.75)] transition-transform"
        : "h-3 w-3 rounded-full border border-cyan-100/80 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-transform hover:scale-125";
    });
  }

  function selectSignal(signal: Signal, fly = true) {
    setSelected(signal);
    updateMarkerStyles(signal.region);

    if (fly && mapRef.current && typeof mapRef.current.easeTo === "function") {
      mapRef.current.easeTo({
        center: signal.coordinates,
        zoom: 8.25,
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
          zoom: 7.35,
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
              ? "h-4 w-4 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.75)] transition-transform"
              : "h-3 w-3 rounded-full border border-cyan-100/80 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-transform hover:scale-125";

          el.addEventListener("click", () => selectSignal(signal, true));

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

  if (fallbackReason) {
    return (
      <div className="relative h-[520px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_60%)]" />
        <div className="absolute left-4 top-4 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          Mapbox fallback active: {fallbackReason}
        </div>
        <a
          href="/map"
          className="absolute right-4 top-4 rounded-xl border border-cyan-900/50 bg-black/80 px-4 py-2 text-sm text-cyan-200 backdrop-blur hover:border-cyan-400/60 hover:text-white"
        >
          Open full map →
        </a>
      </div>
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

      <div className="absolute bottom-4 left-4 z-20 rounded-2xl border border-zinc-800 bg-black/80 p-4 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Selected Signal
        </div>
        <div className="mt-2 text-xl font-semibold text-white">{selected.region}</div>
        <div className="mt-1 text-sm text-zinc-400">
          {selected.city} · {selected.count} active signals
        </div>
      </div>

      {!mapboxReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 text-center">
            <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_25px_#22d3ee]" />
            <div className="mt-4 text-sm uppercase tracking-[0.3em] text-zinc-500">
              Loading Mapbox
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
