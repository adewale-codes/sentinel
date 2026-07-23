import logging
import os
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from sqlalchemy import text

from database import AsyncSessionLocal
from routers import models, monitoring, predictions
from services.drift_detector import run_drift_detection
from services.model_loader import ModelLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


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

    async def scheduled_drift_check():
        async with AsyncSessionLocal() as db:
            await run_drift_detection(db)

    scheduler.add_job(scheduled_drift_check, "interval", hours=1, id="drift_check")
    scheduler.start()
    logger.info("Drift detection scheduler started")

    yield

    scheduler.shutdown()


app = FastAPI(title="Sentinel API", lifespan=lifespan)

app.include_router(predictions.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentinel-api"}
