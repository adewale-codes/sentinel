type Tone = "fraud" | "safe" | "warning" | "accent" | "neutral";

const toneClasses: Record<Tone, string> = {
  fraud: "bg-fraud/10 text-fraud border-fraud/30",
  safe: "bg-safe/10 text-safe border-safe/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  accent: "bg-accent/10 text-accent border-accent/30",
  neutral: "bg-text-subtle/10 text-text-muted border-border",
};

export default function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function predictionTone(isFraud: boolean): Tone {
  return isFraud ? "fraud" : "safe";
}

export function runStatusTone(status: string): Tone {
  if (status === "completed") return "safe";
  if (status === "failed") return "fraud";
  if (status === "running") return "warning";
  return "neutral";
}

export function alertStatusTone(status: string): Tone {
  if (status === "active") return "fraud";
  if (status === "resolved") return "safe";
  return "neutral";
}
