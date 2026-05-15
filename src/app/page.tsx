'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (title.trim()) params.set('title', title.trim())
    if (location.trim()) params.set('location', location.trim())

    const queryString = params.toString()
    router.push(queryString ? `/dashboard?${queryString}` : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#070707] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_25%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
            <div>
              <div className="text-xl font-semibold tracking-tight text-white">JobTrace</div>
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Labor Market Intelligence</div>
            </div>
          </div>

          <a href="/dashboard" className="text-sm text-zinc-400 transition hover:text-white">
            Dashboard
          </a>
        </header>

        <section className="flex flex-1 items-center justify-center py-20">
          <div className="w-full max-w-4xl text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.35em] text-cyan-400/80">
              Regional hiring signal platform
            </p>

            <h1 className="mb-5 text-5xl font-semibold tracking-tight text-white md:text-7xl">
              JobTrace
            </h1>

            <p className="mb-3 text-xl text-zinc-300 md:text-2xl">
              Labor Market Intelligence, not ads.
            </p>

            <p className="mx-auto mb-12 max-w-2xl text-sm leading-6 text-zinc-500 md:text-base">
              Search hiring activity as market data: jobs, companies, locations, pay signals, and regional labor movement.
            </p>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Job title, keyword, or company"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  className="rounded-xl border border-zinc-800 bg-black px-5 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-500"
                />

                <input
                  type="text"
                  placeholder="City, county, or region"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  className="rounded-xl border border-zinc-800 bg-black px-5 py-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSearch}
                className="mt-3 w-full rounded-xl bg-cyan-400 px-5 py-4 text-base font-semibold text-black transition hover:bg-cyan-300"
              >
                Search Labor Market Data
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-left md:grid-cols-3">
              {[
                ['Map-first', 'Hiring signals organized by geography, not just job boards.'],
                ['Company-aware', 'Track employer activity, posting changes, and market movement.'],
                ['Signal focused', 'Designed for labor intelligence, not resume spam.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-zinc-900 bg-black/50 p-4">
                  <div className="text-sm font-medium text-zinc-200">{title}</div>
                  <p className="mt-2 text-sm leading-5 text-zinc-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
