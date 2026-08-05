import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Promotion(Base):
    """A time-bound request to match one active Offer with publishers."""

    __tablename__ = "promotions"
    __table_args__ = (
        CheckConstraint(
            "goal IN ('AWARENESS', 'ENGAGEMENT', 'CONTENT', 'TRAFFIC', 'SALES')",
            name="ck_promotions_goal",
        ),
        CheckConstraint(
            "status IN ('GENERATING', 'READY', 'PAUSED', 'FILLED', 'EXPIRED')",
            name="ck_promotions_status",
        ),
        CheckConstraint(
            "desired_deals BETWEEN 1 AND 100",
            name="ck_promotions_desired_deals",
        ),
        CheckConstraint(
            "active_deals_count >= 0 AND active_deals_count <= desired_deals",
            name="ck_promotions_active_deals_count",
        ),
        CheckConstraint(
            "invitation_expiry_hours BETWEEN 1 AND 168",
            name="ck_promotions_invitation_expiry_hours",
        ),
        CheckConstraint(
            "content_deadline_days BETWEEN 1 AND 90",
            name="ck_promotions_content_deadline_days",
        ),
        Index("ix_promotions_business_status", "business_id", "status"),
        Index("ix_promotions_offer_status", "offer_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("business_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    offer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("offers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    goal: Mapped[str] = mapped_column(String(30), nullable=False)
    target_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_platforms: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    desired_deals: Mapped[int] = mapped_column(Integer, nullable=False)
    active_deals_count: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    invitation_expiry_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    content_deadline_days: Mapped[int] = mapped_column(Integer, nullable=False)
    brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="GENERATING", server_default="GENERATING", nullable=False
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

    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="promotion",
        cascade="all, delete-orphan",
        order_by="Recommendation.score.desc()",
    )
