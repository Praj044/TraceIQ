from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
import pytest
from fastapi import HTTPException

from app.services.openapi_parser import parse_openapi_spec


def test_parse_openapi_endpoints():
    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "Payments API",
            "version": "1.0.0",
        },
        "servers": [{"url": "https://api.example.com"}],
        "paths": {
            "/payments": {
                "get": {
                    "operationId": "listPayments",
                    "summary": "List payments",
                    "tags": ["Payments"],
                },
                "post": {
                    "operationId": "createPayment",
                    "summary": "Create payment",
                },
            }
        },
    }

    result = parse_openapi_spec(spec)

    assert result["title"] == "Payments API"
    assert result["base_url"] == "https://api.example.com"
    assert result["endpoint_count"] == 2
    assert result["endpoints"][0]["method"] == "GET"
    assert result["endpoints"][1]["method"] == "POST"


def test_rejects_openapi_v2():
    with pytest.raises(HTTPException) as exc:
        parse_openapi_spec({"swagger": "2.0"})

    assert exc.value.status_code == 422


def test_rejects_missing_paths():
    with pytest.raises(HTTPException) as exc:
        parse_openapi_spec({
            "openapi": "3.0.3",
            "info": {"title": "Test API"},
        })

    assert exc.value.status_code == 422


def test_ignores_non_http_path_properties():
    spec = {
        "openapi": "3.0.3",
        "info": {"title": "Test API"},
        "paths": {
            "/health": {
                "parameters": [{"name": "X-Trace", "in": "header"}],
                "get": {"summary": "Health check"},
            }
        },
    }

    result = parse_openapi_spec(spec)

    assert result["endpoint_count"] == 1
    assert result["endpoints"][0]["method"] == "GET"

def authenticated_client():
    test_client = TestClient(app)
    suffix = uuid4().hex

    response = test_client.post(
        "/api/v1/auth/register",
        json={
            "name": f"OpenAPI Test {suffix[:8]}",
            "email": f"openapi-{suffix}@example.com",
            "password": f"OpenAPI-{suffix}-Password!9",
        },
    )

    assert response.status_code == 201, response.text
    csrf_token = test_client.cookies.get("traceiq_csrf")
    assert csrf_token, "CSRF cookie was not set during registration"
    test_client.headers.update({"X-CSRF-Token": csrf_token})
    return test_client


client = authenticated_client()


def test_import_and_list_project_endpoints():
    project_response = client.post(
        "/api/v1/projects",
        json={"name": f"OpenAPI Test {uuid4().hex[:8]}"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "Integration Test API",
            "version": "1.0.0",
        },
        "servers": [{"url": "https://api.example.com"}],
        "paths": {
            "/items": {
                "get": {
                    "operationId": "listItems",
                    "summary": "List items",
                },
                "post": {
                    "operationId": "createItem",
                    "summary": "Create item",
                },
            }
        },
    }

    import_response = client.post(
        f"/api/v1/openapi/projects/{project_id}/import",
        json=spec,
    )

    assert import_response.status_code == 200
    assert import_response.json()["endpoint_count"] == 2
    assert import_response.json()["new_endpoints_imported"] == 2

    list_response = client.get(
        f"/api/v1/openapi/projects/{project_id}/endpoints"
    )

    assert list_response.status_code == 200
    assert list_response.json()["total"] == 2
    assert {
        (item["method"], item["path"])
        for item in list_response.json()["endpoints"]
    } == {
        ("GET", "/items"),
        ("POST", "/items"),
    }


def test_import_rejects_missing_project():
    response = client.post(
        f"/api/v1/openapi/projects/{uuid4()}/import",
        json={
            "openapi": "3.0.3",
            "info": {"title": "Missing Project API"},
            "paths": {},
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

def test_openapi_routes_reject_unauthenticated_requests():
    anonymous_client = TestClient(app)

    response = anonymous_client.get(
        f"/api/v1/openapi/projects/{uuid4()}/endpoints"
    )

    assert response.status_code == 401