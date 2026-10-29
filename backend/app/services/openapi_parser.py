from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException


SUPPORTED_METHODS = {
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
}


def parse_openapi_spec(spec: dict[str, Any]) -> dict[str, Any]:
    """Validate an OpenAPI document and extract its API endpoints."""

    if not isinstance(spec, dict):
        raise HTTPException(status_code=422, detail="Specification must be a JSON object")

    version = spec.get("openapi")
    if not isinstance(version, str) or not version.startswith("3."):
        raise HTTPException(
            status_code=422,
            detail="Only OpenAPI 3.x specifications are supported",
        )

    info = spec.get("info")
    if not isinstance(info, dict) or not isinstance(info.get("title"), str):
        raise HTTPException(
            status_code=422,
            detail="Specification must contain info.title",
        )

    paths = spec.get("paths")
    if not isinstance(paths, dict):
        raise HTTPException(
            status_code=422,
            detail="Specification must contain a paths object",
        )

    endpoints = []

    for path, path_item in paths.items():
        if not isinstance(path, str) or not path.startswith("/"):
            continue

        if not isinstance(path_item, dict):
            continue

        for method, operation in path_item.items():
            method = method.lower()

            if method not in SUPPORTED_METHODS:
                continue

            if not isinstance(operation, dict):
                continue

            endpoints.append(
                {
                    "path": path,
                    "method": method.upper(),
                    "operation_id": operation.get("operationId"),
                    "summary": operation.get("summary"),
                    "parameters": operation.get("parameters", []),
                    "tags": operation.get("tags", []),
                }
            )

    servers = spec.get("servers", [])
    base_url = None

    if isinstance(servers, list) and servers and isinstance(servers[0], dict):
        candidate = servers[0].get("url")

        if isinstance(candidate, str):
            parsed = urlparse(candidate)
            if parsed.scheme in {"http", "https"} and parsed.netloc:
                base_url = candidate.rstrip("/")

    return {
        "title": info["title"],
        "version": info.get("version"),
        "openapi_version": version,
        "base_url": base_url,
        "endpoint_count": len(endpoints),
        "endpoints": endpoints,
    }
