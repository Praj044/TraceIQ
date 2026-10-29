
from uuid import UUID, uuid4
from fastapi.testclient import TestClient

from app.main import app

def authenticated_client():
    test_client = TestClient(app)
    suffix = uuid4().hex

    response = test_client.post(
        "/api/v1/auth/register",
        json={
            "name": f"Run Test User {suffix[:8]}",
            "email": f"run-test-{suffix}@example.com",
            "password": f"RunTest-{suffix}-Password!9",
        },
    )

    assert response.status_code == 201, response.text
    csrf_token = test_client.cookies.get("traceiq_csrf")
    assert csrf_token, "CSRF cookie was not set during registration"
    test_client.headers.update({"X-CSRF-Token": csrf_token})
    return test_client


client = authenticated_client()


def test_run_test_case_rejects_missing_project():
    response = client.post(
        f"/api/v1/projects/{uuid4()}/test-cases/{uuid4()}/run"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"


def test_run_test_case_rejects_missing_test_case():
    # Create a real project first.
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": f"Run Test {uuid4().hex[:8]}",
            "base_url": "https://api.example.com",
        },
    )

    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    # The project exists, but this test case UUID does not.
    response = client.post(
        f"/api/v1/projects/{project_id}/test-cases/{uuid4()}/run"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Test case not found"

from unittest.mock import patch


def test_run_test_case_returns_execution_result():
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": f"Execution Test {uuid4().hex[:8]}",
            "base_url": "https://api.example.com",
        },
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    import_response = client.post(
        f"/api/v1/openapi/projects/{project_id}/import",
        json={
            "openapi": "3.0.3",
            "info": {"title": "Demo API", "version": "1.0.0"},
            "servers": [{"url": "https://api.example.com"}],
            "paths": {
                "/health": {
                    "get": {
                        "summary": "Health check",
                        "responses": {"200": {"description": "OK"}},
                    }
                }
            },
        },
    )
    assert import_response.status_code == 200

    endpoints_response = client.get(
        f"/api/v1/openapi/projects/{project_id}/endpoints"
    )
    assert endpoints_response.status_code == 200
    endpoint_id = endpoints_response.json()["endpoints"][0]["id"]
    test_case_response = client.post(
        f"/api/v1/projects/{project_id}/test-cases",
        json={
            "endpoint_id": endpoint_id,
            "name": "Health check returns 200",
            "expected_status": 200,
            "assertions": [],
        },
    )
    assert test_case_response.status_code == 201
    test_case_id = test_case_response.json()["id"]

    with patch(
        "app.api.test_cases.execute_test",
        return_value={
            "passed": True,
            "expected_status": 200,
            "actual_status": 200,
            "response_time_ms": 12.5,
            "error": None,
        },
    ) as mock_execute:
        response = client.post(
            f"/api/v1/projects/{project_id}/test-cases/{test_case_id}/run"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["actual_status"] == 200
    assert data["response_time_ms"] == 12.5
    assert data["error"] is None
    mock_execute.assert_called_once()

def test_get_test_case_run_returns_saved_run_details():
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": f"Single Run Test {uuid4().hex[:8]}",
            "base_url": "https://api.example.com",
        },
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    import_response = client.post(
        f"/api/v1/openapi/projects/{project_id}/import",
        json={
            "openapi": "3.0.3",
            "info": {"title": "Demo API", "version": "1.0.0"},
            "servers": [{"url": "https://api.example.com"}],
            "paths": {
                "/health": {
                    "get": {
                        "summary": "Health check",
                        "responses": {"200": {"description": "OK"}},
                    }
                }
            },
        },
    )
    assert import_response.status_code == 200

    endpoints_response = client.get(
        f"/api/v1/openapi/projects/{project_id}/endpoints"
    )
    endpoint_id = endpoints_response.json()["endpoints"][0]["id"]

    test_case_response = client.post(
        f"/api/v1/projects/{project_id}/test-cases",
        json={
            "endpoint_id": endpoint_id,
            "name": "Health check",
            "expected_status": 200,
            "assertions": [],
        },
    )
    assert test_case_response.status_code == 201
    test_case_id = test_case_response.json()["id"]

    with patch(
        "app.api.test_cases.execute_test",
        return_value={
            "passed": True,
            "expected_status": 200,
            "actual_status": 200,
            "response_time_ms": 12.5,
            "error": None,
            "assertions": [
                {
                    "type": "json_value",
                    "passed": True,
                    "message": "Assertion passed",
                }
            ],
        },
    ):
        run_response = client.post(
            f"/api/v1/projects/{project_id}/test-cases/{test_case_id}/run"
        )

    assert run_response.status_code == 200
    run_id = run_response.json()["run_id"]

    response = client.get(
        f"/api/v1/projects/{project_id}/test-cases/"
        f"{test_case_id}/runs/{run_id}"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["run_id"] == run_id
    assert data["project_id"] == project_id
    assert data["test_case_id"] == test_case_id
    assert data["test_name"] == "Health check"
    assert data["endpoint"] == "/health"
    assert data["method"] == "GET"
    assert data["passed"] is True
    assert data["actual_status"] == 200
    assert data["response_time_ms"] == 12.5
    assert data["assertion_results"][0]["passed"] is True

def test_project_test_run_summary_returns_zero_for_no_runs():
    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": f"Empty Summary {uuid4().hex[:8]}",
            "base_url": "https://api.example.com",
        },
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    response = client.get(
        f"/api/v1/projects/{project_id}/test-runs/summary"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == project_id
    assert data["total_runs"] == 0
    assert data["passed_runs"] == 0
    assert data["failed_runs"] == 0
    assert data["pass_rate_percent"] == 0.0
    assert data["average_response_time_ms"] is None
    assert data["last_run_at"] is None


def test_project_test_run_summary_rejects_missing_project():
    response = client.get(
        f"/api/v1/projects/{uuid4()}/test-runs/summary"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

def test_project_test_run_summary_calculates_statistics():
    from app.db.session import SessionLocal
    from app.models.api_test_run import APITestRun

    project_response = client.post(
        "/api/v1/projects",
        json={
            "name": f"Summary Stats {uuid4().hex[:8]}",
            "base_url": "https://api.example.com",
        },
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    import_response = client.post(
        f"/api/v1/openapi/projects/{project_id}/import",
        json={
            "openapi": "3.0.3",
            "info": {"title": "Demo API", "version": "1.0.0"},
            "servers": [{"url": "https://api.example.com"}],
            "paths": {
                "/health": {
                    "get": {
                        "responses": {"200": {"description": "OK"}},
                    }
                }
            },
        },
    )
    assert import_response.status_code == 200

    endpoints_response = client.get(
        f"/api/v1/openapi/projects/{project_id}/endpoints"
    )
    assert endpoints_response.status_code == 200
    endpoint_id = endpoints_response.json()["endpoints"][0]["id"]

    case_response = client.post(
        f"/api/v1/projects/{project_id}/test-cases",
        json={
            "endpoint_id": endpoint_id,
            "name": "Summary test",
            "expected_status": 200,
            "assertions": [],
        },
    )
    assert case_response.status_code == 201
    test_case_id = case_response.json()["id"]

    with SessionLocal() as db:
        db.add_all(
            [
                APITestRun(
                    project_id=UUID(project_id),
                    test_case_id=UUID(test_case_id),
                    passed=True,
                    expected_status=200,
                    actual_status=200,
                    response_time_ms=10.0,
                    error=None,
                    assertion_results=[],
                ),
                APITestRun(
                    project_id=UUID(project_id),
                    test_case_id=UUID(test_case_id),
                    passed=False,
                    expected_status=200,
                    actual_status=500,
                    response_time_ms=30.0,
                    error=None,
                    assertion_results=[],
                ),
            ]
        )
        db.commit()

    response = client.get(
        f"/api/v1/projects/{project_id}/test-runs/summary"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_runs"] == 2
    assert data["passed_runs"] == 1
    assert data["failed_runs"] == 1
    assert data["pass_rate_percent"] == 50.0
    assert data["average_response_time_ms"] == 20.0
    assert data["last_run_at"] is not None
