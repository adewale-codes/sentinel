from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    transaction_id: Optional[str] = None
    amount: float = Field(gt=0, description="Transaction amount in GBP")
    time_of_day: int = Field(ge=0, le=23, description="Hour of day 0-23")
    merchant_category: int = Field(ge=0, le=9, description="Merchant category code 0-9")
    location_mismatch: bool = Field(description="Whether location differs from usual")
    transaction_velocity: int = Field(ge=0, description="Number of transactions in last hour")
    account_age_days: int = Field(ge=1, description="Account age in days")


class PredictionResponse(BaseModel):
    prediction_id: UUID
    transaction_id: Optional[str]
    is_fraud: bool
    confidence: float
    model_version: str
    predicted_at: datetime


class ModelVersionResponse(BaseModel):
    id: UUID
    version: str
    algorithm: str
    trained_at: datetime
    training_samples: Optional[int]
    metrics: Optional[dict]
    is_active: bool
    notes: Optional[str]
