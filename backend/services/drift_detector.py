import logging
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

DRIFT_THRESHOLD = 0.10  # Alert if fraud rate deviates by more than 10 percentage points
WINDOW_SIZE = 500  # Number of recent predictions to analyse
MIN_PREDICTIONS = 50  # Minimum predictions needed before drift detection runs


async def get_baseline_fraud_rate(db: AsyncSession) -> float | None:
    """Get the fraud rate from the active model's training metrics."""
    result = await db.execute(
        text(
            """
            SELECT metrics->>'fraud_rate' as fraud_rate
            FROM model_versions
            WHERE is_active = true
            ORDER BY trained_at DESC
            LIMIT 1
            """
        )
    )
    row = result.fetchone()
    if row and row.fraud_rate:
        return float(row.fraud_rate)
    return None


async def get_current_fraud_rate(db: AsyncSession, window_size: int = WINDOW_SIZE) -> tuple[float, int]:
    """Get the fraud rate from the most recent predictions."""
    result = await db.execute(
        text(
            """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_fraud = true THEN 1 ELSE 0 END) as fraud_count
            FROM (
                SELECT is_fraud
                FROM predictions
                ORDER BY predicted_at DESC
                LIMIT :window_size
            ) recent
            """
        ),
        {"window_size": window_size},
    )
    row = result.fetchone()
    if not row or row.total == 0:
        return 0.0, 0
    return float(row.fraud_count) / float(row.total), int(row.total)


async def run_drift_detection(db: AsyncSession) -> dict:
    """Run drift detection and log results."""
    started_at = datetime.now(timezone.utc)

    result = await db.execute(
        text(
            """
            INSERT INTO monitoring_runs (started_at, status)
            VALUES (:started_at, 'running')
            RETURNING id
            """
        ),
        {"started_at": started_at},
    )
    run_id = result.fetchone().id
    await db.commit()

    try:
        baseline_fraud_rate = await get_baseline_fraud_rate(db)
        if baseline_fraud_rate is None:
            await db.execute(
                text(
                    """
                    UPDATE monitoring_runs
                    SET status = 'failed', completed_at = :now,
                        error_message = 'No active model found'
                    WHERE id = :run_id
                    """
                ),
                {"now": datetime.now(timezone.utc), "run_id": run_id},
            )
            await db.commit()
            return {"status": "failed", "error": "No active model found"}

        current_fraud_rate, predictions_analysed = await get_current_fraud_rate(db)

        if predictions_analysed < MIN_PREDICTIONS:
            await db.execute(
                text(
                    """
                    UPDATE monitoring_runs
                    SET status = 'completed', completed_at = :now,
                        predictions_analysed = :count,
                        drift_detected = false,
                        error_message = 'Insufficient predictions for drift detection'
                    WHERE id = :run_id
                    """
                ),
                {
                    "now": datetime.now(timezone.utc),
                    "run_id": run_id,
                    "count": predictions_analysed,
                },
            )
            await db.commit()
            return {
                "status": "completed",
                "drift_detected": False,
                "reason": f"Only {predictions_analysed} predictions, need at least {MIN_PREDICTIONS}",
            }

        drift_score = abs(current_fraud_rate - baseline_fraud_rate)
        drift_detected = drift_score > DRIFT_THRESHOLD

        model_result = await db.execute(
            text("SELECT id FROM model_versions WHERE is_active = true LIMIT 1")
        )
        model_row = model_result.fetchone()
        model_version_id = model_row.id if model_row else None

        if drift_detected and model_version_id:
            await db.execute(
                text(
                    """
                    INSERT INTO drift_alerts
                    (model_version_id, drift_score, baseline_fraud_rate,
                     current_fraud_rate, window_size, status)
                    VALUES (:model_id, :drift_score, :baseline, :current, :window, 'active')
                    """
                ),
                {
                    "model_id": model_version_id,
                    "drift_score": drift_score,
                    "baseline": baseline_fraud_rate,
                    "current": current_fraud_rate,
                    "window": predictions_analysed,
                },
            )

        await db.execute(
            text(
                """
                UPDATE monitoring_runs
                SET status = 'completed', completed_at = :now,
                    predictions_analysed = :count,
                    drift_detected = :drift,
                    drift_score = :score
                WHERE id = :run_id
                """
            ),
            {
                "now": datetime.now(timezone.utc),
                "run_id": run_id,
                "count": predictions_analysed,
                "drift": drift_detected,
                "score": drift_score,
            },
        )
        await db.commit()

        return {
            "status": "completed",
            "run_id": str(run_id),
            "predictions_analysed": predictions_analysed,
            "baseline_fraud_rate": baseline_fraud_rate,
            "current_fraud_rate": current_fraud_rate,
            "drift_score": drift_score,
            "drift_detected": drift_detected,
            "threshold": DRIFT_THRESHOLD,
        }

    except Exception as e:
        logger.error(f"Drift detection failed: {e}")
        await db.execute(
            text(
                """
                UPDATE monitoring_runs
                SET status = 'failed', completed_at = :now, error_message = :error
                WHERE id = :run_id
                """
            ),
            {"now": datetime.now(timezone.utc), "run_id": run_id, "error": str(e)},
        )
        await db.commit()
        raise
