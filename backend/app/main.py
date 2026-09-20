import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.ai import router as ai_router
from app.routers.attendance import router as attendance_router
from app.routers.auth import router as auth_router
from app.routers.clubs import router as clubs_router
from app.routers.events import router as events_router
from app.routers.members import router as members_router
from app.routers.users import router as users_router

load_dotenv()

app = FastAPI(
    title="ClubOps AI API",
    description="Backend API for ClubOps AI",
    version="0.1.0",
)

cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ClubOps AI API",
    }


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(clubs_router)
app.include_router(members_router)
app.include_router(events_router)
app.include_router(attendance_router)
app.include_router(ai_router)