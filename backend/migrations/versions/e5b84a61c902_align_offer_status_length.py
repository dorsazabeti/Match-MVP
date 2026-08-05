"""align Offer status column length

Revision ID: e5b84a61c902
Revises: d4f0a9c21b73
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5b84a61c902"
down_revision: Union[str, Sequence[str], None] = "d4f0a9c21b73"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "offers",
        "status",
        existing_type=sa.String(length=30),
        type_=sa.String(length=20),
        existing_nullable=False,
        existing_server_default="ACTIVE",
    )


def downgrade() -> None:
    op.alter_column(
        "offers",
        "status",
        existing_type=sa.String(length=20),
        type_=sa.String(length=30),
        existing_nullable=False,
        existing_server_default="ACTIVE",
    )
