from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.prediction import PredictionResponse, TransactionInput
from services.model_loader import ModelLoader

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(transaction: TransactionInput, db: AsyncSession = Depends(get_db)):
    if not ModelLoader.is_loaded():
        raise HTTPException(status_code=503, detail="No model loaded, predictions are unavailable")

    features = {
        "amount": transaction.amount,
        "time_of_day": transaction.time_of_day,
        "merchant_category": transaction.merchant_category,
        "location_mismatch": int(transaction.location_mismatch),
        "transaction_velocity": transaction.transaction_velocity,
        "account_age_days": transaction.account_age_days,
    }

    is_fraud, confidence = ModelLoader.predict(features)
    version = ModelLoader.get_version()

    model_version_row = await db.execute(
        text("SELECT id FROM model_versions WHERE version = :version"),
        {"version": version},
    )
    model_version_id = model_version_row.scalar_one_or_none()

    result = await db.execute(
        text(
            """
            INSERT INTO predictions
            (model_version_id, transaction_id, amount, merchant_category, time_of_day,
             location_mismatch, transaction_velocity, account_age_days, prediction,
             confidence, is_fraud, raw_features)
            VALUES
            (:model_version_id, :transaction_id, :amount, :merchant_category, :time_of_day,
             :location_mismatch, :transaction_velocity, :account_age_days, :prediction,
             :confidence, :is_fraud, :raw_features)
            RETURNING id, transaction_id, is_fraud, confidence, predicted_at
            """
        ),
        {
            "model_version_id": model_version_id,
            "transaction_id": transaction.transaction_id,
            "amount": transaction.amount,
            "merchant_category": str(transaction.merchant_category),
            "time_of_day": transaction.time_of_day,
            "location_mismatch": transaction.location_mismatch,
            "transaction_velocity": transaction.transaction_velocity,
            "account_age_days": transaction.account_age_days,
            "prediction": "fraud" if is_fraud else "legitimate",
            "confidence": confidence,
            "is_fraud": is_fraud,
            "raw_features": None,
        },
    )
    row = result.fetchone()
    await db.commit()

    return PredictionResponse(
        prediction_id=row.id,
        transaction_id=row.transaction_id,
        is_fraud=row.is_fraud,
        confidence=float(row.confidence),
        model_version=version,
        predicted_at=row.predicted_at,
    )


@router.get("/predict/history", response_model=list[PredictionResponse])
async def prediction_history(
    is_fraud: Optional[bool] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = """
        SELECT p.id, p.transaction_id, p.is_fraud, p.confidence, p.predicted_at,
               mv.version AS model_version
        FROM predictions p
        LEFT JOIN model_versions mv ON mv.id = p.model_version_id
    """
    params = {}
    if is_fraud is not None:
        query += " WHERE p.is_fraud = :is_fraud"
        params["is_fraud"] = is_fraud
    query += " ORDER BY p.predicted_at DESC LIMIT 100"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return [
        PredictionResponse(
            prediction_id=row.id,
            transaction_id=row.transaction_id,
            is_fraud=row.is_fraud,
            confidence=float(row.confidence) if row.confidence is not None else 0.0,
            model_version=row.model_version or "unknown",
            predicted_at=row.predicted_at,
        )
        for row in rows
    ]
