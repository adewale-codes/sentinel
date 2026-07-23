import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.prediction import ModelVersionResponse
from services.model_loader import ModelLoader

router = APIRouter()


@router.get("/models", response_model=list[ModelVersionResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            SELECT id, version, algorithm, trained_at, training_samples,
                   metrics, is_active, notes
            FROM model_versions
            ORDER BY trained_at DESC
            """
        )
    )
    rows = result.fetchall()
    return [ModelVersionResponse(**row._mapping) for row in rows]


@router.post("/models/{version}/activate", response_model=ModelVersionResponse)
async def activate_model(version: str, db: AsyncSession = Depends(get_db)):
    target = await db.execute(
        text("SELECT id, model_path FROM model_versions WHERE version = :version"),
        {"version": version},
    )
    target_row = target.fetchone()
    if target_row is None:
        raise HTTPException(status_code=404, detail=f"Model version {version} not found")

    if not os.path.exists(target_row.model_path):
        raise HTTPException(
            status_code=400,
            detail=f"Model file not found at {target_row.model_path}",
        )

    await db.execute(text("UPDATE model_versions SET is_active = false"))
    await db.execute(
        text("UPDATE model_versions SET is_active = true WHERE version = :version"),
        {"version": version},
    )
    await db.commit()

    ModelLoader.load(target_row.model_path, version)

    result = await db.execute(
        text(
            """
            SELECT id, version, algorithm, trained_at, training_samples,
                   metrics, is_active, notes
            FROM model_versions
            WHERE version = :version
            """
        ),
        {"version": version},
    )
    row = result.fetchone()
    return ModelVersionResponse(**row._mapping)
