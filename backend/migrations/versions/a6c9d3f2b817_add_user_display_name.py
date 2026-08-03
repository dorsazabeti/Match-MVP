"""add user display name

Revision ID: a6c9d3f2b817
Revises: e1903711c333
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a6c9d3f2b817"
down_revision: Union[str, Sequence[str], None] = "e1903711c333"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "display_name",
            sa.String(length=120),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "users",
        "display_name",
    )
