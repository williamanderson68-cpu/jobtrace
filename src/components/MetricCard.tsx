type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5 backdrop-blur transition-colors hover:border-zinc-700">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">
        {value}
      </div>
      {helper ? (
        <div className="mt-2 text-sm text-zinc-500">
          {helper}
        </div>
      ) : null}
    </div>
  );
}
