"""
Run this to simulate drift: python ml/seed_predictions.py
It inserts 100 fraudulent predictions to push the fraud rate above the baseline.
"""
import os

import psycopg2

conn = psycopg2.connect(
    os.environ.get("DATABASE_URL", "")
    .replace("+asyncpg", "")
    .replace("postgresql+asyncpg", "postgresql")
)
cur = conn.cursor()

# Get active model version id
cur.execute("SELECT id FROM model_versions WHERE is_active = true LIMIT 1")
model_version_id = cur.fetchone()[0]

# Insert 100 fraudulent predictions
for i in range(100):
    cur.execute(
        """
        INSERT INTO predictions
        (model_version_id, transaction_id, amount, merchant_category,
         time_of_day, location_mismatch, transaction_velocity,
         account_age_days, prediction, confidence, is_fraud, raw_features)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            model_version_id,
            f"SEED-FRAUD-{i:03d}",
            round(500 + i * 10, 2),
            7,
            3,
            True,
            8,
            15,
            "fraud",
            0.92,
            True,
            '{"seeded": true}',
        ),
    )

conn.commit()
cur.close()
conn.close()
print("Inserted 100 fraudulent predictions to simulate drift")
