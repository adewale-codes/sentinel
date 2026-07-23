from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.drift_detector import (
    DRIFT_THRESHOLD,
    get_baseline_fraud_rate,
    get_current_fraud_rate,
    run_drift_detection,
)

router = APIRouter(prefix="/monitoring")


@router.post("/run")
async def trigger_run(db: AsyncSession = Depends(get_db)):
    return await run_drift_detection(db)


@router.get("/runs")
async def list_runs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            SELECT id, started_at, completed_at, status, predictions_analysed,
                   drift_detected, drift_score, error_message
            FROM monitoring_runs
            ORDER BY started_at DESC
            LIMIT 20
            """
        )
    )
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]


@router.get("/alerts")
async def list_alerts(
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = """
        SELECT id, detected_at, drift_score, baseline_fraud_rate,
               current_fraud_rate, window_size, status
        FROM drift_alerts
    """
    params = {}
    if status is not None:
        query += " WHERE status = :status"
        params["status"] = status
    query += " ORDER BY detected_at DESC"

    result = await db.execute(text(query), params)
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    model_result = await db.execute(
        text(
            """
            SELECT version FROM model_versions
            WHERE is_active = true
            ORDER BY trained_at DESC LIMIT 1
            """
        )
    )
    model_row = model_result.fetchone()
    model_version = model_row.version if model_row else None

    baseline_fraud_rate = await get_baseline_fraud_rate(db)
    current_fraud_rate, total_predictions = await get_current_fraud_rate(db)

    drift_score = None
    drift_detected = False
    if baseline_fraud_rate is not None and total_predictions > 0:
        drift_score = abs(current_fraud_rate - baseline_fraud_rate)
        drift_detected = drift_score > DRIFT_THRESHOLD

    active_alerts_result = await db.execute(
        text("SELECT COUNT(*) as count FROM drift_alerts WHERE status = 'active'")
    )
    active_alerts = active_alerts_result.fetchone().count

    last_run_result = await db.execute(
        text(
            """
            SELECT started_at, status FROM monitoring_runs
            ORDER BY started_at DESC LIMIT 1
            """
        )
    )
    last_run_row = last_run_result.fetchone()

    return {
        "model_version": model_version,
        "total_predictions": total_predictions,
        "baseline_fraud_rate": baseline_fraud_rate,
        "current_fraud_rate": current_fraud_rate,
        "drift_score": drift_score,
        "drift_detected": drift_detected,
        "active_alerts": active_alerts,
        "last_monitoring_run": last_run_row.started_at if last_run_row else None,
        "last_run_status": last_run_row.status if last_run_row else None,
    }


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            UPDATE drift_alerts
            SET status = 'resolved', resolved_at = :now
            WHERE id = :alert_id
            RETURNING id, detected_at, drift_score, baseline_fraud_rate,
                      current_fraud_rate, window_size, status
            """
        ),
        {"now": datetime.now(timezone.utc), "alert_id": alert_id},
    )
    row = result.fetchone()
    if row is None:
        await db.rollback()
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    await db.commit()
    return dict(row._mapping)
