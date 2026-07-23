"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DriftAlert, MonitoringRun, MonitoringStats } from "@/lib/types";
import Badge, { alertStatusTone, runStatusTone } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/Skeleton";
import { durationSeconds, formatDateTime, formatPct } from "@/lib/format";

const REFRESH_MS = 60_000;
const DRIFT_THRESHOLD = 0.1;

export default function DriftPage() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [alerts, setAlerts] = useState<DriftAlert[] | null>(null);
  const [runs, setRuns] = useState<MonitoringRun[] | null>(null);
  const [error, setError] = useState(false);
  const [running, setRunning] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([api.monitoring.stats(), api.monitoring.alerts("active"), api.monitoring.runs()])
      .then(([s, a, r]) => {
        setStats(s);
        setAlerts(a);
        setRuns(r);
      })
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const runCheck = async () => {
    setRunning(true);
    try {
      await api.monitoring.run();
      load();
    } catch {
      setError(true);
    } finally {
      setRunning(false);
    }
  };

  const resolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.monitoring.resolveAlert(id);
      load();
    } finally {
      setResolvingId(null);
    }
  };

  const loading = !stats && !error;
  const driftDetected = stats?.drift_detected ?? false;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-fraud/30 bg-fraud/10 px-5 py-4 text-sm text-fraud">
          Could not reach the monitoring API. Check that the backend is running.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div
            className={`rounded-lg border bg-bg-surface p-5 ${
              driftDetected ? "border-fraud/50" : "border-border"
            }`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Drift status</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-text-muted">Current fraud rate</div>
                <div className="mt-1 text-2xl font-semibold text-text-primary">
                  {formatPct(stats?.current_fraud_rate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Baseline fraud rate</div>
                <div className="mt-1 text-2xl font-semibold text-text-primary">
                  {formatPct(stats?.baseline_fraud_rate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Drift score</div>
                <div className={`mt-1 text-2xl font-semibold ${driftDetected ? "text-fraud" : "text-safe"}`}>
                  {stats?.drift_score != null ? stats.drift_score.toFixed(4) : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Threshold</div>
                <div className="mt-1 text-2xl font-semibold text-text-primary">{DRIFT_THRESHOLD}</div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Actions</h2>
          <p className="mt-2 text-sm text-text-muted">
            Trigger an immediate comparison of the current prediction window against the model&apos;s
            baseline.
          </p>
          <button
            onClick={runCheck}
            disabled={running}
            className="mt-4 flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
            )}
            {running ? "Running..." : "Run drift check"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Active alerts</h2>
        <div className="mt-3 flex flex-col gap-3">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-fraud/30 bg-bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-xs text-text-muted">Drift score</div>
                      <div className="text-3xl font-bold text-fraud">{alert.drift_score.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Baseline vs current</div>
                      <div className="mt-1 text-sm text-text-primary">
                        {formatPct(alert.baseline_fraud_rate)} &rarr; {formatPct(alert.current_fraud_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Window size</div>
                      <div className="mt-1 text-sm text-text-primary">{alert.window_size}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Detected</div>
                      <div className="mt-1 text-sm text-text-primary">{formatDateTime(alert.detected_at)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => resolve(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:border-border-hover disabled:opacity-60"
                  >
                    {resolvingId === alert.id ? "Resolving..." : "Resolve"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No active alerts" description="No drift is currently detected." />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Monitoring run history
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Predictions analysed</th>
                <th className="px-4 py-2 font-medium">Drift detected</th>
                <th className="px-4 py-2 font-medium">Drift score</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : runs && runs.length > 0 ? (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(run.started_at)}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {durationSeconds(run.started_at, run.completed_at)}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{run.predictions_analysed}</td>
                    <td className="px-4 py-3">
                      <span className={run.drift_detected ? "text-fraud" : "text-safe"}>
                        {run.drift_detected ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {run.drift_score != null ? run.drift_score.toFixed(4) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={runStatusTone(run.status)}>{run.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No monitoring runs" description="Runs will appear after the first check." />
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
