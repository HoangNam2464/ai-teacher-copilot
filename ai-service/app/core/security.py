"""
Security utilities for the AI Service.
Validates the internal API key used by Spring Boot to call FastAPI.
FastAPI is internal-only — not exposed to the internet.
"""

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(
    api_key: str = Security(api_key_header),
) -> str:
    """
    Verify the internal API key sent by Spring Boot.
    Returns the key if valid, raises 401 otherwise.
    """
    if not api_key or api_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return api_key
