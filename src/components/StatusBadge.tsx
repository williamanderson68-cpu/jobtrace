type StatusBadgeProps = {
  status?: string | null;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || "active").toLowerCase();

  const label = normalized === "active" ? "Active" : normalized === "removed" ? "Removed" : "Unknown";

  const className =
    normalized === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : normalized === "removed"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-400";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      Status: {label}
    </span>
  );
}
