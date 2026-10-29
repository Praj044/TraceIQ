
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.projects import get_owned_project
from app.db.dependencies import get_db
from app.models.api_endpoint import APIEndpoint
from app.models.api_test_case import APITestCase
from app.models.api_test_run import APITestRun
from app.models.user import User
from app.schemas.test_case import TestCaseCreate, TestCaseResponse
from app.services.api_test_executor import execute_test
from app.api.auth import get_current_user, require_csrf

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/test-cases",
    tags=["Test Cases"],
)


@router.post(
    "",
    response_model=TestCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_test_case(
    project_id: UUID,
    payload: TestCaseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
     _csrf: None = Depends(require_csrf),
):
    get_owned_project(project_id, user, db)

    endpoint = db.get(APIEndpoint, payload.endpoint_id)

    if endpoint is None or endpoint.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not found in this project",
        )

    test_case = APITestCase(
        project_id=project_id,
        endpoint_id=payload.endpoint_id,
        name=payload.name,
        expected_status=payload.expected_status,
        assertions=payload.assertions,
    )

    db.add(test_case)
    db.commit()
    db.refresh(test_case)

    return test_case


@router.get("", response_model=list[TestCaseResponse])
def list_test_cases(
    project_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_project(project_id, user, db)

    statement = (
        select(APITestCase)
        .where(APITestCase.project_id == project_id)
        .order_by(APITestCase.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    return db.scalars(statement).all()


@router.post("/{test_case_id}/run")
def run_test_case(
    project_id: UUID,
    test_case_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
     _csrf: None = Depends(require_csrf),
):
    project = get_owned_project(project_id, user, db)

    test_case = db.get(APITestCase, test_case_id)

    if test_case is None or test_case.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )

    endpoint = db.get(APIEndpoint, test_case.endpoint_id)

    if endpoint is None or endpoint.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not found",
        )

    if not project.base_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no base URL configured",
        )

    try:
        result = execute_test(
            base_url=project.base_url,
            path=endpoint.path,
            method=endpoint.method,
            expected_status=test_case.expected_status,
            assertions=test_case.assertions,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    run = APITestRun(
        project_id=project_id,
        test_case_id=test_case_id,
        passed=result["passed"],
        expected_status=result["expected_status"],
        actual_status=result["actual_status"],
        response_time_ms=result["response_time_ms"],
        error=result["error"],
        assertion_results=result.get("assertions", []),
    )

    try:
        db.add(run)
        db.commit()
        db.refresh(run)
    except Exception:
        db.rollback()
        raise

    return {
        "run_id": str(run.id),
        "project_id": str(project_id),
        "test_case_id": str(test_case_id),
        "endpoint": endpoint.path,
        "method": endpoint.method,
        "test_name": test_case.name,
        "created_at": run.created_at,
        **result,
    }


@router.get("/{test_case_id}/runs")
def list_test_case_runs(
    project_id: UUID,
    test_case_id: UUID,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_project(project_id, user, db)

    test_case = db.get(APITestCase, test_case_id)

    if test_case is None or test_case.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )

    statement = (
        select(APITestRun)
        .where(
            APITestRun.project_id == project_id,
            APITestRun.test_case_id == test_case_id,
        )
        .order_by(APITestRun.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    runs = db.scalars(statement).all()

    return {
        "project_id": str(project_id),
        "test_case_id": str(test_case_id),
        "total_returned": len(runs),
        "runs": [
            {
                "run_id": str(run.id),
                "passed": run.passed,
                "expected_status": run.expected_status,
                "actual_status": run.actual_status,
                "response_time_ms": run.response_time_ms,
                "error": run.error,
                "assertion_results": run.assertion_results,
                "created_at": run.created_at,
            }
            for run in runs
        ],
    }


@router.get("/{test_case_id}/runs/{run_id}")
def get_test_case_run(
    project_id: UUID,
    test_case_id: UUID,
    run_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_project(project_id, user, db)

    test_case = db.get(APITestCase, test_case_id)

    if test_case is None or test_case.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found",
        )

    run = db.get(APITestRun, run_id)

    if (
        run is None
        or run.project_id != project_id
        or run.test_case_id != test_case_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test run not found",
        )

    endpoint = db.get(APIEndpoint, test_case.endpoint_id)

    return {
        "run_id": str(run.id),
        "project_id": str(project_id),
        "test_case_id": str(test_case_id),
        "test_name": test_case.name,
        "endpoint": endpoint.path if endpoint else None,
        "method": endpoint.method if endpoint else None,
        "passed": run.passed,
        "expected_status": run.expected_status,
        "actual_status": run.actual_status,
        "response_time_ms": run.response_time_ms,
        "error": run.error,
        "assertion_results": run.assertion_results,
        "created_at": run.created_at,
    }
