"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function runImport() {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/import");
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "Unknown import error"
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="text-sm text-cyan-300 hover:underline">
          ← Back home
        </Link>

        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
          JobTrace Admin
        </h1>

        <p className="mt-4 max-w-2xl text-slate-300">
          Run the V1 importer manually, check importer output, and verify that
          rows are reaching Supabase.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Daily Importer</h2>

          <p className="mt-2 text-slate-400">
            Vercel cron can call this once per day. For now, you can also run it
            manually here.
          </p>

          <button
            onClick={runImport}
            disabled={loading}
            className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Running Import..." : "Run Import Now"}
          </button>

          {result && (
            <pre className="mt-6 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              {result}
            </pre>
          )}
        </div>
      </section>
    </main>
  );
}
