import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.security import hash_password


TEST_DATABASE_URL = (
    "postgresql+psycopg://clubops:ClubOpsDev2026"
    "@localhost:55432/clubops_test"
)

engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    db = TestingSessionLocal()

    # Start every test with clean tables.
    # We delete children before parents because of foreign keys.
    db.execute(text("DELETE FROM attendance"))
    db.execute(text("DELETE FROM members"))
    db.execute(text("DELETE FROM events"))
    db.execute(text("DELETE FROM clubs"))
    db.execute(text("DELETE FROM users"))
    db.commit()

    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def register_and_login(client, username, password="TestPass123!", role=None, db_session=None):
    """Register a user, optionally set their role in DB, then login and return auth headers."""
    # Register
    client.post(
        "/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "full_name": f"Test {username}",
            "password": password,
        },
    )

    # If a non-member role is needed, update directly in DB
    if role and role != UserRole.MEMBER.value and db_session is not None:
        user = db_session.query(User).filter(User.username == username).first()
        if user:
            user.role = role
            db_session.commit()
            db_session.refresh(user)

    # Login
    login_response = client.post(
        "/auth/login",
        data={
            "username": username,
            "password": password,
        },
    )

    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client, db_session):
    """Register an admin user and return auth headers."""
    return register_and_login(
        client,
        username="testadmin",
        role=UserRole.ADMIN.value,
        db_session=db_session,
    )


@pytest.fixture()
def manager_headers(client, db_session):
    """Register a manager user and return auth headers."""
    return register_and_login(
        client,
        username="testmanager",
        role=UserRole.MANAGER.value,
        db_session=db_session,
    )


@pytest.fixture()
def member_headers(client):
    """Register a member user and return auth headers."""
    return register_and_login(
        client,
        username="testmember",
    )