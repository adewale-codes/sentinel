export default function StatCard({
  label,
  value,
  sub,
  valueClassName = "",
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-bg-surface p-5 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`mt-2 text-3xl font-semibold text-text-primary ${valueClassName}`}>{value}</div>
      {sub && <div className="mt-1 text-sm text-text-muted">{sub}</div>}
    </div>
  );
}
