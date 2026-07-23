"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type { DriftAlert, MonitoringStats, PredictionResponse } from "@/lib/types";
import StatCard from "@/components/StatCard";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Badge, { alertStatusTone } from "@/components/Badge";
import { formatDateTime, formatPct } from "@/lib/format";

const REFRESH_MS = 30_000;
const TOOLTIP_STYLE = { background: "#0d1117", border: "1px solid #21262d", color: "#e6edf3" };

const CONFIDENCE_BUCKETS = [
  { label: "0-0.5", min: 0, max: 0.5 },
  { label: "0.5-0.6", min: 0.5, max: 0.6 },
  { label: "0.6-0.7", min: 0.6, max: 0.7 },
  { label: "0.7-0.8", min: 0.7, max: 0.8 },
  { label: "0.8-0.9", min: 0.8, max: 0.9 },
  { label: "0.9-1.0", min: 0.9, max: 1.01 },
];

export default function OverviewPage() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [predictions, setPredictions] = useState<PredictionResponse[] | null>(null);
  const [alerts, setAlerts] = useState<DriftAlert[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      Promise.all([api.monitoring.stats(), api.predictions.history(), api.monitoring.alerts()])
        .then(([s, p, a]) => {
          if (cancelled) return;
          setStats(s);
          setPredictions(p);
          setAlerts(a);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const loading = !stats || !predictions || !alerts;

  const fraudCount = predictions?.filter((p) => p.is_fraud).length ?? 0;
  const legitCount = predictions ? predictions.length - fraudCount : 0;
  const pieData = [
    { name: "Fraud", value: fraudCount },
    { name: "Legitimate", value: legitCount },
  ];

  const barData = CONFIDENCE_BUCKETS.map((bucket) => ({
    range: bucket.label,
    count:
      predictions?.filter((p) => p.confidence >= bucket.min && p.confidence < bucket.max).length ?? 0,
  }));

  const currentPct = stats ? stats.current_fraud_rate * 100 : 0;
  const baselinePct = stats?.baseline_fraud_rate != null ? stats.baseline_fraud_rate * 100 : null;
  const diverging = baselinePct != null && currentPct > baselinePct;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-fraud/30 bg-fraud/10 px-5 py-4 text-sm text-fraud">
          Could not reach the monitoring API. Check that the backend is running.
        </div>
      )}

      {stats && (
        <div
          className={`rounded-lg border px-5 py-4 text-sm font-medium ${
            stats.active_alerts > 0
              ? "border-fraud/40 bg-fraud/10 text-fraud"
              : "border-safe/40 bg-safe/10 text-safe"
          }`}
        >
          {stats.active_alerts > 0
            ? `DRIFT DETECTED - ${stats.active_alerts} active alert(s). Current fraud rate ${formatPct(
                stats.current_fraud_rate
              )} vs baseline ${formatPct(stats.baseline_fraud_rate)}`
            : "System healthy - No drift detected"}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !error ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard label="Total predictions" value={stats.total_predictions} />
            <StatCard
              label="Fraud rate vs baseline"
              value={formatPct(stats.current_fraud_rate)}
              valueClassName={diverging ? "text-fraud" : "text-safe"}
              sub={`Baseline ${formatPct(stats.baseline_fraud_rate)}`}
            />
            <StatCard
              label="Active alerts"
              value={stats.active_alerts}
              valueClassName={stats.active_alerts > 0 ? "text-fraud" : "text-safe"}
            />
            <StatCard
              label="Model version"
              value={stats.model_version || "none"}
              sub={stats.last_monitoring_run ? `Last check ${formatDateTime(stats.last_monitoring_run)}` : undefined}
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Fraud vs legitimate
          </h2>
          <div className="mt-4 h-64">
            {predictions && predictions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    <Cell fill="#f85149" />
                    <Cell fill="#3fb950" />
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ color: "#7d8590", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No predictions yet" description="Submit a transaction to see the split." />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Confidence distribution
          </h2>
          <div className="mt-4 h-64">
            {predictions && predictions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
                  <XAxis dataKey="range" stroke="#7d8590" fontSize={12} />
                  <YAxis stroke="#7d8590" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No predictions yet" description="Confidence scores will appear here." />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Recent alerts</h2>
          <Link href="/drift" className="text-sm text-accent no-underline">
            View all alerts &rarr;
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2 font-medium">Detected</th>
                <th className="px-4 py-2 font-medium">Drift score</th>
                <th className="px-4 py-2 font-medium">Baseline vs current</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !error ? (
                <>
                  <TableRowSkeleton cols={4} />
                  <TableRowSkeleton cols={4} />
                </>
              ) : alerts && alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <tr key={alert.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(alert.detected_at)}</td>
                    <td className="px-4 py-3 font-semibold text-fraud">{alert.drift_score.toFixed(4)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatPct(alert.baseline_fraud_rate)} &rarr; {formatPct(alert.current_fraud_rate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={alertStatusTone(alert.status)}>{alert.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title="No alerts" description="No drift has been detected yet." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
