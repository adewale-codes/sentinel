export default function MetricValue({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-text-muted">-</span>;
  const color = value > 0.8 ? "text-safe" : value >= 0.6 ? "text-warning" : "text-fraud";
  return <span className={`font-medium ${color}`}>{value.toFixed(3)}</span>;
}
