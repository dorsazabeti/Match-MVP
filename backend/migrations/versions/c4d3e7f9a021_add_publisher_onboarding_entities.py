"""add publisher onboarding entities

Revision ID: c4d3e7f9a021
Revises: a6c9d3f2b817
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d3e7f9a021"
down_revision: Union[str, Sequence[str], None] = "a6c9d3f2b817"
branch_labels = None
depends_on = None


CATEGORY_ROWS = [
    {
        "id": "10000000-0000-4000-8000-000000000001",
        "name": "غذا و رستوران",
        "slug": "food",
    },
    {
        "id": "10000000-0000-4000-8000-000000000002",
        "name": "سفر و گردشگری",
        "slug": "travel",
    },
    {
        "id": "10000000-0000-4000-8000-000000000003",
        "name": "زیبایی و مراقبت شخصی",
        "slug": "beauty",
    },
    {
        "id": "10000000-0000-4000-8000-000000000004",
        "name": "مد و پوشاک",
        "slug": "fashion",
    },
    {
        "id": "10000000-0000-4000-8000-000000000005",
        "name": "فناوری",
        "slug": "technology",
    },
    {
        "id": "10000000-0000-4000-8000-000000000006",
        "name": "بازی و سرگرمی",
        "slug": "gaming",
    },
    {
        "id": "10000000-0000-4000-8000-000000000007",
        "name": "ورزش و تناسب اندام",
        "slug": "fitness",
    },
    {
        "id": "10000000-0000-4000-8000-000000000008",
        "name": "آموزش",
        "slug": "education",
    },
    {
        "id": "10000000-0000-4000-8000-000000000009",
        "name": "مالی و کسب‌وکار",
        "slug": "finance",
    },
    {
        "id": "10000000-0000-4000-8000-000000000010",
        "name": "خانه و دکوراسیون",
        "slug": "home",
    },
    {
        "id": "10000000-0000-4000-8000-000000000011",
        "name": "والدین و کودک",
        "slug": "parenting",
    },
    {
        "id": "10000000-0000-4000-8000-000000000012",
        "name": "فرهنگ و سرگرمی",
        "slug": "entertainment",
    },
]


def upgrade() -> None:
    op.add_column(
        "publisher_profiles",
        sa.Column("public_name", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "publisher_profiles",
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "publisher_profiles",
        sa.Column(
            "discoverable",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "publisher_profiles",
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="ACTIVE",
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_publisher_profiles_status",
        "publisher_profiles",
        "status IN ('ACTIVE', 'BLOCKED')",
    )

    op.execute(
        """
        UPDATE publisher_profiles AS publisher
        SET public_name = users.display_name
        FROM users
        WHERE publisher.user_id = users.id
          AND users.display_name IS NOT NULL
          AND btrim(users.display_name) <> ''
        """
    )

    categories = op.create_table(
        "categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("parent_id", sa.UUID(), nullable=True),
        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.text("true"),
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
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"])
    op.bulk_insert(categories, CATEGORY_ROWS)

    op.create_table(
        "platform_accounts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("publisher_id", sa.UUID(), nullable=False),
        sa.Column("platform", sa.String(length=30), nullable=False),
        sa.Column("handle", sa.String(length=120), nullable=False),
        sa.Column("profile_url", sa.String(length=500), nullable=False),
        sa.Column("followers_count", sa.Integer(), nullable=False),
        sa.Column(
            "verification_status",
            sa.String(length=20),
            server_default="UNVERIFIED",
            nullable=False,
        ),
        sa.Column(
            "verification_evidence_url",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="ACTIVE",
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
            "followers_count >= 0",
            name="ck_platform_accounts_followers_non_negative",
        ),
        sa.CheckConstraint(
            "platform IN ('INSTAGRAM', 'TELEGRAM', 'YOUTUBE', "
            "'RUBIKA', 'BALE', 'EITAA', 'OTHER')",
            name="ck_platform_accounts_platform",
        ),
        sa.CheckConstraint(
            "verification_status IN "
            "('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')",
            name="ck_platform_accounts_verification_status",
        ),
        sa.CheckConstraint(
            "status IN ('ACTIVE', 'INACTIVE')",
            name="ck_platform_accounts_status",
        ),
        sa.ForeignKeyConstraint(
            ["publisher_id"],
            ["publisher_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "publisher_id",
            "platform",
            "handle",
            name="uq_platform_accounts_publisher_platform_handle",
        ),
    )
    op.create_index(
        "ix_platform_accounts_publisher_status",
        "platform_accounts",
        ["publisher_id", "status"],
    )
    op.create_index(
        "ix_platform_accounts_platform_status",
        "platform_accounts",
        ["platform", "status"],
    )

    op.create_table(
        "media_plans",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("publisher_id", sa.UUID(), nullable=False),
        sa.Column("platform_account_id", sa.UUID(), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("price", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column(
            "currency",
            sa.String(length=3),
            server_default="IRR",
            nullable=False,
        ),
        sa.Column("typical_views", sa.Integer(), nullable=True),
        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.text("true"),
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
            "content_type IN "
            "('POST', 'STORY', 'REEL', 'VIDEO', 'SHORT_VIDEO', 'LIVE', 'UGC')",
            name="ck_media_plans_content_type",
        ),
        sa.CheckConstraint(
            "price > 0",
            name="ck_media_plans_price_positive",
        ),
        sa.CheckConstraint(
            "typical_views IS NULL OR typical_views >= 0",
            name="ck_media_plans_typical_views_non_negative",
        ),
        sa.ForeignKeyConstraint(
            ["platform_account_id"],
            ["platform_accounts.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["publisher_id"],
            ["publisher_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_media_plans_publisher_active",
        "media_plans",
        ["publisher_id", "active"],
    )
    op.create_index(
        "uq_media_plans_active_combination",
        "media_plans",
        ["publisher_id", "platform_account_id", "content_type"],
        unique=True,
        postgresql_where=sa.text("active = true"),
    )

    op.create_table(
        "publisher_interests",
        sa.Column("publisher_id", sa.UUID(), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["publisher_id"],
            ["publisher_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("publisher_id", "category_id"),
    )

    op.create_table(
        "publisher_capabilities",
        sa.Column("publisher_id", sa.UUID(), nullable=False),
        sa.Column("capability", sa.String(length=30), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "capability IN "
            "('REVIEW', 'TUTORIAL', 'UGC', 'NEWS', 'LIFESTYLE', "
            "'UNBOXING', 'INTERVIEW')",
            name="ck_publisher_capabilities_capability",
        ),
        sa.ForeignKeyConstraint(
            ["publisher_id"],
            ["publisher_profiles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("publisher_id", "capability"),
    )


def downgrade() -> None:
    op.drop_table("publisher_capabilities")
    op.drop_table("publisher_interests")
    op.drop_index(
        "uq_media_plans_active_combination",
        table_name="media_plans",
        postgresql_where=sa.text("active = true"),
    )
    op.drop_index(
        "ix_media_plans_publisher_active",
        table_name="media_plans",
    )
    op.drop_table("media_plans")
    op.drop_index(
        "ix_platform_accounts_platform_status",
        table_name="platform_accounts",
    )
    op.drop_index(
        "ix_platform_accounts_publisher_status",
        table_name="platform_accounts",
    )
    op.drop_table("platform_accounts")
    op.drop_index("ix_categories_slug", table_name="categories")
    op.drop_table("categories")
    op.drop_constraint(
        "ck_publisher_profiles_status",
        "publisher_profiles",
        type_="check",
    )
    op.drop_column("publisher_profiles", "status")
    op.drop_column("publisher_profiles", "discoverable")
    op.drop_column("publisher_profiles", "avatar_url")
    op.drop_column("publisher_profiles", "public_name")
