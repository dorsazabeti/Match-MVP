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
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Offer(Base):
    """Reusable reward inventory owned by one business."""

    __tablename__ = "offers"
    __table_args__ = (
        CheckConstraint(
            "reward_type IN ('PRODUCT', 'SERVICE', 'CASH', 'HYBRID')",
            name="ck_offers_reward_type",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'PAUSED', 'EXPIRED')",
            name="ck_offers_status",
        ),
        CheckConstraint(
            "retail_value IS NULL OR retail_value > 0",
            name="ck_offers_retail_value_positive",
        ),
        CheckConstraint(
            "cash_amount IS NULL OR cash_amount > 0",
            name="ck_offers_cash_amount_positive",
        ),
        CheckConstraint(
            "units_per_deal >= 0",
            name="ck_offers_units_per_deal_non_negative",
        ),
        CheckConstraint(
            "available_quantity >= 0 AND reserved_quantity >= 0",
            name="ck_offers_quantities_non_negative",
        ),
        CheckConstraint(
            "(reward_type = 'CASH' AND cash_amount IS NOT NULL "
            "AND units_per_deal = 0 AND available_quantity = 0 "
            "AND reserved_quantity = 0) OR "
            "(reward_type IN ('PRODUCT', 'SERVICE') "
            "AND retail_value IS NOT NULL AND cash_amount IS NULL "
            "AND units_per_deal > 0) OR "
            "(reward_type = 'HYBRID' AND retail_value IS NOT NULL "
            "AND cash_amount IS NOT NULL AND units_per_deal > 0)",
            name="ck_offers_reward_components",
        ),
        Index("ix_offers_business_status", "business_id", "status"),
        Index(
            "ix_offers_category_status_expires",
            "category_id",
            "status",
            "expires_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reward_type: Mapped[str] = mapped_column(String(20), nullable=False)
    retail_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    cash_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(
        String(3), default="IRR", server_default="IRR", nullable=False
    )
    units_per_deal: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    available_quantity: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    reserved_quantity: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    fulfillment_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    remotely_fulfillable: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", server_default="ACTIVE", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    images: Mapped[list["OfferImage"]] = relationship(
        "OfferImage",
        back_populates="offer",
        cascade="all, delete-orphan",
        order_by="OfferImage.sort_order",
    )
