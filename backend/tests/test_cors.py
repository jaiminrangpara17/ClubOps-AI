import pytest
from datetime import datetime, timezone


# ─── CORS Preflight & Header Tests ──────────────────────────────────────────


def test_cors_preflight_allowed_origin(client):
    """OPTIONS request from Vite dev server origin returns proper CORS headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_headers_on_actual_request(client):
    """GET request from Vite dev server origin includes Access-Control-Allow-Origin."""
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_disallowed_origin(client):
    """Requests from unauthorized origins do not receive CORS allow headers."""
    response = client.get(
        "/health",
        headers={"Origin": "http://unauthorized-domain.com"},
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") is None


# ─── Dual Login Format Tests (JSON & Form) ──────────────────────────────────


def test_login_with_json_username(client):
    """Frontend can login using a JSON body containing username and password."""
    # Register user first
    client.post(
        "/auth/register",
        json={
            "username": "jsonuser",
            "email": "jsonuser@example.com",
            "full_name": "JSON User",
            "password": "SecurePassword123!",
        },
    )

    # Login with JSON
    response = client.post(
        "/auth/login",
        json={
            "username": "jsonuser",
            "password": "SecurePassword123!",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["username"] == "jsonuser"


def test_login_with_json_email(client):
    """Frontend can login using a JSON body containing email and password."""
    client.post(
        "/auth/register",
        json={
            "username": "emailuser",
            "email": "emailuser@example.com",
            "full_name": "Email User",
            "password": "SecurePassword123!",
        },
    )

    # Login with email in JSON payload (as frontend authService.ts does)
    response = client.post(
        "/auth/login",
        json={
            "email": "emailuser@example.com",
            "password": "SecurePassword123!",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "emailuser@example.com"


def test_logout_endpoint(client):
    """POST /auth/logout returns 204 No Content for session teardown."""
    response = client.post("/auth/logout")
    assert response.status_code == 204


# ─── Trailing Slash Neutrality Tests ────────────────────────────────────────


def test_get_clubs_without_trailing_slash(client, manager_headers):
    """GET /clubs without trailing slash returns 200 directly (no 307 redirect)."""
    response = client.get("/clubs", headers=manager_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_post_events_without_trailing_slash(client, manager_headers):
    """POST /events without trailing slash returns 201 directly (no 307 redirect)."""
    # Create club first
    club_res = client.post(
        "/clubs",
        json={"name": "Slash Event Club", "description": "Test"},
        headers=manager_headers,
    )
    assert club_res.status_code == 201
    club_id = club_res.json()["id"]

    # Create event without trailing slash
    event_res = client.post(
        "/events",
        json={
            "title": "Slashless Event",
            "description": "Created without trailing slash",
            "starts_at": "2026-10-01T10:00:00Z",
            "club_id": club_id,
        },
        headers=manager_headers,
    )
    assert event_res.status_code == 201
    assert event_res.json()["title"] == "Slashless Event"


# ─── HTTP PATCH Method Parity Tests ──────────────────────────────────────────


def test_patch_event(client, manager_headers):
    """PATCH /events/{id} updates event fields (matching eventService.ts)."""
    club_res = client.post(
        "/clubs",
        json={"name": "Patch Club", "description": "Test"},
        headers=manager_headers,
    )
    club_id = club_res.json()["id"]

    event_res = client.post(
        "/events",
        json={
            "title": "Original Title",
            "description": "Original",
            "starts_at": "2026-11-01T10:00:00Z",
            "club_id": club_id,
        },
        headers=manager_headers,
    )
    event_id = event_res.json()["id"]

    # PATCH event
    patch_res = client.patch(
        f"/events/{event_id}",
        json={"title": "Patched Title"},
        headers=manager_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Patched Title"


def test_patch_club(client, manager_headers):
    """PATCH /clubs/{id} updates club."""
    club_res = client.post(
        "/clubs",
        json={"name": "Original Club", "description": "Original"},
        headers=manager_headers,
    )
    club_id = club_res.json()["id"]

    patch_res = client.patch(
        f"/clubs/{club_id}",
        json={"name": "Patched Club", "description": "Updated"},
        headers=manager_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Patched Club"


# ─── Query Parameter Filtering Tests ─────────────────────────────────────────


def test_filter_members_by_club(client, manager_headers):
    """GET /members?club_id={id} returns only members belonging to that club."""
    c1 = client.post("/clubs", json={"name": "Filter Club 1"}, headers=manager_headers).json()["id"]
    c2 = client.post("/clubs", json={"name": "Filter Club 2"}, headers=manager_headers).json()["id"]

    client.post(
        "/members",
        json={"name": "M1", "email": "m1@example.com", "club_id": c1},
        headers=manager_headers,
    )
    client.post(
        "/members",
        json={"name": "M2", "email": "m2@example.com", "club_id": c2},
        headers=manager_headers,
    )

    # Filter by c1
    res = client.get(f"/members?club_id={c1}", headers=manager_headers)
    assert res.status_code == 200
    members = res.json()
    assert len(members) == 1
    assert members[0]["email"] == "m1@example.com"
