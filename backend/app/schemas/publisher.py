from uuid import UUID
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_required_text(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise ValueError("This field cannot be blank")
    return normalized


class PublisherProfileCreate(BaseModel):
    public_name: str = Field(min_length=2, max_length=120)
    bio: str = Field(min_length=2, max_length=1000)
    city: str = Field(min_length=2, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)

    # Kept during the Day 2 -> Day 3 migration. New clients use normalized
    # onboarding endpoints instead of these legacy JSON fields.
    platforms: dict | None = None
    followers_count: int | None = None
    content_capabilities: dict | None = None
    personal_interests: dict | None = None

    @field_validator("public_name", "bio", "city")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        return _normalize_required_text(value)

    @field_validator("avatar_url")
    @classmethod
    def normalize_avatar_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        parsed = urlparse(normalized)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("A valid HTTP or HTTPS URL is required")
        return normalized


class PublisherProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    public_name: str | None
    bio: str | None
    city: str | None
    avatar_url: str | None
    discoverable: bool
    status: str
    platforms: dict | None
    followers_count: int | None
    content_capabilities: dict | None
    personal_interests: dict | None
