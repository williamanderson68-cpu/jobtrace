'use client'

import { useEffect, useState } from 'react'

type Health = {
  ok: boolean
  totals: { jobs: number; events: number; companies: number; mapped: number; removed: number }
  configuredSources: Array<{ name: string; type: string; enabled: boolean; importedJobs: number }>
  recentRuns: Array<any>
}

export default function AdminPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState('')

  async function refreshHealth() {
    setLoading(true)
    const response = await fetch('/api/admin/health')
    setHealth(await response.json())
    setLoading(false)
  }

  async function runAction(label: string, endpoint: string, body?: object) {
    setActionStatus(`${label} running...`)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json()
    setActionStatus(`${label} complete: ${JSON.stringify(data.totals || data)}`)
    await refreshHealth()
  }

  useEffect(() => { refreshHealth() }, [])

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold">JobTrace Control Center</h1>
          <p className="text-zinc-500 text-sm mt-1">Import health, lifecycle detection, enrichment, and pipeline controls.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {[
            ['Jobs', health?.totals.jobs || 0, 'text-cyan-400'],
            ['Events', health?.totals.events || 0, 'text-green-400'],
            ['Companies', health?.totals.companies || 0, 'text-cyan-400'],
            ['Mapped', health?.totals.mapped || 0, 'text-amber-400'],
            ['Removed', health?.totals.removed || 0, 'text-red-400'],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Pipeline Controls</p>
            <h2 className="text-2xl font-semibold mb-6">Run Jobs</h2>
            <div className="space-y-3">
              <button onClick={() => runAction('Auto import', '/api/admin/run-auto-import', { limitPerSource: 10, norcalOnly: true })} className="w-full rounded-xl bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400">Run Auto Import</button>
              <button onClick={() => runAction('Geocode backfill', '/api/admin/run-geocode')} className="w-full rounded-xl border border-zinc-800 text-zinc-200 font-semibold py-3 hover:border-cyan-900">Run Geocode Backfill</button>
              <button onClick={() => runAction('Company enrichment', '/api/admin/run-enrichment')} className="w-full rounded-xl border border-zinc-800 text-zinc-200 font-semibold py-3 hover:border-cyan-900">Run Company Enrichment</button>
              <button onClick={() => runAction('Lifecycle detection', '/api/admin/mark-removed')} className="w-full rounded-xl border border-red-900 text-red-300 font-semibold py-3 hover:bg-red-950">Detect Removed Jobs</button>
            </div>
            {actionStatus && <p className="text-xs text-zinc-500 mt-5 break-words">{actionStatus}</p>}
          </div>

          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Source Health</p>
            <h2 className="text-2xl font-semibold mb-6">Configured Sources</h2>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {loading ? <p className="text-zinc-500">Loading source health...</p> : health?.configuredSources.map((source) => (
                <div key={source.name} className="grid grid-cols-4 gap-4 items-center border border-zinc-900 bg-black rounded-xl p-4">
                  <div><p className="font-medium">{source.name}</p><p className="text-zinc-500 text-xs">{source.type}</p></div>
                  <p className={source.enabled ? 'text-green-400' : 'text-red-400'}>{source.enabled ? 'enabled' : 'disabled'}</p>
                  <div><p className="text-cyan-400">{source.importedJobs}</p><p className="text-zinc-600 text-xs">jobs imported</p></div>
                  <p className="text-right text-zinc-500 text-xs">{source.importedJobs > 0 ? 'healthy' : 'needs data'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-2">Recent Runs</p>
          <h2 className="text-2xl font-semibold mb-6">Importer Run History</h2>
          <div className="space-y-3">
            {health?.recentRuns.length === 0 ? <p className="text-zinc-500">No importer runs recorded yet.</p> : health?.recentRuns.map((run) => (
              <div key={run.id} className="grid md:grid-cols-6 gap-4 border border-zinc-900 bg-black rounded-xl p-4">
                <div><p className="font-medium">{run.run_type}</p><p className="text-zinc-600 text-xs">{run.status}</p></div>
                <div><p className="text-zinc-500 text-xs">Attempted</p><p>{run.attempted}</p></div>
                <div><p className="text-zinc-500 text-xs">Imported</p><p className="text-green-400">{run.imported}</p></div>
                <div><p className="text-zinc-500 text-xs">Failed</p><p className="text-red-400">{run.failed}</p></div>
                <div><p className="text-zinc-500 text-xs">Events</p><p className="text-cyan-400">{run.events_created}</p></div>
                <p className="text-right text-zinc-500 text-xs">{new Date(run.started_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
