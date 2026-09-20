def create_test_club(client):
    response = client.post(
        "/clubs/",
        json={
            "name": "Attendance Test Club",
            "description": "Attendance tests",
        },
    )

    assert response.status_code == 201
    return response.json()["id"]


def create_test_member(client, club_id):
    response = client.post(
        "/members/",
        json={
            "name": "Attendance Test Member",
            "email": "attendance.member@example.com",
            "club_id": club_id,
        },
    )

    assert response.status_code == 201
    return response.json()["id"]


def create_test_event(client, club_id):
    response = client.post(
        "/events/",
        json={
            "title": "Attendance Test Event",
            "description": "Attendance event",
            "starts_at": "2026-09-20T10:00:00",
            "club_id": club_id,
        },
    )

    assert response.status_code == 201
    return response.json()["id"]


def create_test_attendance(client):
    club_id = create_test_club(client)
    member_id = create_test_member(client, club_id)
    event_id = create_test_event(client, club_id)

    return member_id, event_id


def test_get_attendance(client):
    response = client.get("/attendance/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_attendance(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": True,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["member_id"] == member_id
    assert data["event_id"] == event_id
    assert data["present"] is True
    assert "id" in data


def test_get_attendance_record(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": True,
        },
    )

    assert response.status_code == 201
    attendance_id = response.json()["id"]

    response = client.get(f"/attendance/{attendance_id}")

    assert response.status_code == 200
    assert response.json()["id"] == attendance_id
    assert response.json()["present"] is True


def test_get_nonexistent_attendance(client):
    response = client.get("/attendance/999999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Attendance record not found"
    }


def test_invalid_member(client):
    club_id = create_test_club(client)
    event_id = create_test_event(client, club_id)

    response = client.post(
        "/attendance/",
        json={
            "member_id": 999999,
            "event_id": event_id,
            "present": True,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Member not found"
    }


def test_invalid_event(client):
    club_id = create_test_club(client)
    member_id = create_test_member(client, club_id)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": 999999,
            "present": True,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Event not found"
    }


def test_duplicate_attendance(client):
    member_id, event_id = create_test_attendance(client)

    payload = {
        "member_id": member_id,
        "event_id": event_id,
        "present": True,
    }

    first = client.post(
        "/attendance/",
        json=payload,
    )

    assert first.status_code == 201

    second = client.post(
        "/attendance/",
        json=payload,
    )

    assert second.status_code == 409
    assert second.json() == {
        "detail": "Attendance already exists for this member and event"
    }


def test_get_member_attendance(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": True,
        },
    )

    assert response.status_code == 201

    response = client.get(
        f"/attendance/member/{member_id}"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["member_id"] == member_id


def test_get_event_attendance(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": False,
        },
    )

    assert response.status_code == 201

    response = client.get(
        f"/attendance/event/{event_id}"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["event_id"] == event_id
    assert response.json()[0]["present"] is False


def test_update_attendance(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": False,
        },
    )

    assert response.status_code == 201

    attendance_id = response.json()["id"]

    response = client.put(
        f"/attendance/{attendance_id}",
        json={
            "present": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["present"] is True


def test_update_nonexistent_attendance(client):
    response = client.put(
        "/attendance/999999",
        json={
            "present": True,
        },
    )

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Attendance record not found"
    }


def test_delete_attendance(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": True,
        },
    )

    assert response.status_code == 201

    attendance_id = response.json()["id"]

    response = client.delete(
        f"/attendance/{attendance_id}"
    )

    assert response.status_code == 204

    response = client.get(
        f"/attendance/{attendance_id}"
    )

    assert response.status_code == 404


def test_delete_nonexistent_attendance(client):
    response = client.delete("/attendance/999999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Attendance record not found"
    }


def test_extra_attendance_fields_rejected(client):
    member_id, event_id = create_test_attendance(client)

    response = client.post(
        "/attendance/",
        json={
            "member_id": member_id,
            "event_id": event_id,
            "present": True,
            "unexpected": "field",
        },
    )

    assert response.status_code == 422