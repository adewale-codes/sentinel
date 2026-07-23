from fastapi import FastAPI

app = FastAPI(title="sentinel-api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sentinel-api"}
