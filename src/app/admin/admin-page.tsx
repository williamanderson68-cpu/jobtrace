
export default function AdminPage() {
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
      </main>
    </div>
  )
}
