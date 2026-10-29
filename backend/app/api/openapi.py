
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.dependencies import get_db
from app.models.api_endpoint import APIEndpoint
from app.models.project import Project
from app.models.user import User
from app.services.openapi_parser import parse_openapi_spec
from app.api.auth import get_current_user, require_csrf

router = APIRouter(
    prefix="/api/v1/openapi",
    tags=["OpenAPI Import"],
)


def get_owned_project(
    project_id: UUID,
    user: User,
    db: Session,
) -> Project:
    project = db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == user.id,
        )
    )

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.post("/projects/{project_id}/import")
def import_specification(
    project_id: UUID,
    spec: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    project = get_owned_project(project_id, user, db)
    result = parse_openapi_spec(spec)

    if result["base_url"] and not project.base_url:
        project.base_url = result["base_url"]

    imported_count = 0

    for endpoint in result["endpoints"]:
        existing = db.scalar(
            select(APIEndpoint).where(
                APIEndpoint.project_id == project_id,
                APIEndpoint.path == endpoint["path"],
                APIEndpoint.method == endpoint["method"],
            )
        )

        if existing:
            existing.operation_id = endpoint["operation_id"]
            existing.summary = endpoint["summary"]
            existing.parameters = endpoint["parameters"]
            existing.tags = endpoint["tags"]
        else:
            db.add(
                APIEndpoint(
                    project_id=project_id,
                    path=endpoint["path"],
                    method=endpoint["method"],
                    operation_id=endpoint["operation_id"],
                    summary=endpoint["summary"],
                    parameters=endpoint["parameters"],
                    tags=endpoint["tags"],
                )
            )
            imported_count += 1

    db.commit()

    return {
        "project_id": str(project_id),
        "api_title": result["title"],
        "endpoint_count": result["endpoint_count"],
        "new_endpoints_imported": imported_count,
        "message": "OpenAPI specification imported successfully",
    }


@router.get("/projects/{project_id}/endpoints")
def list_project_endpoints(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_project(project_id, user, db)

    statement = (
        select(APIEndpoint)
        .where(APIEndpoint.project_id == project_id)
        .order_by(APIEndpoint.path, APIEndpoint.method)
    )

    endpoints = db.scalars(statement).all()

    return {
        "project_id": str(project_id),
        "total": len(endpoints),
        "endpoints": [
            {
                "id": str(endpoint.id),
                "path": endpoint.path,
                "method": endpoint.method,
                "operation_id": endpoint.operation_id,
                "summary": endpoint.summary,
                "parameters": endpoint.parameters,
                "tags": endpoint.tags,
                "created_at": endpoint.created_at.isoformat(),
            }
            for endpoint in endpoints
        ],
    }
