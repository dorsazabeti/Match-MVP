import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base


class Recommendation(Base):
    """Persisted deterministic publisher ranking for a Promotion."""

    __tablename__ = "recommendations"
    __table_args__ = (
        UniqueConstraint(
            "promotion_id",
            "publisher_id",
            name="uq_recommendations_promotion_publisher",
        ),
        CheckConstraint(
            "score >= 0 AND score <= 100",
            name="ck_recommendations_score_range",
        ),
        CheckConstraint(
            "confidence >= 0 AND confidence <= 1",
            name="ck_recommendations_confidence_range",
        ),
        CheckConstraint(
            "status IN ('AVAILABLE', 'INVITED', 'DISMISSED', 'UNAVAILABLE')",
            name="ck_recommendations_status",
        ),
        Index("ix_recommendations_promotion_score", "promotion_id", "score"),
        Index("ix_recommendations_publisher_status", "publisher_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    promotion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("promotions.id", ondelete="CASCADE"),
        nullable=False,
    )
    publisher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("publisher_profiles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    factors_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    package_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Decimal] = mapped_column(Numeric(4, 3), nullable=False)
    ai_log_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_logs.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="AVAILABLE", server_default="AVAILABLE", nullable=False
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

    promotion: Mapped["Promotion"] = relationship(
        "Promotion", back_populates="recommendations"
    )
