import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class MediaPlan(Base):
    """Publisher rate for one deliverable on one platform account."""

    __tablename__ = "media_plans"
    __table_args__ = (
        CheckConstraint(
            "content_type IN "
            "('POST', 'STORY', 'REEL', 'VIDEO', 'SHORT_VIDEO', 'LIVE', 'UGC')",
            name="ck_media_plans_content_type",
        ),
        CheckConstraint(
            "price > 0",
            name="ck_media_plans_price_positive",
        ),
        CheckConstraint(
            "typical_views IS NULL OR typical_views >= 0",
            name="ck_media_plans_typical_views_non_negative",
        ),
        Index(
            "ix_media_plans_publisher_active",
            "publisher_id",
            "active",
        ),
        Index(
            "uq_media_plans_active_combination",
            "publisher_id",
            "platform_account_id",
            "content_type",
            unique=True,
            postgresql_where=text("active = true"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    publisher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("publisher_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("platform_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    content_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="IRR",
        server_default="IRR",
        nullable=False,
    )
    typical_views: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
