from fastapi import FastAPI

from app.routers.clubs import router as clubs_router


app = FastAPI(
    title="ClubOps AI API",
    description="Backend API for ClubOps AI",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ClubOps AI API",
    }


app.include_router(clubs_router)