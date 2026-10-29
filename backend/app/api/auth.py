
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from itsdangerous import BadSignature, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

SESSION_SALT = "traceiq-session-v1"
CSRF_COOKIE = "traceiq_csrf"
serializer = URLSafeTimedSerializer(settings.auth_secret_key, salt=SESSION_SALT)


def _set_session(response: Response, user: User) -> None:
    session_value = serializer.dumps(
        {"user_id": str(user.id), "nonce": secrets.token_urlsafe(16)}
    )
    response.set_cookie(
        settings.auth_cookie_name,
        session_value,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.auth_session_hours * 3600,
        path="/",
    )

    csrf_value = secrets.token_urlsafe(32)
    response.set_cookie(
        CSRF_COOKIE,
        csrf_value,
        httponly=False,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=settings.auth_session_hours * 3600,
        path="/",
    )


def _clear_session(response: Response) -> None:
    response.delete_cookie(settings.auth_cookie_name, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    session_value = request.cookies.get(settings.auth_cookie_name)
    if not session_value:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = serializer.loads(
            session_value,
            max_age=settings.auth_session_hours * 3600,
        )
        user_id = payload.get("user_id")
    except (BadSignature, TypeError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is unavailable")

    return user


def require_csrf(request: Request) -> None:
    cookie_value = request.cookies.get(CSRF_COOKIE)
    header_value = request.headers.get("X-CSRF-Token")

    if (
        not cookie_value
        or not header_value
        or not secrets.compare_digest(cookie_value, header_value)
    ):
        raise HTTPException(status_code=403, detail="CSRF validation failed")


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_session(response, user)
    return user


@router.post("/login", response_model=UserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()
    user = db.scalar(select(User).where(User.email == email))

    if (
        user is None
        or not user.is_active
        or user.password_hash is None
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _set_session(response, user)
    return user


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    _user: User = Depends(get_current_user),
    _csrf: None = Depends(require_csrf),
):
    _clear_session(response)
    return response
