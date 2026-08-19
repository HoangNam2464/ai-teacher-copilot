"""
Tests for the health check endpoint.
"""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.anyio
async def test_health_endpoint_returns_200():
    """Health endpoint should return 200 with service info."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ai-service"
    assert data["version"] == "0.1.0"
    assert "status" in data
