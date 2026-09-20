def create_test_club(client, headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Member Test Club",
            "description": "Club for member tests",
        },
        headers=headers,
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_get_members(client, manager_headers):
    response = client.get("/members/", headers=manager_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_member(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Test Member",
            "email": "member.create.test@example.com",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Test Member"
    assert data["email"] == "member.create.test@example.com"
    assert data["club_id"] == club_id
    assert "id" in data


def test_get_member(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Get Member Test",
            "email": "member.get.test@example.com",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    member_id = response.json()["id"]

    response = client.get(f"/members/{member_id}", headers=manager_headers)

    assert response.status_code == 200
    assert response.json()["id"] == member_id
    assert response.json()["name"] == "Get Member Test"


def test_get_nonexistent_member(client, manager_headers):
    response = client.get("/members/999999", headers=manager_headers)

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Member not found"
    }


def test_create_member_invalid_club(client, manager_headers):
    response = client.post(
        "/members/",
        json={
            "name": "Invalid Club Member",
            "email": "invalid.club.member@example.com",
            "club_id": 999999,
        },
        headers=manager_headers,
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_duplicate_member_email(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    email = "member.duplicate.test@example.com"

    first_response = client.post(
        "/members/",
        json={
            "name": "First Member",
            "email": email,
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/members/",
        json={
            "name": "Second Member",
            "email": email,
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert second_response.status_code == 409


def test_update_member(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Member Update Test",
            "email": "member.update.test@example.com",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    member_id = response.json()["id"]

    response = client.put(
        f"/members/{member_id}",
        json={
            "name": "Updated Member",
        },
        headers=manager_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == member_id
    assert data["name"] == "Updated Member"


def test_update_member_email(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Email Update Test",
            "email": "member.email.old@example.com",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    member_id = response.json()["id"]

    response = client.put(
        f"/members/{member_id}",
        json={
            "email": "member.email.new@example.com",
        },
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert response.json()["email"] == "member.email.new@example.com"


def test_update_nonexistent_member(client, manager_headers):
    response = client.put(
        "/members/999999",
        json={
            "name": "Does Not Exist",
        },
        headers=manager_headers,
    )

    assert response.status_code == 404


def test_delete_member(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Delete Member Test",
            "email": "member.delete.test@example.com",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    member_id = response.json()["id"]

    response = client.delete(f"/members/{member_id}", headers=manager_headers)

    assert response.status_code == 204

    response = client.get(f"/members/{member_id}", headers=manager_headers)

    assert response.status_code == 404


def test_delete_nonexistent_member(client, manager_headers):
    response = client.delete("/members/999999", headers=manager_headers)

    assert response.status_code == 404


def test_invalid_member_email(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Invalid Email Member",
            "email": "not-an-email",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_extra_member_fields_rejected(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/members/",
        json={
            "name": "Extra Field Member",
            "email": "member.extra.test@example.com",
            "club_id": club_id,
            "unexpected": "field",
        },
        headers=manager_headers,
    )

    assert response.status_code == 201