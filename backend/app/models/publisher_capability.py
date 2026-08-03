import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class PublisherCapability(Base):
    """A format or style the publisher can credibly deliver."""

    __tablename__ = "publisher_capabilities"
    __table_args__ = (
        CheckConstraint(
            "capability IN "
            "('REVIEW', 'TUTORIAL', 'UGC', 'NEWS', 'LIFESTYLE', "
            "'UNBOXING', 'INTERVIEW')",
            name="ck_publisher_capabilities_capability",
        ),
    )

    publisher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("publisher_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    capability: Mapped[str] = mapped_column(
        String(30),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
