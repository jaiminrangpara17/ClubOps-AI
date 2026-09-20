# ─── User Endpoint Tests ────────────────────────────────────────────────


def test_get_users_me(client, member_headers):
    """GET /users/me returns current user profile."""
    response = client.get("/users/me", headers=member_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testmember"
    assert "hashed_password" not in data


def test_get_user_by_id(client, member_headers, admin_headers, db_session):
    """Any authenticated user can view another user by ID."""
    # Get admin user's ID from /users/me
    admin_me = client.get("/users/me", headers=admin_headers)
    admin_id = admin_me.json()["id"]

    # Member should be able to view the admin user
    response = client.get(f"/users/{admin_id}", headers=member_headers)

    assert response.status_code == 200
    assert response.json()["id"] == admin_id


def test_get_user_not_found(client, member_headers):
    """GET /users/{id} with nonexistent ID returns 404."""
    response = client.get("/users/999999", headers=member_headers)

    assert response.status_code == 404


# ─── Admin-Only Endpoints ──────────────────────────────────────────────


def test_list_users_as_admin(client, admin_headers):
    """Admin can list all users."""
    response = client.get("/users/", headers=admin_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1  # At least the admin user


def test_list_users_as_member_forbidden(client, member_headers):
    """Member cannot list all users."""
    response = client.get("/users/", headers=member_headers)

    assert response.status_code == 403


def test_list_users_as_manager_forbidden(client, manager_headers):
    """Manager cannot list all users (admin-only)."""
    response = client.get("/users/", headers=manager_headers)

    assert response.status_code == 403


def test_update_user_role_as_admin(client, admin_headers, member_headers):
    """Admin can update a user's role."""
    # Get the member user's ID
    me = client.get("/users/me", headers=member_headers)
    member_id = me.json()["id"]

    response = client.put(
        f"/users/{member_id}",
        json={"role": "manager"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["role"] == "manager"


def test_update_user_as_member_forbidden(client, member_headers):
    """Member cannot update other users."""
    response = client.put(
        "/users/999999",
        json={"role": "admin"},
        headers=member_headers,
    )

    assert response.status_code == 403


def test_delete_user_as_admin(client, admin_headers, db_session):
    """Admin can delete a user."""
    from tests.conftest import register_and_login

    # Create a throwaway user to delete
    register_and_login(client, "deleteuser")

    # Get the user's ID
    me = client.get("/users/me", headers=admin_headers)
    users = client.get("/users/", headers=admin_headers)
    delete_user = next(
        u for u in users.json() if u["username"] == "deleteuser"
    )

    response = client.delete(
        f"/users/{delete_user['id']}",
        headers=admin_headers,
    )

    assert response.status_code == 204


def test_delete_user_as_member_forbidden(client, member_headers):
    """Member cannot delete users."""
    response = client.delete("/users/999999", headers=member_headers)

    assert response.status_code == 403


def test_delete_nonexistent_user(client, admin_headers):
    """Deleting a nonexistent user returns 404."""
    response = client.delete("/users/999999", headers=admin_headers)

    assert response.status_code == 404


# ─── Authorization on Existing Routers ─────────────────────────────────


def test_member_can_read_clubs(client, member_headers):
    """Member (any authenticated user) can read clubs."""
    response = client.get("/clubs/", headers=member_headers)

    assert response.status_code == 200


def test_member_cannot_create_club(client, member_headers):
    """Member cannot create a club (requires manager/admin)."""
    response = client.post(
        "/clubs/",
        json={
            "name": "Member Club Attempt",
            "description": "Should fail",
        },
        headers=member_headers,
    )

    assert response.status_code == 403


def test_manager_can_create_club(client, manager_headers):
    """Manager can create a club."""
    response = client.post(
        "/clubs/",
        json={
            "name": "Manager Club",
            "description": "Created by manager",
        },
        headers=manager_headers,
    )

    assert response.status_code == 201


def test_manager_cannot_manage_users(client, manager_headers):
    """Manager cannot access admin-only user management."""
    response = client.get("/users/", headers=manager_headers)

    assert response.status_code == 403
