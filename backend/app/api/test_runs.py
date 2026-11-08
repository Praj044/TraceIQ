from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.api.projects import get_owned_project
from app.db.dependencies import get_db
from app.models.api_test_case import APITestCase
from app.models.api_test_run import APITestRun
from app.models.user import User

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/test-runs",
    tags=["Test Runs"],
)


@router.get("/summary")
def get_project_test_run_summary(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_project(project_id, user, db)

    statement = select(
        func.count(APITestRun.id).label("total_runs"),
        func.count(APITestRun.id)
        .filter(APITestRun.passed.is_(True))
        .label("passed_runs"),
        func.count(APITestRun.id)
        .filter(APITestRun.passed.is_(False))
        .label("failed_runs"),
        func.avg(APITestRun.response_time_ms).label("average_response_time_ms"),
        func.max(APITestRun.created_at).label("last_run_at"),
    ).where(APITestRun.project_id == project_id)

    result = db.execute(statement).one()

    total_runs = result.total_runs or 0
    passed_runs = result.passed_runs or 0
    failed_runs = result.failed_runs or 0

    return {
        "project_id": str(project_id),
        "total_runs": total_runs,
        "passed_runs": passed_runs,
        "failed_runs": failed_runs,
        "pass_rate_percent": round(
            (passed_runs / total_runs) * 100, 2
        ) if total_runs else 0.0,
        "average_response_time_ms": round(
            float(result.average_response_time_ms), 2
        ) if result.average_response_time_ms is not None else None,
        "last_run_at": result.last_run_at,
    }
@router.get("/history")
def get_project_test_run_history(
    project_id: UUID,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return paginated test execution history for a project."""

    get_owned_project(project_id, user, db)

    statement = (
        select(APITestRun, APITestCase.name)
        .join(
            APITestCase,
            APITestRun.test_case_id == APITestCase.id,
        )
        .where(APITestRun.project_id == project_id)
        .order_by(
            APITestRun.created_at.desc(),
            APITestRun.id.desc(),
        )
    )

    total = db.scalar(
        select(func.count(APITestRun.id)).where(
            APITestRun.project_id == project_id
        )
    ) or 0

    results = db.execute(
        statement.limit(limit).offset(offset)
    ).all()

    history = []

    for run, test_name in results:
        history.append({
            "run_id": str(run.id),
            "test_case_id": str(run.test_case_id),
            "test_name": test_name,
            "passed": run.passed,
            "expected_status": run.expected_status,
            "actual_status": run.actual_status,
            "response_time_ms": run.response_time_ms,
            "error": run.error,
            "assertion_results": run.assertion_results,
            "created_at": run.created_at,
        })

    return {
        "project_id": str(project_id),
        "total": total,
        "limit": limit,
        "offset": offset,
        "history": history,
    }

@router.get("/regressions")
def get_project_regressions(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Compare the two latest runs of each test case in a project."""

    get_owned_project(project_id, user, db)

    test_cases = db.scalars(
        select(APITestCase).where(
            APITestCase.project_id == project_id
        )
    ).all()

    regressions = []

    for test_case in test_cases:
        runs = db.scalars(
            select(APITestRun)
            .where(
                APITestRun.project_id == project_id,
                APITestRun.test_case_id == test_case.id,
            )
            .order_by(
                APITestRun.created_at.desc(),
                APITestRun.id.desc(),
            )
            .limit(2)
        ).all()

        if len(runs) < 2:
            continue

        latest, previous = runs[0], runs[1]
        reasons = []

        if previous.passed and not latest.passed:
            reasons.append("Test changed from PASS to FAIL")

        old_time = previous.response_time_ms
        new_time = latest.response_time_ms

        if old_time is not None and new_time is not None:
            increase = new_time - old_time

            if old_time > 0 and increase >= 100 and new_time >= old_time * 1.5:
                reasons.append(
                    "Response time increased by at least 50% and 100 ms"
                )

        if reasons:
            regressions.append({
                "test_case_id": str(test_case.id),
                "test_name": test_case.name,
                "latest_run_id": str(latest.id),
                "previous_run_id": str(previous.id),
                "latest_passed": latest.passed,
                "previous_passed": previous.passed,
                "previous_response_time_ms": previous.response_time_ms,
                "latest_response_time_ms": latest.response_time_ms,
                "reasons": reasons,
                "detected_at": latest.created_at,
            })

    return {
        "project_id": str(project_id),
        "regression_count": len(regressions),
        "regressions": regressions,
    }
