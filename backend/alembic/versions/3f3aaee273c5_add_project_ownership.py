
"""add project ownership

Revision ID: 3f3aaee273c5
Revises: 5285dcc0aaed
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3f3aaee273c5"
down_revision: Union[str, Sequence[str], None] = "5285dcc0aaed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("owner_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        "ix_projects_owner_id",
        "projects",
        ["owner_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_projects_owner_id_users",
        "projects",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_projects_owner_id_users",
        "projects",
        type_="foreignkey",
    )
    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_column("projects", "owner_id")
