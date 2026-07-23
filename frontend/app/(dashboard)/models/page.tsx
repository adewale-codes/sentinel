"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ModelVersion } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/Skeleton";
import MetricValue from "@/components/MetricValue";
import { formatDateTime } from "@/lib/format";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelVersion[] | null>(null);
  const [error, setError] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const load = () => {
    api.models
      .list()
      .then(setModels)
      .catch(() => setError(true));
  };

  useEffect(load, []);

  const activate = async (version: string) => {
    setActivating(version);
    setConfirmation(null);
    try {
      await api.models.activate(version);
      setConfirmation(`Model ${version} is now active.`);
      load();
    } catch {
      setError(true);
    } finally {
      setActivating(null);
    }
  };

  const loading = !models && !error;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Model versions</h1>

      {error && (
        <div className="rounded-lg border border-fraud/30 bg-fraud/10 px-5 py-4 text-sm text-fraud">
          Could not load model versions. Check that the backend is running.
        </div>
      )}

      {confirmation && (
        <div className="rounded-lg border border-safe/30 bg-safe/10 px-5 py-4 text-sm text-safe">
          {confirmation}
        </div>
      )}

      {!error && (
        <div className="overflow-x-auto rounded-lg border border-border bg-bg-surface">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Algorithm</th>
                <th className="px-4 py-3 font-medium">Trained at</th>
                <th className="px-4 py-3 font-medium">Training samples</th>
                <th className="px-4 py-3 font-medium">Accuracy</th>
                <th className="px-4 py-3 font-medium">Precision</th>
                <th className="px-4 py-3 font-medium">Recall</th>
                <th className="px-4 py-3 font-medium">F1</th>
                <th className="px-4 py-3 font-medium">ROC AUC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={11} />)
              ) : models && models.length > 0 ? (
                models.map((model) => (
                  <tr
                    key={model.id}
                    className={`border-b border-border last:border-0 ${
                      model.is_active ? "border-l-2 border-l-accent bg-accent/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{model.version}</td>
                    <td className="px-4 py-3 text-text-muted">{model.algorithm}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDateTime(model.trained_at)}</td>
                    <td className="px-4 py-3 text-text-muted">{model.training_samples ?? "-"}</td>
                    <td className="px-4 py-3">
                      <MetricValue value={model.metrics?.accuracy} />
                    </td>
                    <td className="px-4 py-3">
                      <MetricValue value={model.metrics?.precision} />
                    </td>
                    <td className="px-4 py-3">
                      <MetricValue value={model.metrics?.recall} />
                    </td>
                    <td className="px-4 py-3">
                      <MetricValue value={model.metrics?.f1_score} />
                    </td>
                    <td className="px-4 py-3">
                      <MetricValue value={model.metrics?.roc_auc} />
                    </td>
                    <td className="px-4 py-3">
                      {model.is_active ? (
                        <span className="inline-flex items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-cyan-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!model.is_active && (
                        <button
                          onClick={() => activate(model.version)}
                          disabled={activating === model.version}
                          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:border-border-hover disabled:opacity-60"
                        >
                          {activating === model.version ? "Activating..." : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11}>
                    <EmptyState title="No models registered" description="Run the training script to register a model." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
