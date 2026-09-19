from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_clubs():
    response = client.get("/clubs/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_club():
    response = client.get("/clubs/999999")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Club not found"
    }


def test_create_club():
    response = client.post(
        "/clubs/",
        json={
            "name": "Automated Test Club",
            "description": "Created by automated tests",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Automated Test Club"
    assert data["description"] == "Created by automated tests"
    assert "id" in data


def test_duplicate_club():
    response = client.post(
        "/clubs/",
        json={
            "name": "Automated Test Club",
            "description": "Created by automated tests",
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "A club with this name already exists"
    }