import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, ForeignKey, Integer, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class PublisherProfile(Base):
    """
    Profile information for publisher users.
    """

    __tablename__ = "publisher_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    platforms: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    followers_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    content_capabilities: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    personal_interests: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
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
