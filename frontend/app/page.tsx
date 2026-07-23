"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MonitoringStats } from "@/lib/types";
import Reveal from "@/components/Reveal";
import { StatCardSkeleton } from "@/components/Skeleton";

const TECH_STACK = [
  "Python",
  "scikit-learn",
  "FastAPI",
  "Next.js",
  "PostgreSQL",
  "APScheduler",
  "Docker",
  "GitHub Actions",
];

const STEPS = [
  {
    title: "Transaction scored",
    body: "A transaction is submitted to the API with its features. The active model returns a fraud prediction and confidence score in milliseconds.",
  },
  {
    title: "Prediction logged",
    body: "Every prediction is stored with its full feature set, confidence score, model version, and timestamp. Nothing is lost.",
  },
  {
    title: "Drift monitored",
    body: "An hourly job compares the recent prediction distribution against the model's baseline. If fraud rates diverge beyond the threshold, an alert is raised.",
  },
];

const DIAGRAM_BOX_WIDTH = 180;
const DIAGRAM_BOX_HEIGHT = 50;
const DIAGRAM_TOP_Y = 20;
const DIAGRAM_BOTTOM_Y = 210;

const TOP_BOXES = [
  { label: "Transaction Input", x: 36 },
  { label: "FastAPI", x: 252 },
  { label: "RandomForest Model", x: 468 },
  { label: "Prediction Logger", x: 684 },
];

const BOTTOM_BOXES = [
  { label: "Alert System", x: 36 },
  { label: "Drift Detector", x: 252 },
  { label: "APScheduler", x: 468 },
  { label: "PostgreSQL", x: 684 },
];

const FEATURES = [
  {
    title: "Versioned model serving",
    body: "Multiple model versions can be trained and registered. Switching the active model takes one API call.",
  },
  {
    title: "Full prediction audit trail",
    body: "Every prediction is logged with features, confidence, model version, and timestamp for complete auditability.",
  },
  {
    title: "Automated drift detection",
    body: "Statistical comparison of current vs baseline fraud rates runs hourly. Configurable threshold triggers alerts automatically.",
  },
  {
    title: "Live monitoring dashboard",
    body: "Real time view of system health, prediction volume, fraud rate trends, and alert history.",
  },
];

export default function Home() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.monitoring
      .stats()
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  const fraudRatePct = stats ? (stats.current_fraud_rate * 100).toFixed(1) : null;
  const baselinePct = stats?.baseline_fraud_rate != null ? stats.baseline_fraud_rate * 100 : null;
  const fraudDivergent = baselinePct != null && stats ? stats.current_fraud_rate * 100 > baselinePct : false;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <section className="animate-fade-up text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-text-primary md:text-6xl">
          Fraud prediction with model monitoring
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-text-muted md:text-lg">
          Sentinel serves a trained fraud detection model via API, logs every prediction, and monitors for
          data drift. When the real world diverges from what the model learned, you know immediately.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/overview"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-bg-primary no-underline transition-colors hover:brightness-110"
          >
            View Dashboard
          </Link>
          <a
            href="https://github.com/adewale-codes/sentinel"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-text-primary no-underline transition-colors hover:border-border-hover"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <Reveal className="mt-24">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-text-muted">
          Live from the system
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {!stats && !error && (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          )}
          {error && (
            <div className="col-span-2 rounded-lg border border-border bg-bg-surface p-5 text-sm text-text-muted md:col-span-4">
              Live stats are unavailable right now.
            </div>
          )}
          {stats && (
            <>
              <div className="rounded-lg border border-border bg-bg-surface p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Total predictions
                </div>
                <div className="mt-2 text-3xl font-semibold text-text-primary">
                  {stats.total_predictions}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-bg-surface p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Current fraud rate
                </div>
                <div
                  className={`mt-2 text-3xl font-semibold ${fraudDivergent ? "text-fraud" : "text-text-primary"}`}
                >
                  {fraudRatePct}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-bg-surface p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Active alerts
                </div>
                <div
                  className={`mt-2 text-3xl font-semibold ${
                    stats.active_alerts > 0 ? "text-fraud" : "text-safe"
                  }`}
                >
                  {stats.active_alerts}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-bg-surface p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Model version
                </div>
                <div className="mt-2 text-3xl font-semibold text-text-primary">
                  {stats.model_version || "none"}
                </div>
              </div>
            </>
          )}
        </div>
      </Reveal>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-semibold text-text-primary">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 100}>
              <div className="h-full rounded-lg border border-border bg-bg-surface p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 text-sm font-semibold text-accent">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="mt-24">
        <h2 className="text-center text-2xl font-semibold text-text-primary">How the system works</h2>
        <div className="mt-10 rounded-lg border border-border bg-bg-surface p-6">
          <div style={{ overflowX: "auto" }}>
            <svg
              viewBox="0 0 900 280"
              style={{ display: "block", margin: "0 auto", minWidth: "700px" }}
            >
              <defs>
                <marker
                  id="diagram-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#f85149" />
                </marker>
              </defs>

              {/* Top row arrows */}
              {TOP_BOXES.slice(0, -1).map((box, i) => (
                <line
                  key={`top-arrow-${box.label}`}
                  x1={box.x + DIAGRAM_BOX_WIDTH}
                  y1={DIAGRAM_TOP_Y + DIAGRAM_BOX_HEIGHT / 2}
                  x2={TOP_BOXES[i + 1].x}
                  y2={DIAGRAM_TOP_Y + DIAGRAM_BOX_HEIGHT / 2}
                  stroke="#f85149"
                  strokeWidth={2}
                  markerEnd="url(#diagram-arrow)"
                />
              ))}

              {/* Bottom row arrows, pointing right to left */}
              {BOTTOM_BOXES.slice(0, -1).map((box, i) => (
                <line
                  key={`bottom-arrow-${box.label}`}
                  x1={BOTTOM_BOXES[i + 1].x}
                  y1={DIAGRAM_BOTTOM_Y + DIAGRAM_BOX_HEIGHT / 2}
                  x2={box.x + DIAGRAM_BOX_WIDTH}
                  y2={DIAGRAM_BOTTOM_Y + DIAGRAM_BOX_HEIGHT / 2}
                  stroke="#f85149"
                  strokeWidth={2}
                  markerEnd="url(#diagram-arrow)"
                />
              ))}

              {/* Vertical arrow: Prediction Logger down to PostgreSQL */}
              <line
                x1={TOP_BOXES[3].x + DIAGRAM_BOX_WIDTH / 2}
                y1={DIAGRAM_TOP_Y + DIAGRAM_BOX_HEIGHT}
                x2={TOP_BOXES[3].x + DIAGRAM_BOX_WIDTH / 2}
                y2={DIAGRAM_BOTTOM_Y}
                stroke="#f85149"
                strokeWidth={2}
                markerEnd="url(#diagram-arrow)"
              />

              {/* Top row boxes */}
              {TOP_BOXES.map((box) => (
                <g key={box.label}>
                  <rect
                    x={box.x}
                    y={DIAGRAM_TOP_Y}
                    width={DIAGRAM_BOX_WIDTH}
                    height={DIAGRAM_BOX_HEIGHT}
                    rx={6}
                    fill="#0d1117"
                    stroke="#21262d"
                  />
                  <text
                    x={box.x + DIAGRAM_BOX_WIDTH / 2}
                    y={DIAGRAM_TOP_Y + DIAGRAM_BOX_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e6edf3"
                    fontSize={13}
                    fontWeight={500}
                  >
                    {box.label}
                  </text>
                </g>
              ))}

              {/* Bottom row boxes */}
              {BOTTOM_BOXES.map((box) => (
                <g key={box.label}>
                  <rect
                    x={box.x}
                    y={DIAGRAM_BOTTOM_Y}
                    width={DIAGRAM_BOX_WIDTH}
                    height={DIAGRAM_BOX_HEIGHT}
                    rx={6}
                    fill="#0d1117"
                    stroke="#21262d"
                  />
                  <text
                    x={box.x + DIAGRAM_BOX_WIDTH / 2}
                    y={DIAGRAM_BOTTOM_Y + DIAGRAM_BOX_HEIGHT / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e6edf3"
                    fontSize={13}
                    fontWeight={500}
                  >
                    {box.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </Reveal>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-semibold text-text-primary">Features</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayMs={i * 75}>
              <div className="group h-full rounded-lg border border-border bg-bg-surface p-6 transition-transform duration-200 hover:-translate-y-1 hover:border-border-hover">
                <h3 className="text-lg font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-24 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Built with</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-bg-surface px-4 py-1.5 text-sm text-text-muted"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
