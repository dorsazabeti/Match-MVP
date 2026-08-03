import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class PlatformAccount(Base):
    """One publisher-owned social account or channel."""

    __tablename__ = "platform_accounts"
    __table_args__ = (
        UniqueConstraint(
            "publisher_id",
            "platform",
            "handle",
            name="uq_platform_accounts_publisher_platform_handle",
        ),
        CheckConstraint(
            "followers_count >= 0",
            name="ck_platform_accounts_followers_non_negative",
        ),
        CheckConstraint(
            "platform IN ('INSTAGRAM', 'TELEGRAM', 'YOUTUBE', "
            "'RUBIKA', 'BALE', 'EITAA', 'OTHER')",
            name="ck_platform_accounts_platform",
        ),
        CheckConstraint(
            "verification_status IN "
            "('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')",
            name="ck_platform_accounts_verification_status",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'INACTIVE')",
            name="ck_platform_accounts_status",
        ),
        Index(
            "ix_platform_accounts_publisher_status",
            "publisher_id",
            "status",
        ),
        Index(
            "ix_platform_accounts_platform_status",
            "platform",
            "status",
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
    platform: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )
    handle: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )
    profile_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    followers_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    verification_status: Mapped[str] = mapped_column(
        String(20),
        default="UNVERIFIED",
        server_default="UNVERIFIED",
        nullable=False,
    )
    verification_evidence_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        server_default="ACTIVE",
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
