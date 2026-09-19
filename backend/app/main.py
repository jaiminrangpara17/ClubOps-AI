from fastapi import FastAPI

app = FastAPI(
    title="ClubOps AI API",
    description="Backend API for ClubOps AI",
    version="0.1.0"
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ClubOps AI API"
    }