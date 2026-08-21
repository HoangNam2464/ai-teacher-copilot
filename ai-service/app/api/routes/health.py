"""
Health check endpoint for the AI Service.
Used by Docker health checks and Spring Boot to verify connectivity.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Returns service health status.
    Checks database connectivity.
    """
    db_status = "unknown"
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "ai-service",
        "version": "0.1.0",
        "database": db_status,
    }
