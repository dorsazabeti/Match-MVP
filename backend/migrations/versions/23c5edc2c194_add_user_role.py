"""add user role

Revision ID: 23c5edc2c194
Revises: 1b3833305a85
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "23c5edc2c194"
down_revision: Union[str, Sequence[str], None] = "1b3833305a85"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add role column without forcing a role assignment.
    """

    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """
    Remove role column.
    """

    op.drop_column(
        "users",
        "role",
    )
