from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.schemas.publisher_onboarding import PlatformValue


class PromotionGoal(StrEnum):
    AWARENESS = "AWARENESS"
    ENGAGEMENT = "ENGAGEMENT"
    CONTENT = "CONTENT"
    TRAFFIC = "TRAFFIC"
    SALES = "SALES"


class PromotionStatus(StrEnum):
    GENERATING = "GENERATING"
    READY = "READY"
    PAUSED = "PAUSED"
    FILLED = "FILLED"
    EXPIRED = "EXPIRED"


class RecommendationStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    INVITED = "INVITED"
    DISMISSED = "DISMISSED"
    UNAVAILABLE = "UNAVAILABLE"


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


class PromotionCreate(BaseModel):
    goal: PromotionGoal
    target_city: str | None = Field(default=None, max_length=100)
    preferred_platforms: list[PlatformValue] = Field(default_factory=list)
    desired_deals: int = Field(ge=1, le=100)
    invitation_expiry_hours: int = Field(default=72, ge=1, le=168)
    content_deadline_days: int = Field(default=7, ge=1, le=90)
    brief: str | None = Field(default=None, max_length=2000)

    @field_validator("target_city", "brief")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("preferred_platforms")
    @classmethod
    def unique_platforms(
        cls,
        value: list[PlatformValue],
    ) -> list[PlatformValue]:
        if len(set(value)) != len(value):
            raise ValueError("Preferred platforms must be unique")
        return value


class PromotionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    offer_id: UUID
    goal: PromotionGoal
    target_city: str | None
    preferred_platforms: list[PlatformValue]
    desired_deals: int
    active_deals_count: int
    invitation_expiry_hours: int
    content_deadline_days: int
    brief: str | None
    status: PromotionStatus
    recommendation_count: int
    created_at: datetime
    updated_at: datetime


class PromotionListResponse(BaseModel):
    items: list[PromotionResponse]
    total: int


class RecommendationPlatformResponse(BaseModel):
    platform: PlatformValue
    handle: str
    followers_count: int
    verification_status: str


class RecommendationMediaPlanResponse(BaseModel):
    id: UUID
    platform: PlatformValue
    content_type: str
    price: Decimal
    currency: str
    typical_views: int | None


class RecommendationResponse(BaseModel):
    id: UUID
    promotion_id: UUID
    publisher_id: UUID
    publisher_public_name: str
    publisher_city: str
    publisher_bio: str | None
    publisher_avatar_url: str | None
    platforms: list[RecommendationPlatformResponse]
    best_media_plan: RecommendationMediaPlanResponse
    score: Decimal
    factors: dict
    package: dict | None
    explanation: str
    confidence: Decimal
    status: RecommendationStatus
    created_at: datetime


class RecommendationListResponse(BaseModel):
    items: list[RecommendationResponse]
    total: int


class SelectOptionResponse(BaseModel):
    value: str
    label: str


class PromotionOptionsResponse(BaseModel):
    goals: list[SelectOptionResponse]
    platforms: list[SelectOptionResponse]
    default_invitation_expiry_hours: int
    default_content_deadline_days: int
    maximum_cash_deals: int
