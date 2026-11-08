
import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send a password-reset email using Resend."""
    if not settings.resend_api_key:
        logger.error("Resend API key is not configured.")
        return False

    try:
        resend.api_key = settings.resend_api_key

        resend.Emails.send(
            {
                "from": settings.resend_from_email,
                "to": [to_email],
                "subject": "Reset your TraceIQ password",
                "html": f"""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
                      <h2>Reset your TraceIQ password</h2>
                      <p>We received a request to reset the password for your account.</p>
                      <p>
                        <a href="{reset_url}"
                           style="display:inline-block;padding:12px 20px;background:#059669;
                                  color:#ffffff;text-decoration:none;border-radius:8px">
                          Reset password
                        </a>
                      </p>
                      <p>This link expires in {settings.password_reset_minutes} minutes
                         and can only be used once.</p>
                      <p>If you didn't request this, you can ignore this email.</p>
                    </div>
                """,
            }
        )
        return True
    except Exception:
        logger.exception("Password-reset email delivery failed.")
        return False
