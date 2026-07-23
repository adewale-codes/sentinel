import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from database import AsyncSessionLocal
from routers import models, predictions
from services.model_loader import ModelLoader


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text(
                "SELECT version, model_path FROM model_versions "
                "WHERE is_active = true ORDER BY trained_at DESC LIMIT 1"
            )
        )
        row = result.fetchone()
        if row and os.path.exists(row.model_path):
            ModelLoader.load(row.model_path, row.version)
        else:
            print("No active model found, predictions will be unavailable until a model is trained")
    yield


app = FastAPI(title="Sentinel API", lifespan=lifespan)

app.include_router(predictions.router, prefix="/api")
app.include_router(models.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentinel-api"}
