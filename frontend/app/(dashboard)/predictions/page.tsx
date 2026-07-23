"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { PredictionResponse } from "@/lib/types";
import Badge, { predictionTone } from "@/components/Badge";
import ConfidenceBar from "@/components/ConfidenceBar";
import EmptyState from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/Skeleton";
import { formatDateTime, formatGbp } from "@/lib/format";

type Filter = "all" | "fraud" | "legit";
const PAGE_SIZE = 20;

export default function PredictionsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [predictions, setPredictions] = useState<PredictionResponse[] | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPredictions(null);
    setPage(1);
    const params = filter === "fraud" ? { is_fraud: true } : filter === "legit" ? { is_fraud: false } : undefined;
    api.predictions
      .history(params)
      .then(setPredictions)
      .catch(() => setError(true));
  }, [filter]);

  const totalPages = predictions ? Math.max(1, Math.ceil(predictions.length / PAGE_SIZE)) : 1;
  const pageItems = useMemo(() => {
    if (!predictions) return [];
    const start = (page - 1) * PAGE_SIZE;
    return predictions.slice(start, start + PAGE_SIZE);
  }, [predictions, page]);

  const loading = !predictions && !error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Predictions</h1>
        <div className="flex gap-2">
          {(["all", "fraud", "legit"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:border-border-hover"
              }`}
            >
              {f === "all" ? "All" : f === "fraud" ? "Fraud only" : "Legitimate only"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-fraud/30 bg-fraud/10 px-5 py-4 text-sm text-fraud">
          Could not load predictions. Check that the backend is running.
        </div>
      )}

      {!error && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-bg-surface md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Location mismatch</th>
                  <th className="px-4 py-3 font-medium">Velocity</th>
                  <th className="px-4 py-3 font-medium">Account age</th>
                  <th className="px-4 py-3 font-medium">Prediction</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={9} />)
                ) : pageItems.length > 0 ? (
                  pageItems.map((p) => (
                    <tr key={p.prediction_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-primary">{p.transaction_id || "-"}</td>
                      <td className="px-4 py-3 text-text-muted">{formatGbp(p.amount)}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {p.time_of_day != null ? `${p.time_of_day}:00` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {p.location_mismatch == null ? (
                          "-"
                        ) : p.location_mismatch ? (
                          <span className="text-warning">Yes</span>
                        ) : (
                          <span className="text-text-muted">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">{p.transaction_velocity ?? "-"}</td>
                      <td className="px-4 py-3 text-text-muted">{p.account_age_days ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={predictionTone(p.is_fraud)}>{p.is_fraud ? "Fraud" : "Legit"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar value={p.confidence} isFraud={p.is_fraud} />
                      </td>
                      <td className="px-4 py-3 text-text-muted">{formatDateTime(p.predicted_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState title="No predictions" description="No predictions match this filter yet." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border bg-bg-surface p-4">
                  <div className="h-4 w-1/2 rounded bg-bg-elevated" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-bg-elevated" />
                </div>
              ))
            ) : pageItems.length > 0 ? (
              pageItems.map((p) => (
                <div key={p.prediction_id} className="rounded-lg border border-border bg-bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">{p.transaction_id || "Unnamed"}</span>
                    <Badge tone={predictionTone(p.is_fraud)}>{p.is_fraud ? "Fraud" : "Legit"}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <ConfidenceBar value={p.confidence} isFraud={p.is_fraud} />
                    <span className="text-xs text-text-muted">{formatDateTime(p.predicted_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No predictions" description="No predictions match this filter yet." />
            )}
          </div>

          {predictions && predictions.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
