import type {
  DriftAlert,
  ModelVersion,
  MonitoringRun,
  MonitoringStats,
  PredictionResponse,
  TransactionInput,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

export const api = {
  predict: (data: TransactionInput): Promise<PredictionResponse> =>
    fetch(`${BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    }).then((r) => r.json()),

  predictions: {
    history: (params?: { is_fraud?: boolean }): Promise<PredictionResponse[]> =>
      fetch(
        `${BASE}/api/predict/history${
          params?.is_fraud !== undefined ? `?is_fraud=${params.is_fraud}` : ""
        }`,
        { cache: "no-store" }
      ).then((r) => r.json()),
  },

  models: {
    list: (): Promise<ModelVersion[]> =>
      fetch(`${BASE}/api/models`, { cache: "no-store" }).then((r) => r.json()),
    activate: (version: string): Promise<ModelVersion> =>
      fetch(`${BASE}/api/models/${version}/activate`, {
        method: "POST",
        cache: "no-store",
      }).then((r) => r.json()),
  },

  monitoring: {
    run: (): Promise<Record<string, unknown>> =>
      fetch(`${BASE}/api/monitoring/run`, {
        method: "POST",
        cache: "no-store",
      }).then((r) => r.json()),
    runs: (): Promise<MonitoringRun[]> =>
      fetch(`${BASE}/api/monitoring/runs`, { cache: "no-store" }).then((r) => r.json()),
    alerts: (status?: string): Promise<DriftAlert[]> =>
      fetch(`${BASE}/api/monitoring/alerts${status ? `?status=${status}` : ""}`, {
        cache: "no-store",
      }).then((r) => r.json()),
    stats: (): Promise<MonitoringStats> =>
      fetch(`${BASE}/api/monitoring/stats`, { cache: "no-store" }).then((r) => r.json()),
    resolveAlert: (alertId: string): Promise<DriftAlert> =>
      fetch(`${BASE}/api/monitoring/alerts/${alertId}/resolve`, {
        method: "POST",
        cache: "no-store",
      }).then((r) => r.json()),
  },
};
