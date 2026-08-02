from uuid import UUID

from pydantic import BaseModel


class PublisherProfileCreate(BaseModel):
    bio: str | None = None
    city: str | None = None
    platforms: dict | None = None
    followers_count: int | None = None
    content_capabilities: dict | None = None
    personal_interests: dict | None = None


class PublisherProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    bio: str | None
    city: str | None
    platforms: dict | None
    followers_count: int | None
    content_capabilities: dict | None
    personal_interests: dict | None

    class Config:
        from_attributes = True
