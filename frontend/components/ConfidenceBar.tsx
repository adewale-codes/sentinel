export default function ConfidenceBar({ value, isFraud }: { value: number; isFraud: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={`h-full rounded-full ${isFraud ? "bg-fraud" : "bg-safe"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-muted">{pct}%</span>
    </div>
  );
}
