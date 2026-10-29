import httpx
from app.services.api_test_executor import evaluate_assertions
import pytest

from app.services.api_test_executor import execute_test, validate_target_url


def test_rejects_localhost():
    with pytest.raises(ValueError, match="Localhost"):
        validate_target_url("http://localhost:8000")


def test_rejects_private_ip():
    with pytest.raises(ValueError, match="non-public"):
        validate_target_url("http://127.0.0.1:8000")


def test_rejects_unsupported_scheme():
    with pytest.raises(ValueError, match="HTTP or HTTPS"):
        validate_target_url("ftp://example.com/file")


def test_rejects_invalid_endpoint_path():
    with pytest.raises(ValueError, match="single slash"):
        execute_test(
            "https://example.com",
            "//other.example/path",
            "GET",
            200,
        )


def test_rejects_unsupported_method():
    with pytest.raises(ValueError, match="Unsupported"):
        execute_test(
            "https://example.com",
            "/health",
            "TRACE",
            200,
        )

def test_json_value_assertion_passes():
    response = httpx.Response(
        200,
        json={"status": "ok", "data": {"count": 3}},
    )

    results = evaluate_assertions(
        response,
        [
            {
                "type": "json_value",
                "path": "data.count",
                "expected": 3,
            }
        ],
    )

    assert results[0]["passed"] is True


def test_json_value_assertion_fails_on_mismatch():
    response = httpx.Response(
        200,
        json={"status": "error"},
    )

    results = evaluate_assertions(
        response,
        [
            {
                "type": "json_value",
                "path": "status",
                "expected": "ok",
            }
        ],
    )

    assert results[0]["passed"] is False


def test_contains_assertion_passes():
    response = httpx.Response(
        200,
        text="TraceIQ test succeeded",
    )

    results = evaluate_assertions(
        response,
        [{"type": "contains", "value": "succeeded"}],
    )

    assert results[0]["passed"] is True

def test_json_value_assertion_fails_for_missing_path():
    response = httpx.Response(
        200,
        json={"status": "ok"},
    )

    results = evaluate_assertions(
        response,
        [
            {
                "type": "json_value",
                "path": "data.missing",
                "expected": 3,
            }
        ],
    )

    assert results[0]["passed"] is False
    assert results[0]["message"] == "JSON response or path was invalid"


def test_unsupported_assertion_type_fails_safely():
    response = httpx.Response(
        200,
        json={"status": "ok"},
    )

    results = evaluate_assertions(
        response,
        [{"type": "unknown_check"}],
    )

    assert results[0]["passed"] is False
    assert results[0]["message"] == "Unsupported assertion type"

def test_rejects_url_with_credentials():
    with pytest.raises(ValueError, match="credentials"):
        validate_target_url("https://user:password@example.com")


def test_rejects_invalid_port():
    with pytest.raises(ValueError, match="valid HTTP or HTTPS URL"):
        validate_target_url("https://example.com:99999")


def test_rejects_url_with_fragment():
    with pytest.raises(ValueError, match="fragments"):
        validate_target_url("https://example.com/health#private")


def test_rejects_hostname_resolving_to_private_ip(monkeypatch):
    def fake_getaddrinfo(*args, **kwargs):
        return [
            (
                2,
                1,
                6,
                "",
                ("192.168.1.10", 443),
            )
        ]

    monkeypatch.setattr(
        "app.services.api_test_executor.socket.getaddrinfo",
        fake_getaddrinfo,
    )

    with pytest.raises(ValueError, match="non-public"):
        validate_target_url("https://example.com")

