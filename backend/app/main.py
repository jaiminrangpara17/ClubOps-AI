import logging
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.routers.ai import router as ai_router
from app.routers.analytics import router as analytics_router
from app.routers.attendance import router as attendance_router
from app.routers.auth import router as auth_router
from app.routers.clubs import router as clubs_router
from app.routers.events import router as events_router
from app.routers.members import router as members_router
from app.routers.users import router as users_router

load_dotenv()

# ---------------------------------------------------------------------------
# Structured logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","message":"%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("clubops")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ClubOps AI API",
    description="Backend API for ClubOps AI",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Security-headers + request-logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_and_logging(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"

    # Structured access log
    logger.info(
        "%s %s %s %sms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Health / readiness
# ---------------------------------------------------------------------------
@app.get("/health", tags=["ops"])
def health():
    return {
        "status": "ok",
        "service": "ClubOps AI API",
    }


@app.get("/health/ready", tags=["ops"])
def readiness():
    """
    Kubernetes-style readiness probe.
    Attempts a lightweight DB ping so the load balancer knows whether
    the service can handle real traffic.
    """
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:  # noqa: BLE001
        logger.error("Readiness DB check failed: %s", exc)
        db_status = "unavailable"

    ready = db_status == "ok"
    return Response(
        content=__import__("json").dumps(
            {
                "status": "ready" if ready else "not_ready",
                "checks": {"database": db_status},
            }
        ),
        status_code=200 if ready else 503,
        media_type="application/json",
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(clubs_router)
app.include_router(members_router)
app.include_router(events_router)
app.include_router(attendance_router)
app.include_router(ai_router)
app.include_router(analytics_router)