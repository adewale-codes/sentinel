"""Train the fraud detection model on synthetic data and register it in the database.

Run standalone from inside the backend container:
    python ml/train.py
"""
import json
import os

import numpy as np
import pandas as pd
import psycopg2
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
import joblib

np.random.seed(42)
n_samples = 10000

# Generate features
amount = np.random.exponential(scale=200, size=n_samples)
time_of_day = np.random.randint(0, 24, size=n_samples)
merchant_category = np.random.randint(0, 10, size=n_samples)
location_mismatch = np.random.binomial(1, 0.15, size=n_samples)
transaction_velocity = np.random.poisson(3, size=n_samples)
account_age_days = np.random.randint(1, 3650, size=n_samples)

# Generate labels with realistic fraud patterns
fraud_probability = (
    0.02
    + 0.15 * location_mismatch
    + 0.08 * (amount > 500).astype(int)
    + 0.05 * (time_of_day < 6).astype(int)
    + 0.04 * (transaction_velocity > 5).astype(int)
    + 0.06 * (account_age_days < 30).astype(int)
)
fraud_probability = np.clip(fraud_probability, 0, 1)
is_fraud = np.random.binomial(1, fraud_probability)

features = [
    "amount",
    "time_of_day",
    "merchant_category",
    "location_mismatch",
    "transaction_velocity",
    "account_age_days",
]

X = pd.DataFrame(
    {
        "amount": amount,
        "time_of_day": time_of_day,
        "merchant_category": merchant_category,
        "location_mismatch": location_mismatch,
        "transaction_velocity": transaction_velocity,
        "account_age_days": account_age_days,
    }
)
y = is_fraud

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    class_weight="balanced",
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

metrics = {
    "accuracy": round(accuracy_score(y_test, y_pred), 4),
    "precision": round(precision_score(y_test, y_pred), 4),
    "recall": round(recall_score(y_test, y_pred), 4),
    "f1_score": round(f1_score(y_test, y_pred), 4),
    "roc_auc": round(roc_auc_score(y_test, y_prob), 4),
    "training_samples": len(X_train),
    "test_samples": len(X_test),
    "fraud_rate": round(y.mean(), 4),
}

os.makedirs("ml/models", exist_ok=True)
model_path = "ml/models/v1.0.0.pkl"
joblib.dump(model, model_path)

conn = psycopg2.connect(
    os.environ.get("DATABASE_URL", "")
    .replace("+asyncpg", "")
    .replace("postgresql+asyncpg", "postgresql")
)
cur = conn.cursor()

cur.execute(
    """
    INSERT INTO model_versions
    (version, algorithm, training_samples, features, metrics, is_active, model_path, notes)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (version) DO UPDATE SET
        metrics = EXCLUDED.metrics,
        is_active = EXCLUDED.is_active,
        model_path = EXCLUDED.model_path
    """,
    (
        "v1.0.0",
        "RandomForestClassifier",
        int(len(X_train)),
        json.dumps(features),
        json.dumps(metrics),
        True,
        model_path,
        "Initial model trained on synthetic transaction data",
    ),
)
conn.commit()
cur.close()
conn.close()
print(f"Model v1.0.0 trained and registered. Metrics: {metrics}")
