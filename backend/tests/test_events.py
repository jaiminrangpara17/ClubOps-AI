def create_test_club(client, headers):
    response = client.post(
        "/clubs/",
        json={
            "name": "Event Test Club",
            "description": "Club for event tests",
        },
        headers=headers,
    )

    assert response.status_code == 201

    return response.json()["id"]

def test_get_events(client, manager_headers):
    response = client.get("/events/", headers=manager_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_event(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "AI Workshop",
            "description": "Introduction to AI",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "AI Workshop"
    assert data["description"] == "Introduction to AI"
    assert data["club_id"] == club_id
    assert "id" in data


def test_get_event(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "Get Event Test",
            "starts_at": "2026-09-21T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201
    event_id = response.json()["id"]

    response = client.get(f"/events/{event_id}", headers=manager_headers)

    assert response.status_code == 200
    assert response.json()["id"] == event_id


def test_get_nonexistent_event(client, manager_headers):
    response = client.get("/events/999999", headers=manager_headers)

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Event not found"
    }


def test_create_event_invalid_club(client, manager_headers):
    response = client.post(
        "/events/",
        json={
            "title": "Invalid Club Event",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": 999999,
        },
        headers=manager_headers,
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_update_event(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "Original Event",
            "description": "Original",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201

    event_id = response.json()["id"]

    response = client.put(
        f"/events/{event_id}",
        json={
            "title": "Updated Event",
            "description": "Updated",
            "starts_at": "2026-09-20T12:00:00",
        },
        headers=manager_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == event_id
    assert data["title"] == "Updated Event"
    assert data["description"] == "Updated"


def test_update_event_club(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    second_club = client.post(
        "/clubs/",
        json={
            "name": "Second Event Test Club",
            "description": "Second club",
        },
        headers=manager_headers,
    )

    assert second_club.status_code == 201
    second_club_id = second_club.json()["id"]

    response = client.post(
        "/events/",
        json={
            "title": "Club Move Event",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201
    event_id = response.json()["id"]

    response = client.put(
        f"/events/{event_id}",
        json={
            "club_id": second_club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 200
    assert response.json()["club_id"] == second_club_id


def test_update_nonexistent_event(client, manager_headers):
    response = client.put(
        "/events/999999",
        json={
            "title": "Does Not Exist",
        },
        headers=manager_headers,
    )

    assert response.status_code == 404


def test_update_event_invalid_club(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "Invalid Update Event",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201
    event_id = response.json()["id"]

    response = client.put(
        f"/events/{event_id}",
        json={
            "club_id": 999999,
        },
        headers=manager_headers,
    )

    assert response.status_code == 404


def test_delete_event(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "Delete Event Test",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 201
    event_id = response.json()["id"]

    response = client.delete(f"/events/{event_id}", headers=manager_headers)

    assert response.status_code == 204

    response = client.get(f"/events/{event_id}", headers=manager_headers)

    assert response.status_code == 404


def test_delete_nonexistent_event(client, manager_headers):
    response = client.delete("/events/999999", headers=manager_headers)

    assert response.status_code == 404


def test_invalid_event_name(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
        headers=manager_headers,
    )

    assert response.status_code == 422


def test_extra_event_fields_rejected(client, manager_headers):
    club_id = create_test_club(client, manager_headers)

    response = client.post(
        "/events/",
        json={
            "title": "Extra Field Event",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
            "unexpected": "field",
        },
        headers=manager_headers,
    )

    assert response.status_code == 422
