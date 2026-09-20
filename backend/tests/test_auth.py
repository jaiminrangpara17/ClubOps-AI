from datetime import timedelta

from app.security import create_access_token


# ─── Registration Tests ─────────────────────────────────────────────────


def test_register_success(client):
    """Successful registration returns 201 and safe user response."""
    response = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 201

    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "member"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_register_no_hashed_password_in_response(client):
    """Response should never contain hashed_password."""
    response = client.post(
        "/auth/register",
        json={
            "username": "safeuser",
            "email": "safeuser@example.com",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 201
    assert "hashed_password" not in response.json()
    assert "password" not in response.json()


def test_register_duplicate_username(client):
    """Duplicate username returns 409."""
    payload = {
        "username": "dupuser",
        "email": "dup1@example.com",
        "password": "SecurePass123!",
    }
    client.post("/auth/register", json=payload)

    payload["email"] = "dup2@example.com"
    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409
    assert "username" in response.json()["detail"].lower()


def test_register_duplicate_email(client):
    """Duplicate email returns 409."""
    client.post(
        "/auth/register",
        json={
            "username": "emaildup1",
            "email": "same@example.com",
            "password": "SecurePass123!",
        },
    )

    response = client.post(
        "/auth/register",
        json={
            "username": "emaildup2",
            "email": "same@example.com",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 409
    assert "email" in response.json()["detail"].lower()


def test_register_invalid_email(client):
    """Invalid email format returns 422."""
    response = client.post(
        "/auth/register",
        json={
            "username": "bademail",
            "email": "not-an-email",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 422


def test_register_short_password(client):
    """Password shorter than 8 characters returns 422."""
    response = client.post(
        "/auth/register",
        json={
            "username": "shortpw",
            "email": "shortpw@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_register_short_username(client):
    """Username shorter than 3 characters returns 422."""
    response = client.post(
        "/auth/register",
        json={
            "username": "ab",
            "email": "shortun@example.com",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 422


def test_register_admin_role_injection(client):
    """Registration should not accept a role field (extra='forbid')."""
    response = client.post(
        "/auth/register",
        json={
            "username": "hacker",
            "email": "hacker@example.com",
            "password": "SecurePass123!",
            "role": "admin",
        },
    )

    # Schema has extra="forbid", so this should be rejected with 422
    assert response.status_code == 422


# ─── Login Tests ────────────────────────────────────────────────────────


def test_login_success(client):
    """Valid credentials return 200 with access_token and token_type."""
    client.post(
        "/auth/register",
        json={
            "username": "loginuser",
            "email": "loginuser@example.com",
            "password": "SecurePass123!",
        },
    )

    response = client.post(
        "/auth/login",
        data={
            "username": "loginuser",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_username(client):
    """Invalid username returns 401."""
    response = client.post(
        "/auth/login",
        data={
            "username": "nonexistent",
            "password": "SecurePass123!",
        },
    )

    assert response.status_code == 401


def test_login_invalid_password(client):
    """Invalid password returns 401."""
    client.post(
        "/auth/register",
        json={
            "username": "wrongpw",
            "email": "wrongpw@example.com",
            "password": "SecurePass123!",
        },
    )

    response = client.post(
        "/auth/login",
        data={
            "username": "wrongpw",
            "password": "WrongPassword!",
        },
    )

    assert response.status_code == 401


def test_login_generic_error_message(client):
    """Error message should not reveal which credential was wrong."""
    response = client.post(
        "/auth/login",
        data={
            "username": "doesnotexist",
            "password": "anything",
        },
    )

    assert response.status_code == 401
    detail = response.json()["detail"]
    assert "incorrect username or password" in detail.lower()


# ─── JWT Tests ──────────────────────────────────────────────────────────


def test_access_with_valid_token(client):
    """Valid token grants access to protected endpoint."""
    client.post(
        "/auth/register",
        json={
            "username": "jwtuser",
            "email": "jwtuser@example.com",
            "password": "SecurePass123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "jwtuser",
            "password": "SecurePass123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "jwtuser"


def test_access_without_token(client):
    """Missing token returns 401."""
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_access_with_invalid_token(client):
    """Malformed token returns 401."""
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )

    assert response.status_code == 401


def test_access_with_expired_token(client):
    """Expired token returns 401."""
    # Register user first
    client.post(
        "/auth/register",
        json={
            "username": "expireduser",
            "email": "expireduser@example.com",
            "password": "SecurePass123!",
        },
    )

    # Create a token that expires immediately (negative delta)
    expired_token = create_access_token(
        data={"sub": "expireduser"},
        expires_delta=timedelta(seconds=-1),
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401


# ─── Current User Tests ────────────────────────────────────────────────


def test_get_current_user(client):
    """GET /auth/me with valid token returns user profile."""
    client.post(
        "/auth/register",
        json={
            "username": "meuser",
            "email": "meuser@example.com",
            "full_name": "Me User",
            "password": "SecurePass123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "meuser",
            "password": "SecurePass123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["username"] == "meuser"
    assert data["email"] == "meuser@example.com"
    assert data["full_name"] == "Me User"
    assert data["role"] == "member"
    assert "hashed_password" not in data


def test_get_current_user_unauthenticated(client):
    """GET /auth/me without token returns 401."""
    response = client.get("/auth/me")

    assert response.status_code == 401
