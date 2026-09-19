"""API entrypoint tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "clubops-ai"}


def test_health_endpoint_works_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"