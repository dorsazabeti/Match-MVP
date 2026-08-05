"""complete Offer inventory schema

Revision ID: d4f0a9c21b73
Revises: 749df1271d9e
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4f0a9c21b73"
down_revision: Union[str, Sequence[str], None] = "749df1271d9e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_offers_status", "offers", type_="check")
    op.drop_constraint("ck_offers_budget_positive", "offers", type_="check")
    op.drop_index("ix_offers_category_status", table_name="offers")

    op.add_column("offers", sa.Column("reward_type", sa.String(20), nullable=True))
    op.add_column("offers", sa.Column("retail_value", sa.Numeric(14, 2)))
    op.add_column("offers", sa.Column("cash_amount", sa.Numeric(14, 2)))
    op.add_column(
        "offers",
        sa.Column("units_per_deal", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "offers",
        sa.Column(
            "available_quantity", sa.Integer(), server_default="0", nullable=False
        ),
    )
    op.add_column(
        "offers",
        sa.Column(
            "reserved_quantity", sa.Integer(), server_default="0", nullable=False
        ),
    )
    op.add_column("offers", sa.Column("fulfillment_notes", sa.Text()))
    op.add_column(
        "offers",
        sa.Column(
            "remotely_fulfillable",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column("offers", sa.Column("expires_at", sa.DateTime(timezone=True)))

    # Preserve the two prototype Offers as valid cash Offers.
    op.execute(
        """
        UPDATE offers
        SET reward_type = 'CASH',
            cash_amount = COALESCE(budget, 1),
            description = COALESCE(NULLIF(btrim(description), ''), 'بدون توضیح'),
            status = CASE
                WHEN status IN ('COMPLETED', 'CANCELLED') THEN 'EXPIRED'
                ELSE 'ACTIVE'
            END
        """
    )
    op.alter_column("offers", "reward_type", nullable=False)
    op.alter_column("offers", "description", nullable=False)

    op.drop_column("offers", "platform")
    op.drop_column("offers", "content_type")
    op.drop_column("offers", "budget")
    op.drop_column("offers", "city")

    op.create_check_constraint(
        "ck_offers_reward_type",
        "offers",
        "reward_type IN ('PRODUCT', 'SERVICE', 'CASH', 'HYBRID')",
    )
    op.create_check_constraint(
        "ck_offers_status",
        "offers",
        "status IN ('ACTIVE', 'PAUSED', 'EXPIRED')",
    )
    op.create_check_constraint(
        "ck_offers_retail_value_positive",
        "offers",
        "retail_value IS NULL OR retail_value > 0",
    )
    op.create_check_constraint(
        "ck_offers_cash_amount_positive",
        "offers",
        "cash_amount IS NULL OR cash_amount > 0",
    )
    op.create_check_constraint(
        "ck_offers_units_per_deal_non_negative",
        "offers",
        "units_per_deal >= 0",
    )
    op.create_check_constraint(
        "ck_offers_quantities_non_negative",
        "offers",
        "available_quantity >= 0 AND reserved_quantity >= 0",
    )
    op.create_check_constraint(
        "ck_offers_reward_components",
        "offers",
        "(reward_type = 'CASH' AND cash_amount IS NOT NULL "
        "AND units_per_deal = 0 AND available_quantity = 0 "
        "AND reserved_quantity = 0) OR "
        "(reward_type IN ('PRODUCT', 'SERVICE') "
        "AND retail_value IS NOT NULL AND cash_amount IS NULL "
        "AND units_per_deal > 0) OR "
        "(reward_type = 'HYBRID' AND retail_value IS NOT NULL "
        "AND cash_amount IS NOT NULL AND units_per_deal > 0)",
    )
    op.create_index(
        "ix_offers_category_status_expires",
        "offers",
        ["category_id", "status", "expires_at"],
    )

    op.create_table(
        "offer_images",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("offer_id", sa.UUID(), nullable=False),
        sa.Column("storage_path", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "offer_id", "sort_order", name="uq_offer_images_sort_order"
        ),
    )


def downgrade() -> None:
    op.drop_table("offer_images")
    op.drop_index("ix_offers_category_status_expires", table_name="offers")
    op.drop_constraint("ck_offers_reward_components", "offers", type_="check")
    op.drop_constraint("ck_offers_quantities_non_negative", "offers", type_="check")
    op.drop_constraint(
        "ck_offers_units_per_deal_non_negative", "offers", type_="check"
    )
    op.drop_constraint("ck_offers_cash_amount_positive", "offers", type_="check")
    op.drop_constraint("ck_offers_retail_value_positive", "offers", type_="check")
    op.drop_constraint("ck_offers_reward_type", "offers", type_="check")
    op.drop_constraint("ck_offers_status", "offers", type_="check")

    op.add_column("offers", sa.Column("platform", sa.String(50)))
    op.add_column("offers", sa.Column("content_type", sa.String(50)))
    op.add_column("offers", sa.Column("budget", sa.Numeric(14, 2)))
    op.add_column("offers", sa.Column("city", sa.String(100)))
    op.execute(
        """
        UPDATE offers
        SET platform = 'INSTAGRAM',
            content_type = 'POST',
            budget = COALESCE(cash_amount, retail_value, 1),
            status = 'DRAFT'
        """
    )
    op.alter_column("offers", "platform", nullable=False)
    op.alter_column("offers", "content_type", nullable=False)

    op.drop_column("offers", "expires_at")
    op.drop_column("offers", "remotely_fulfillable")
    op.drop_column("offers", "fulfillment_notes")
    op.drop_column("offers", "reserved_quantity")
    op.drop_column("offers", "available_quantity")
    op.drop_column("offers", "units_per_deal")
    op.drop_column("offers", "cash_amount")
    op.drop_column("offers", "retail_value")
    op.drop_column("offers", "reward_type")

    op.create_check_constraint(
        "ck_offers_status",
        "offers",
        "status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')",
    )
    op.create_check_constraint(
        "ck_offers_budget_positive", "offers", "budget IS NULL OR budget > 0"
    )
    op.create_index(
        "ix_offers_category_status", "offers", ["category_id", "status"]
    )
