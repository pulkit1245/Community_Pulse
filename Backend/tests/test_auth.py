"""
Auth integration tests — require a live Postgres DB.
Run: pytest tests/test_auth.py -v
"""
import pytest


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Login with non-existent phone should return 401."""
    resp = await client.post("/api/v1/auth/login", json={
        "phone": "+000000000",
        "password": "wrong"
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client):
    """Accessing /needs without a token should return 403."""
    resp = await client.get("/api/v1/needs")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token(client):
    """Accessing /needs with a garbage token should return 401."""
    resp = await client.get("/api/v1/needs", headers={"Authorization": "Bearer notavalidtoken"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_health_check_public(client):
    """Health endpoint must be publicly accessible."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
