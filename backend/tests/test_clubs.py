def test_get_clubs(client):
    response = client.get("/clubs/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_club(client):
    response = client.get("/clubs/999999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_create_club(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Automated Create Test Club",
            "description": "Created by automated create test",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Automated Create Test Club"
    assert data["description"] == "Created by automated create test"
    assert "id" in data


def test_duplicate_club(client):
    club_data = {
        "name": "Automated Duplicate Test Club",
        "description": "Duplicate test",
    }

    first_response = client.post(
        "/clubs/",
        json=club_data,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/clubs/",
        json=club_data,
    )

    assert second_response.status_code == 409
    assert second_response.json() == {
        "detail": "A club with this name already exists"
    }


def test_update_club(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Club Update Test",
            "description": "Original description",
        },
    )

    assert response.status_code == 201

    club_id = response.json()["id"]

    response = client.put(
        f"/clubs/{club_id}",
        json={
            "name": "Club Update Test Changed",
            "description": "Updated description",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == club_id
    assert data["name"] == "Club Update Test Changed"
    assert data["description"] == "Updated description"


def test_update_nonexistent_club(client):
    response = client.put(
        "/clubs/999999",
        json={
            "name": "Does Not Exist",
            "description": "Test",
        },
    )

    assert response.status_code == 404


def test_delete_nonexistent_club(client):
    response = client.delete("/clubs/999999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_delete_club(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Club Delete Test",
            "description": "Will be deleted",
        },
    )

    assert response.status_code == 201

    club_id = response.json()["id"]

    response = client.delete(
        f"/clubs/{club_id}"
    )

    assert response.status_code == 204

    response = client.get(
        f"/clubs/{club_id}"
    )

    assert response.status_code == 404


def test_empty_club_name(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "",
            "description": "Invalid club",
        },
    )

    assert response.status_code == 422


def test_short_club_name(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "A",
            "description": "Invalid club",
        },
    )

    assert response.status_code == 422


def test_club_name_too_long(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "A" * 256,
            "description": "Invalid club",
        },
    )

    assert response.status_code == 422


def test_description_too_long(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Valid Club",
            "description": "A" * 1001,
        },
    )

    assert response.status_code == 422


def test_extra_fields_rejected(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Extra Field Club",
            "description": "Test",
            "unexpected_field": "should fail",
        },
    )

    assert response.status_code == 422