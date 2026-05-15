'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type MapJob = {
  id: number
  title: string
  company: string
  location: string
  salary?: string | null
  pay_range?: string | null
  source?: string | null
  latitude?: number | null
  longitude?: number | null
}

function getRegion(location: string) {
  const text = location.toLowerCase()

  if (
    text.includes('san francisco') ||
    text.includes('oakland') ||
    text.includes('berkeley') ||
    text.includes('alameda') ||
    text.includes('emeryville')
  ) {
    return 'Bay Area Core'
  }

  if (
    text.includes('san jose') ||
    text.includes('santa clara') ||
    text.includes('sunnyvale') ||
    text.includes('mountain view') ||
    text.includes('palo alto') ||
    text.includes('fremont')
  ) {
    return 'South Bay'
  }

  if (
    text.includes('sacramento') ||
    text.includes('roseville') ||
    text.includes('rocklin') ||
    text.includes('davis')
  ) {
    return 'Sacramento Corridor'
  }

  if (
    text.includes('napa') ||
    text.includes('santa rosa') ||
    text.includes('vallejo')
  ) {
    return 'North Bay'
  }

  return 'Other / Remote'
}

export default function JobSignalMap({ jobs }: { jobs: MapJob[] }) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [status, setStatus] = useState('Loading map...')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')

  const mappedJobs = useMemo(() => {
    return jobs.filter((job) => job.latitude && job.longitude)
  }, [jobs])

  const filteredJobs = useMemo(() => {
    if (selectedRegion === 'All Regions') return mappedJobs
    return mappedJobs.filter((job) => getRegion(job.location) === selectedRegion)
  }, [mappedJobs, selectedRegion])

  const regionSignals = useMemo(() => {
    const regions: Record<string, { count: number; companies: Set<string> }> = {}

    mappedJobs.forEach((job) => {
      const region = getRegion(job.location)

      if (!regions[region]) {
        regions[region] = {
          count: 0,
          companies: new Set(),
        }
      }

      regions[region].count += 1
      regions[region].companies.add(job.company)
    })

    return Object.entries(regions)
      .map(([name, value]) => ({
        name,
        count: value.count,
        companies: value.companies.size,
      }))
      .sort((a, b) => b.count - a.count)
  }, [mappedJobs])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!token) {
      setStatus('Missing NEXT_PUBLIC_MAPBOX_TOKEN')
      return
    }

    if (!mapContainer.current || mapRef.current) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.18, 37.85],
      zoom: 6,
      attributionControl: true,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      setStatus('')
      map.resize()
    })

    map.on('idle', () => {
      setStatus('')
      map.resize()
    })

    map.on('error', (event) => {
      console.error('Mapbox error:', event)
      setStatus('Mapbox loaded with an error. Check console.')
    })

const resizeTimer = setTimeout(() => {
  if (map) {
    map.resize()
  }

  setStatus('')
}, 2000)

return () => clearTimeout(resizeTimer)
    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (filteredJobs.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    filteredJobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return

      const markerElement = document.createElement('div')
      markerElement.className = 'relative flex h-5 w-5 items-center justify-center cursor-pointer'
      markerElement.innerHTML = '<span style="position:absolute;height:28px;width:28px;border-radius:9999px;background:rgba(34,211,238,0.18);box-shadow:0 0 26px rgba(34,211,238,0.65);"></span><span style="position:relative;height:11px;width:11px;border-radius:9999px;background:#22d3ee;border:1px solid rgba(255,255,255,0.8);box-shadow:0 0 18px rgba(34,211,238,1);"></span>'

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
        <div style="color:#111827;font-family:system-ui;min-width:210px;">
          <div style="font-weight:800;margin-bottom:4px;">${job.company}</div>
          <div style="font-size:12px;margin-bottom:4px;">${job.title}</div>
          <div style="font-size:11px;color:#4b5563;margin-bottom:6px;">${job.location}</div>
          <div style="font-size:11px;color:#0891b2;font-weight:700;">
            ${job.salary || job.pay_range || 'Salary not listed'}
          </div>
          <a href="/jobs/${job.id}" style="display:inline-block;margin-top:10px;color:#0891b2;font-weight:800;font-size:12px;">
            Open intelligence file →
          </a>
        </div>
      `)

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([Number(job.longitude), Number(job.latitude)])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([Number(job.longitude), Number(job.latitude)])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 90,
        maxZoom: 10,
        duration: 800,
      })
    }
  }, [filteredJobs])

  return (
    <div
      className="relative rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950"
      style={{
        height: '460px',
        width: '100%',
        minHeight: '460px',
      }}
    >
      {status && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse mx-auto mb-4" />
            <p className="text-zinc-500">{status}</p>
          </div>
        </div>
      )}

      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          minHeight: '460px',
        }}
      />

      <div className="absolute left-4 top-4 z-10 rounded-xl border border-zinc-800 bg-black/85 p-4 backdrop-blur w-72">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Regional Signal Filter
        </p>

        <select
          value={selectedRegion}
          onChange={(event) => setSelectedRegion(event.target.value)}
          className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none"
        >
          <option>All Regions</option>
          {regionSignals.map((region) => (
            <option key={region.name}>{region.name}</option>
          ))}
        </select>

        <div className="mt-4 space-y-2">
          {regionSignals.length === 0 ? (
            <p className="text-xs text-zinc-500">No mapped signals yet.</p>
          ) : (
            regionSignals.slice(0, 5).map((region) => (
              <button
                key={region.name}
                onClick={() => setSelectedRegion(region.name)}
                className="w-full flex items-center justify-between text-left rounded-lg border border-zinc-900 bg-black/70 px-3 py-2 hover:border-cyan-900 transition"
              >
                <div>
                  <p className="text-xs text-zinc-200">{region.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {region.companies} employers
                  </p>
                </div>

                <p className="text-cyan-400 text-sm font-semibold">
                  {region.count}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="absolute right-4 bottom-4 z-10 rounded-xl border border-zinc-800 bg-black/85 p-4 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Map Intelligence
        </p>

        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)]" />
            Job signal
          </div>

          <p className="text-zinc-500">
            {filteredJobs.length} of {mappedJobs.length} mapped postings visible
          </p>
        </div>
      </div>
    </div>
  )
}
