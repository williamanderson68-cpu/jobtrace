'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (title) params.set('title', title)
    if (location) params.set('location', location)

    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold mb-4 tracking-tight">
          JobTrace
        </h1>

        <p className="text-xl text-gray-400 mb-2">
          Search jobs like labor market data, not classified ads.
        </p>

        <p className="text-sm text-gray-500 mb-12">
          Job data, not ads.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Job title or keyword"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-lg outline-none focus:border-blue-500"
          />

          <input
            type="text"
            placeholder="City or region"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-4 text-lg outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-4 text-lg font-semibold"
        >
          Search Job Data
        </button>
      </div>
    </main>
  )
}
