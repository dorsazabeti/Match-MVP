"""add AI selection logs and recommendation reference

Revision ID: ab92e517cd30
Revises: f1c7b2d93a44
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ab92e517cd30"
down_revision: Union[str, Sequence[str], None] = "f1c7b2d93a44"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("purpose", sa.String(80), nullable=False),
        sa.Column("prompt_version", sa.String(80), nullable=False),
        sa.Column("model", sa.String(120), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("input_tokens", sa.Integer()),
        sa.Column("output_tokens", sa.Integer()),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("fallback_used", sa.Boolean(), nullable=False),
        sa.Column("error_code", sa.String(80)),
        sa.Column("result_json", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_logs_request_hash", "ai_logs", ["request_hash"])
    op.create_foreign_key(
        "fk_recommendations_ai_log_id",
        "recommendations",
        "ai_logs",
        ["ai_log_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_recommendations_ai_log_id",
        "recommendations",
        type_="foreignkey",
    )
    op.drop_index("ix_ai_logs_request_hash", table_name="ai_logs")
    op.drop_table("ai_logs")
