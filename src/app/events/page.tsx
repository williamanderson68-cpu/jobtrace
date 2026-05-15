import LaborEventFeed from "@/components/LaborEventFeed";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="hover:opacity-90">
            <div className="text-xl font-semibold tracking-tight text-white">
              JobTrace
            </div>
            <div className="text-xs text-zinc-500">
              Labor Market Intelligence, not ads.
            </div>
          </a>

          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="/dashboard" className="hover:text-white transition">
              Dashboard
            </a>
            <a href="/companies" className="hover:text-white transition">
              Companies
            </a>
            <a href="/map" className="hover:text-white transition">
              Map
            </a>
            <a href="/events" className="text-white">
              Events
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.35em] text-zinc-600">
            Historical Intelligence
          </div>

          <h1 className="mt-3 text-5xl font-bold tracking-tight text-white">
            Labor Market Timeline
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-zinc-400">
            Detected changes, job signals, company activity, and emerging market events.
          </p>
        </div>

        <LaborEventFeed limit={25} />
      </main>
    </div>
  );
}
