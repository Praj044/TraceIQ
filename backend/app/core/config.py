from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TraceIQ"
    app_env: str = "development"
    database_url: str
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"

    # Authentication
    auth_secret_key: str = "development-only-change-me"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # OAuth credentials
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None

    auth_cookie_name: str = "traceiq_session"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    auth_session_hours: int = 24

    # Password recovery
    password_reset_minutes: int = 30
    password_reset_dev_link: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
