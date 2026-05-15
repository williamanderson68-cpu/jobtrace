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
  const [status, setStatus] = useState('Loading map tiles...')

  const mappedJobs = jobs.filter((job) => job.latitude && job.longitude)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
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
      zoom: 5.5,
      attributionControl: true,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const finishLoading = () => {
      map.resize()
      setStatus('')
    }

    map.on('load', finishLoading)
    map.on('style.load', finishLoading)
    map.on('idle', finishLoading)

    map.on('error', (event) => {
      console.error('Mapbox error:', event)
      setStatus('Mapbox error. Check browser console.')
    })

    setTimeout(() => {
      map.resize()
      setStatus('')
    }, 2500)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const existingMarkers = document.querySelectorAll('.jobtrace-map-marker')
    existingMarkers.forEach((marker) => marker.remove())

    const bounds = new mapboxgl.LngLatBounds()

    mappedJobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return

      const markerElement = document.createElement('a')
      markerElement.href = `/jobs/${job.id}`
      markerElement.className =
        'jobtrace-map-marker block h-4 w-4 rounded-full bg-cyan-400 border border-white shadow-[0_0_20px_rgba(34,211,238,1)]'

      const popup = new mapboxgl.Popup({
        offset: 16,
      }).setHTML(`
        <div style="color:#111827;font-family:system-ui;">
          <strong>${job.company}</strong><br/>
          <span>${job.title}</span><br/>
          <span style="color:#4b5563;">${job.location}</span><br/>
          <span style="color:#0891b2;">${job.salary || job.pay_range || 'Salary not listed'}</span>
        </div>
      `)

      new mapboxgl.Marker(markerElement)
        .setLngLat([Number(job.longitude), Number(job.latitude)])
        .setPopup(popup)
        .addTo(map)

      bounds.extend([Number(job.longitude), Number(job.latitude)])
    })

    if (mappedJobs.length > 0) {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 10,
        duration: 800,
      })
    }
  }, [mappedJobs.length])

  return (
    <div className="h-[460px] rounded-2xl border border-zinc-800 overflow-hidden relative bg-black">
      {status && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="h-3 w-3 bg-cyan-400 rounded-full animate-pulse mx-auto mb-4" />
            <p className="text-zinc-500">{status}</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  )
}
