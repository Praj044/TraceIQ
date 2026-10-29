from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class APIEndpoint(Base):
    __tablename__ = "api_endpoints"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    path: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
    )

    method: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    operation_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    parameters: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )

    tags: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_api_endpoints_project_id", "project_id"),
    )
