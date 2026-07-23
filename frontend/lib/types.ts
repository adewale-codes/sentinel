export interface TransactionInput {
  transaction_id?: string;
  amount: number;
  time_of_day: number;
  merchant_category: number;
  location_mismatch: boolean;
  transaction_velocity: number;
  account_age_days: number;
}

export interface PredictionResponse {
  prediction_id: string;
  transaction_id: string | null;
  amount: number | null;
  time_of_day: number | null;
  location_mismatch: boolean | null;
  transaction_velocity: number | null;
  account_age_days: number | null;
  is_fraud: boolean;
  confidence: number;
  model_version: string;
  predicted_at: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  training_samples: number;
  test_samples: number;
  fraud_rate: number;
}

export interface ModelVersion {
  id: string;
  version: string;
  algorithm: string;
  trained_at: string;
  training_samples: number | null;
  metrics: ModelMetrics | null;
  is_active: boolean;
  notes: string | null;
}

export interface MonitoringRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  predictions_analysed: number;
  drift_detected: boolean;
  drift_score: number | null;
  error_message: string | null;
}

export interface DriftAlert {
  id: string;
  detected_at: string;
  drift_score: number;
  baseline_fraud_rate: number;
  current_fraud_rate: number;
  window_size: number;
  status: string;
}

export interface MonitoringStats {
  model_version: string | null;
  total_predictions: number;
  baseline_fraud_rate: number | null;
  current_fraud_rate: number;
  drift_score: number | null;
  drift_detected: boolean;
  active_alerts: number;
  last_monitoring_run: string | null;
  last_run_status: string | null;
}
