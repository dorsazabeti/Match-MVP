"""make user role nullable

Revision ID: fedfa7107d8e
Revises: 23c5edc2c194
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fedfa7107d8e"
down_revision: Union[str, Sequence[str], None] = "23c5edc2c194"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Allow users to exist before selecting a role.
    """

    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=20),
        nullable=True,
    )


def downgrade() -> None:
    """
    Make role required again.
    """

    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(length=20),
        nullable=False,
    )
