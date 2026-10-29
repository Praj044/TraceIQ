from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.api.projects import router as projects_router
from app.api.openapi import router as openapi_router
from app.api.test_cases import router as test_cases_router
from app.api.test_runs import router as test_runs_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router


app = FastAPI(
    title=settings.app_name,
    description="AI-powered API testing and regression intelligence",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(projects_router)
app.include_router(openapi_router)
app.include_router(test_cases_router)
app.include_router(test_runs_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "message": "Welcome to TraceIQ",
    }


@app.get("/api/v1/health")
def health():
    return {"status": "healthy"}


@app.get("/api/v1/health/db")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected",
    }
