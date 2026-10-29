
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def authenticated_client():
    test_client = TestClient(app)
    suffix = uuid4().hex

    response = test_client.post(
        "/api/v1/auth/register",
        json={
            "name": f"Pytest User {suffix[:8]}",
            "email": f"pytest-{suffix}@example.com",
            "password": f"Test-{suffix}-Password!9",
        },
    )

    assert response.status_code == 201, response.text
    csrf_token = test_client.cookies.get("traceiq_csrf")
    assert csrf_token, "CSRF cookie was not set during registration"

    test_client.headers.update({"X-CSRF-Token": csrf_token})
    return test_client


def test_unauthenticated_requests_are_rejected():
    response = client.get("/api/v1/projects")
    assert response.status_code == 401


def test_create_project():
    test_client = authenticated_client()

    response = test_client.post(
        "/api/v1/projects",
        json={
            "name": f"Test Project {uuid4().hex[:8]}",
            "description": "Created by automated tests",
            "base_url": "https://api.example.com",
        },
    )

    assert response.status_code == 201, response.text

    data = response.json()
    assert data["id"]
    assert data["name"].startswith("Test Project")
    assert data["description"] == "Created by automated tests"
    assert data["base_url"] == "https://api.example.com/"


def test_list_projects():
    test_client = authenticated_client()
    response = test_client.get("/api/v1/projects")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_missing_project():
    test_client = authenticated_client()
    response = test_client.get(f"/api/v1/projects/{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


def test_create_project_rejects_invalid_url():
    test_client = authenticated_client()
    response = test_client.post(
        "/api/v1/projects",
        json={
            "name": "Invalid URL Test",
            "base_url": "not-a-valid-url",
        },
    )

    assert response.status_code == 422


def test_update_project():
    test_client = authenticated_client()
    create_response = test_client.post(
        "/api/v1/projects",
        json={"name": f"Update Test {uuid4().hex[:8]}"},
    )
    assert create_response.status_code == 201, create_response.text

    project_id = create_response.json()["id"]

    update_response = test_client.patch(
        f"/api/v1/projects/{project_id}",
        json={"description": "Updated by pytest"},
    )

    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["description"] == "Updated by pytest"
    assert update_response.json()["name"].startswith("Update Test")


def test_delete_project():
    test_client = authenticated_client()
    create_response = test_client.post(
        "/api/v1/projects",
        json={"name": f"Delete Test {uuid4().hex[:8]}"},
    )
    assert create_response.status_code == 201, create_response.text

    project_id = create_response.json()["id"]

    delete_response = test_client.delete(f"/api/v1/projects/{project_id}")
    assert delete_response.status_code == 204

    get_response = test_client.get(f"/api/v1/projects/{project_id}")
    assert get_response.status_code == 404


def test_user_cannot_access_another_users_project():
    owner_client = authenticated_client()
    other_client = authenticated_client()

    create_response = owner_client.post(
        "/api/v1/projects",
        json={"name": f"Private Project {uuid4().hex[:8]}"},
    )
    assert create_response.status_code == 201, create_response.text

    project_id = create_response.json()["id"]

    response = other_client.get(f"/api/v1/projects/{project_id}")
    assert response.status_code == 404
