from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user, require_csrf
from app.db.dependencies import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    project = Project(
        owner_id=user.id,
        name=payload.name,
        description=payload.description,
        base_url=str(payload.base_url) if payload.base_url else None,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = (
        select(Project)
        .where(Project.owner_id == user.id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(statement).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_owned_project(project_id, user, db)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    project = get_owned_project(project_id, user, db)

    updates = payload.model_dump(exclude_unset=True)

    if "base_url" in updates and updates["base_url"] is not None:
        updates["base_url"] = str(updates["base_url"])

    for field, value in updates.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    project = get_owned_project(project_id, user, db)

    db.delete(project)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
