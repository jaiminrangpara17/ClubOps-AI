from fastapi import FastAPI

from app.routers.clubs import router as clubs_router
from app.routers.members import router as members_router
from app.routers.events import router as events_router
from app.routers.attendance import router as attendance_router

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
app.include_router(members_router)
app.include_router(events_router)
app.include_router(attendance_router)