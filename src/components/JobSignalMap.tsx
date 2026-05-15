'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type MapJob = {
  id: number
  title: string
  company: string
  location: string
  salary?: string | null
  pay_range?: string | null
  latitude?: number | null
  longitude?: number | null
}

export default function JobSignalMap({ jobs }: { jobs: MapJob[] }) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [status, setStatus] = useState('Loading map...')

  const mappedJobs = jobs.filter((job) => job.latitude && job.longitude)

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
      style: 'mapbox://styles/mapbox/streets-v12',
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

    setTimeout(() => {
      map.resize()
      setStatus('')
    }, 2000)

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

    if (mappedJobs.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    mappedJobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
        <div style="color:#111827;font-family:system-ui;min-width:180px;">
          <strong>${job.company}</strong><br/>
          <span>${job.title}</span><br/>
          <span style="color:#4b5563;">${job.location}</span><br/>
          <span style="color:#0891b2;">${job.salary || job.pay_range || 'Salary not listed'}</span><br/>
          <a href="/jobs/${job.id}" style="display:inline-block;margin-top:8px;color:#0891b2;font-weight:700;">
            Open intelligence file
          </a>
        </div>
      `)

      const marker = new mapboxgl.Marker({ color: '#22d3ee' })
        .setLngLat([Number(job.longitude), Number(job.latitude)])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([Number(job.longitude), Number(job.latitude)])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 10,
        duration: 800,
      })
    }
  }, [mappedJobs.length])

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
    </div>
  )
}