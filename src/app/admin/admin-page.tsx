"use client"

import { useState } from "react"

export default function AdminPage() {
  const [jobId, setJobId] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    if (!jobId.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jobId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-semibold tracking-tight text-white">
              JobTrace
            </div>

            <div className="text-xs text-zinc-500">
              Labor Market Intelligence, not ads.
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/dashboard" className="hover:text-white transition">
              Dashboard
            </a>

            <a href="/" className="hover:text-white transition">
              Home
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center gap-4 text-sm text-zinc-400">
          <a href="/dashboard" className="hover:text-white transition">
            ← Dashboard
          </a>

          <a href="/" className="hover:text-white transition">
            Home
          </a>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Admin
          </h1>

          <p className="mt-2 text-zinc-400">
            Internal operations and labor market data controls.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">AI Job Analysis</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Run OpenAI analysis on a job by ID and inspect the result.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Job ID"
              className="w-48 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !jobId.trim()}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-600 disabled:opacity-40"
            >
              {loading ? "Analyzing…" : "Analyze Job"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-4">
              {typeof result.ai_score === "number" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">AI Score</span>
                  <span className="text-2xl font-bold text-white">
                    {result.ai_score}
                  </span>
                </div>
              )}

              {typeof result.ai_summary === "string" && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Summary
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{result.ai_summary}</p>
                </div>
              )}

              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Full Response
                </p>
                <pre className="overflow-x-auto text-xs text-zinc-400">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
