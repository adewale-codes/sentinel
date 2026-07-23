"use client";

import { useState } from "react";
import type { PredictionResponse, TransactionInput } from "@/lib/types";
import Toggle from "@/components/Toggle";
import { formatDateTime } from "@/lib/format";

const MERCHANT_CATEGORIES = [
  { value: 0, label: "0 - Grocery" },
  { value: 1, label: "1 - Electronics" },
  { value: 2, label: "2 - Restaurant" },
  { value: 3, label: "3 - Travel" },
  { value: 4, label: "4 - Fashion" },
  { value: 5, label: "5 - Home and Garden" },
  { value: 6, label: "6 - Entertainment" },
  { value: 7, label: "7 - Gambling" },
  { value: 8, label: "8 - Digital Services" },
  { value: 9, label: "9 - Other" },
];

const DEFAULT_FORM: TransactionInput = {
  transaction_id: "",
  amount: 100,
  time_of_day: 12,
  merchant_category: 0,
  location_mismatch: false,
  transaction_velocity: 1,
  account_age_days: 365,
};

const HIGH_RISK_EXAMPLE: TransactionInput = {
  transaction_id: "",
  amount: 850,
  time_of_day: 3,
  merchant_category: 7,
  location_mismatch: true,
  transaction_velocity: 8,
  account_age_days: 15,
};

export default function PredictPage() {
  const [form, setForm] = useState<TransactionInput>(DEFAULT_FORM);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const payload: TransactionInput = {
        ...form,
        transaction_id: form.transaction_id?.trim() ? form.transaction_id.trim() : undefined,
      };
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (response.status === 503) {
        setError("No model is currently loaded. Train and activate a model first.");
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.detail ? JSON.stringify(body.detail) : "Prediction failed.");
        return;
      }
      const data: PredictionResponse = await response.json();
      setResult(data);
    } catch {
      setError("Could not reach the prediction API.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadHighRisk = () => setForm(HIGH_RISK_EXAMPLE);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">New prediction</h1>
        <button
          type="button"
          onClick={loadHighRisk}
          className="rounded-md border border-warning/40 px-3 py-1.5 text-sm font-medium text-warning transition-colors hover:bg-warning/10"
        >
          Load high-risk example
        </button>
      </div>

      <form onSubmit={onSubmit} className="rounded-lg border border-border bg-bg-surface p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Transaction ID (optional)</span>
            <input
              type="text"
              value={form.transaction_id}
              onChange={(e) => update("transaction_id", e.target.value)}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
              placeholder="tx-001"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Amount (£)</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => update("amount", Number(e.target.value))}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Hour of day</span>
            <input
              type="number"
              min={0}
              max={23}
              required
              value={form.time_of_day}
              onChange={(e) => update("time_of_day", Number(e.target.value))}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Merchant category</span>
            <select
              value={form.merchant_category}
              onChange={(e) => update("merchant_category", Number(e.target.value))}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
            >
              {MERCHANT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Transactions in last hour</span>
            <input
              type="number"
              min={0}
              required
              value={form.transaction_velocity}
              onChange={(e) => update("transaction_velocity", Number(e.target.value))}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-muted">Account age in days</span>
            <input
              type="number"
              min={1}
              required
              value={form.account_age_days}
              onChange={(e) => update("account_age_days", Number(e.target.value))}
              className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>

          <div className="flex items-center justify-between rounded-md border border-border bg-bg-elevated px-3 py-2 sm:col-span-2">
            <span className="text-sm text-text-muted">Location differs from usual</span>
            <Toggle
              checked={form.location_mismatch}
              onChange={(v) => update("location_mismatch", v)}
              label="Location mismatch"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-bg-primary transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Analysing..." : "Analyse Transaction"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-fraud/30 bg-fraud/10 px-5 py-4 text-sm text-fraud">{error}</div>
      )}

      {result && (
        <div
          className={`rounded-lg border p-6 text-center ${
            result.is_fraud ? "border-fraud/40 bg-fraud/5" : "border-safe/40 bg-safe/5"
          }`}
        >
          <div className={`text-4xl font-bold ${result.is_fraud ? "text-fraud" : "text-safe"}`}>
            {result.is_fraud ? "FRAUD" : "LEGITIMATE"}
          </div>
          <div className="mt-3 text-3xl font-semibold text-text-primary">
            {(result.confidence * 100).toFixed(1)}%
          </div>
          <div className="mt-1 text-sm text-text-muted">confidence</div>
          <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-text-muted sm:grid-cols-3">
            <div>
              <span className="text-text-subtle">Model version</span>
              <div className="text-text-primary">{result.model_version}</div>
            </div>
            <div>
              <span className="text-text-subtle">Prediction ID</span>
              <div className="break-all text-text-primary">{result.prediction_id}</div>
            </div>
            <div>
              <span className="text-text-subtle">Timestamp</span>
              <div className="text-text-primary">{formatDateTime(result.predicted_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
