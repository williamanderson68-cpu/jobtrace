import Link from "next/link";

type JobTraceHeaderProps = {
  showAdminLink?: boolean;
};

export default function JobTraceHeader({ showAdminLink = false }: JobTraceHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-4 w-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30" />
            <div className="absolute left-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <div>
            <div className="text-xl font-semibold tracking-tight text-white">
              JobTrace
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Labor Market Intelligence
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <Link href="/" className="transition hover:text-white">
            Search
          </Link>
          {showAdminLink ? (
            <Link href="/admin" className="transition hover:text-white">
              Admin
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
