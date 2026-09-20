def test_get_clubs(client, manager_headers):
    response = client.get("/clubs/", headers=manager_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_clubs_unauthenticated(client):
    response = client.get("/clubs/")

    assert response.status_code == 401


def test_get_nonexistent_club(client, manager_headers):
    response = client.get("/clubs/999999", headers=manager_headers)

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_create_club(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Automated Create Test Club",
            "description": "Created by automated create test",
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Automated Create Test Club"
    assert data["description"] == "Created by automated create test"
    assert "id" in data


def test_create_club_member_forbidden(client, member_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Member Club Attempt",
            "description": "Should fail",
        },
        headers=member_headers,
    )

    assert response.status_code == 403


def test_duplicate_club(client, manager_headers):
    club_data = {
        "name": "Automated Duplicate Test Club",
        "description": "Duplicate test",
    }

    first_response = client.post(
        "/clubs/",
        json=club_data,
        headers=manager_headers,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/clubs/",
        json=club_data,
        headers=manager_headers,
    )

    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "A club with this name already exists"
    }


def test_update_club(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Club Update Test",
            "description": "Original description",
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    club_id = response.json()["id"]

    response = client.put(
        f"/clubs/{club_id}",
        json={
            "name": "Club Update Test Changed",
            "description": "Updated description",
        },
        headers=manager_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == club_id
    assert data["name"] == "Club Update Test Changed"
    assert data["description"] == "Updated description"


def test_update_nonexistent_club(client, manager_headers):
    response = client.put(
        "/clubs/999999",
        json={
            "name": "Does Not Exist",
            "description": "Test",
        },
        headers=manager_headers,
    )

    assert response.status_code == 404


def test_delete_nonexistent_club(client, manager_headers):
    response = client.delete("/clubs/999999", headers=manager_headers)

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_delete_club(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Club Delete Test",
            "description": "Will be deleted",
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    club_id = response.json()["id"]

    response = client.delete(
        f"/clubs/{club_id}",
        headers=manager_headers,
    )

    assert response.status_code == 204

    response = client.get(
        f"/clubs/{club_id}",
        headers=manager_headers,
    )

    assert response.status_code == 404


def test_empty_club_name(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "",
            "description": "Invalid club",
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_short_club_name(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "A",
            "description": "Invalid club",
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_club_name_too_long(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "A" * 256,
            "description": "Invalid club",
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_description_too_long(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Valid Club",
            "description": "A" * 1001,
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_extra_fields_rejected(client, manager_headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Extra Field Club",
            "description": "Test",
            "unexpected_field": "should fail",
        },
        headers=manager_headers,
    )

    assert response.status_code == 422