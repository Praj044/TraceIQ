
import ipaddress
import socket
import time
from urllib.parse import urlparse

import httpx


ALLOWED_METHODS = {
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
}


def validate_target_url(url: str) -> str:
    """Validate that a target uses HTTP(S) and resolves only to public IPs."""

    if not isinstance(url, str) or not url or url != url.strip():
        raise ValueError("Target must be a valid HTTP or HTTPS URL")

    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise ValueError("Target must be a valid HTTP or HTTPS URL") from exc

    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not hostname
        or not parsed.netloc
    ):
        raise ValueError("Target must be a valid HTTP or HTTPS URL")

    if parsed.username is not None or parsed.password is not None:
        raise ValueError("URLs containing credentials are not allowed")

    if parsed.fragment:
        raise ValueError("URL fragments are not allowed")

    if port is not None and not 1 <= port <= 65535:
        raise ValueError("Target port is invalid")

    hostname = hostname.lower().rstrip(".")

    if not hostname:
        raise ValueError("Target hostname is invalid")

    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise ValueError("Localhost targets are not allowed")

    try:
        addresses = {ipaddress.ip_address(hostname)}
    except ValueError:
        try:
            resolved = socket.getaddrinfo(
                hostname,
                port or (443 if parsed.scheme.lower() == "https" else 80),
                type=socket.SOCK_STREAM,
            )
            addresses = {
                ipaddress.ip_address(str(item[4][0]).split("%")[0])
                for item in resolved
            }
        except (socket.gaierror, OSError, ValueError) as exc:
            raise ValueError(
                "Target hostname could not be resolved"
            ) from exc

    if not addresses:
        raise ValueError("Target hostname has no resolved addresses")

    if any(not address.is_global for address in addresses):
        raise ValueError(
            "Private or non-public network targets are not allowed"
        )

    return url


def get_json_path(data, path: str):
    """Retrieve a value using a dot-separated JSON path."""

    current = data

    for part in path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit():
            index = int(part)

            if index >= len(current):
                raise KeyError(path)

            current = current[index]
        else:
            raise KeyError(path)

    return current


def evaluate_assertions(
    response: httpx.Response,
    assertions: list[dict],
) -> list[dict]:
    """Evaluate supported response assertions and return their results."""

    results = []

    for assertion in assertions:
        assertion_type = assertion.get("type")

        if assertion_type == "contains":
            expected_text = assertion.get("value")

            if not isinstance(expected_text, str):
                results.append({
                    "type": assertion_type,
                    "passed": False,
                    "message": "Assertion value must be a string",
                })
                continue

            passed = expected_text in response.text

            results.append({
                "type": assertion_type,
                "passed": passed,
                "message": (
                    "Text found"
                    if passed
                    else "Expected text was not found in response body"
                ),
            })

        elif assertion_type == "json_value":
            path = assertion.get("path")

            if not isinstance(path, str) or not path:
                results.append({
                    "type": assertion_type,
                    "passed": False,
                    "message": "A non-empty JSON path is required",
                })
                continue

            try:
                body = response.json()
                actual = get_json_path(body, path)
                expected = assertion.get("expected")
                passed = actual == expected

                results.append({
                    "type": assertion_type,
                    "path": path,
                    "passed": passed,
                    "expected": expected,
                    "actual": actual,
                    "message": (
                        "JSON value matched"
                        if passed
                        else "JSON value did not match"
                    ),
                })
            except (ValueError, KeyError, IndexError):
                results.append({
                    "type": assertion_type,
                    "path": path,
                    "passed": False,
                    "message": "JSON response or path was invalid",
                })

        else:
            results.append({
                "type": str(assertion_type),
                "passed": False,
                "message": "Unsupported assertion type",
            })

    return results


def execute_test(
    base_url: str,
    path: str,
    method: str,
    expected_status: int,
    assertions: list[dict] | None = None,
) -> dict:
    """Execute an HTTP test and evaluate response assertions."""

    if not isinstance(method, str) or method.upper() not in ALLOWED_METHODS:
        raise ValueError("Unsupported HTTP method")

    if not isinstance(path, str) or not path.startswith("/") or path.startswith("//"):
        raise ValueError("Endpoint path must begin with a single slash")

    if not isinstance(expected_status, int) or isinstance(expected_status, bool):
        raise ValueError("Expected status must be an integer")

    if not 100 <= expected_status <= 599:
        raise ValueError("Expected status must be between 100 and 599")

    if assertions is not None and not isinstance(assertions, list):
        raise ValueError("Assertions must be a list")

    if assertions is not None and any(
        not isinstance(item, dict) for item in assertions
    ):
        raise ValueError("Each assertion must be an object")

    target = validate_target_url(base_url.rstrip("/") + path)
    started = time.perf_counter()

    try:
        with httpx.Client(
            timeout=10.0,
            follow_redirects=False,
            trust_env=False,
        ) as client:
            response = client.request(method.upper(), target)

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        assertion_results = evaluate_assertions(response, assertions or [])
        status_passed = response.status_code == expected_status
        assertions_passed = all(
            item["passed"] for item in assertion_results
        )

        return {
            "passed": status_passed and assertions_passed,
            "expected_status": expected_status,
            "actual_status": response.status_code,
            "response_time_ms": elapsed_ms,
            "error": None,
            "assertions": assertion_results,
        }

    except httpx.TimeoutException:
        return {
            "passed": False,
            "expected_status": expected_status,
            "actual_status": None,
            "response_time_ms": round(
                (time.perf_counter() - started) * 1000, 2
            ),
            "error": "Request timed out",
            "assertions": [],
        }

    except httpx.RequestError as exc:
        return {
            "passed": False,
            "expected_status": expected_status,
            "actual_status": None,
            "response_time_ms": round(
                (time.perf_counter() - started) * 1000, 2
            ),
            "error": f"Request failed: {type(exc).__name__}",
            "assertions": [],
        }
