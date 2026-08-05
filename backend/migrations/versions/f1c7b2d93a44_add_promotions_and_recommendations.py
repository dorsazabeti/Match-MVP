"""add promotions and recommendations

Revision ID: f1c7b2d93a44
Revises: e5b84a61c902
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1c7b2d93a44"
down_revision: Union[str, Sequence[str], None] = "e5b84a61c902"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "promotions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("business_id", sa.UUID(), nullable=False),
        sa.Column("offer_id", sa.UUID(), nullable=False),
        sa.Column("goal", sa.String(30), nullable=False),
        sa.Column("target_city", sa.String(100)),
        sa.Column("preferred_platforms", sa.JSON(), nullable=False),
        sa.Column("desired_deals", sa.Integer(), nullable=False),
        sa.Column(
            "active_deals_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column("invitation_expiry_hours", sa.Integer(), nullable=False),
        sa.Column("content_deadline_days", sa.Integer(), nullable=False),
        sa.Column("brief", sa.Text()),
        sa.Column(
            "status",
            sa.String(20),
            server_default="GENERATING",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "goal IN ('AWARENESS', 'ENGAGEMENT', 'CONTENT', 'TRAFFIC', 'SALES')",
            name="ck_promotions_goal",
        ),
        sa.CheckConstraint(
            "status IN ('GENERATING', 'READY', 'PAUSED', 'FILLED', 'EXPIRED')",
            name="ck_promotions_status",
        ),
        sa.CheckConstraint(
            "desired_deals BETWEEN 1 AND 100",
            name="ck_promotions_desired_deals",
        ),
        sa.CheckConstraint(
            "active_deals_count >= 0 AND active_deals_count <= desired_deals",
            name="ck_promotions_active_deals_count",
        ),
        sa.CheckConstraint(
            "invitation_expiry_hours BETWEEN 1 AND 168",
            name="ck_promotions_invitation_expiry_hours",
        ),
        sa.CheckConstraint(
            "content_deadline_days BETWEEN 1 AND 90",
            name="ck_promotions_content_deadline_days",
        ),
        sa.ForeignKeyConstraint(
            ["business_id"], ["business_profiles.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["offer_id"], ["offers.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_promotions_business_status",
        "promotions",
        ["business_id", "status"],
    )
    op.create_index(
        "ix_promotions_offer_status",
        "promotions",
        ["offer_id", "status"],
    )

    op.create_table(
        "recommendations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("promotion_id", sa.UUID(), nullable=False),
        sa.Column("publisher_id", sa.UUID(), nullable=False),
        sa.Column("score", sa.Numeric(5, 2), nullable=False),
        sa.Column("factors_json", sa.JSON(), nullable=False),
        sa.Column("package_json", sa.JSON()),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=False),
        sa.Column("ai_log_id", sa.UUID()),
        sa.Column(
            "status",
            sa.String(20),
            server_default="AVAILABLE",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "score >= 0 AND score <= 100",
            name="ck_recommendations_score_range",
        ),
        sa.CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="ck_recommendations_confidence_range",
        ),
        sa.CheckConstraint(
            "status IN ('AVAILABLE', 'INVITED', 'DISMISSED', 'UNAVAILABLE')",
            name="ck_recommendations_status",
        ),
        sa.ForeignKeyConstraint(
            ["promotion_id"], ["promotions.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["publisher_id"], ["publisher_profiles.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "promotion_id",
            "publisher_id",
            name="uq_recommendations_promotion_publisher",
        ),
    )
    op.create_index(
        "ix_recommendations_promotion_score",
        "recommendations",
        ["promotion_id", "score"],
    )
    op.create_index(
        "ix_recommendations_publisher_status",
        "recommendations",
        ["publisher_id", "status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_recommendations_publisher_status", table_name="recommendations"
    )
    op.drop_index(
        "ix_recommendations_promotion_score", table_name="recommendations"
    )
    op.drop_table("recommendations")
    op.drop_index("ix_promotions_offer_status", table_name="promotions")
    op.drop_index("ix_promotions_business_status", table_name="promotions")
    op.drop_table("promotions")
