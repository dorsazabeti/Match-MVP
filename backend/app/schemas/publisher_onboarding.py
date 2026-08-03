from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated
from urllib.parse import urlparse
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class PlatformValue(StrEnum):
    INSTAGRAM = "INSTAGRAM"
    TELEGRAM = "TELEGRAM"
    YOUTUBE = "YOUTUBE"
    RUBIKA = "RUBIKA"
    BALE = "BALE"
    EITAA = "EITAA"
    OTHER = "OTHER"


class ContentTypeValue(StrEnum):
    POST = "POST"
    STORY = "STORY"
    REEL = "REEL"
    VIDEO = "VIDEO"
    SHORT_VIDEO = "SHORT_VIDEO"
    LIVE = "LIVE"
    UGC = "UGC"


class CapabilityValue(StrEnum):
    REVIEW = "REVIEW"
    TUTORIAL = "TUTORIAL"
    UGC = "UGC"
    NEWS = "NEWS"
    LIFESTYLE = "LIFESTYLE"
    UNBOXING = "UNBOXING"
    INTERVIEW = "INTERVIEW"


class PlatformAccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class VerificationStatus(StrEnum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


def _normalize_text(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise ValueError("This field cannot be blank")
    return normalized


def _normalize_http_url(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("A valid HTTP or HTTPS URL is required")
    return normalized


class PublisherProfileUpdate(BaseModel):
    public_name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, min_length=2, max_length=1000)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("public_name", "bio", "city")
    @classmethod
    def normalize_profile_text(cls, value: str | None) -> str | None:
        return _normalize_text(value) if value is not None else None

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None) -> str | None:
        return _normalize_http_url(value)

    @model_validator(mode="after")
    def require_at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one profile field is required")
        return self


class PlatformAccountCreate(BaseModel):
    platform: PlatformValue
    handle: str = Field(min_length=1, max_length=120)
    profile_url: str = Field(min_length=8, max_length=500)
    followers_count: int = Field(ge=0)
    verification_evidence_url: str | None = Field(default=None, max_length=500)

    @field_validator("handle")
    @classmethod
    def normalize_handle(cls, value: str) -> str:
        normalized = value.strip().lstrip("@").lower()
        if not normalized:
            raise ValueError("Handle cannot be blank")
        return normalized

    @field_validator("profile_url", "verification_evidence_url")
    @classmethod
    def validate_urls(cls, value: str | None) -> str | None:
        return _normalize_http_url(value)


class PlatformAccountUpdate(BaseModel):
    platform: PlatformValue | None = None
    handle: str | None = Field(default=None, min_length=1, max_length=120)
    profile_url: str | None = Field(default=None, min_length=8, max_length=500)
    followers_count: int | None = Field(default=None, ge=0)
    verification_evidence_url: str | None = Field(default=None, max_length=500)
    status: PlatformAccountStatus | None = None

    @field_validator("handle")
    @classmethod
    def normalize_handle(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lstrip("@").lower()
        if not normalized:
            raise ValueError("Handle cannot be blank")
        return normalized

    @field_validator("profile_url", "verification_evidence_url")
    @classmethod
    def validate_urls(cls, value: str | None) -> str | None:
        return _normalize_http_url(value)

    @model_validator(mode="after")
    def require_at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one account field is required")
        return self


class PlatformAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    publisher_id: UUID
    platform: PlatformValue
    handle: str
    profile_url: str
    followers_count: int
    verification_status: VerificationStatus
    verification_evidence_url: str | None
    status: PlatformAccountStatus
    created_at: datetime
    updated_at: datetime


PriceValue = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2)]


class MediaPlanCreate(BaseModel):
    platform_account_id: UUID
    content_type: ContentTypeValue
    price: PriceValue
    typical_views: int | None = Field(default=None, ge=0)


class MediaPlanUpdate(BaseModel):
    platform_account_id: UUID | None = None
    content_type: ContentTypeValue | None = None
    price: PriceValue | None = None
    typical_views: int | None = Field(default=None, ge=0)
    active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one media-plan field is required")
        return self


class MediaPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    publisher_id: UUID
    platform_account_id: UUID
    content_type: ContentTypeValue
    price: Decimal
    currency: str
    typical_views: int | None
    active: bool
    created_at: datetime
    updated_at: datetime


class CategoryOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str


class SelectOptionResponse(BaseModel):
    value: str
    label: str


class PublisherOnboardingOptionsResponse(BaseModel):
    platforms: list[SelectOptionResponse]
    content_types: list[SelectOptionResponse]
    capabilities: list[SelectOptionResponse]
    categories: list[CategoryOptionResponse]
    currency: str


class PublisherInterestsUpdate(BaseModel):
    category_ids: list[UUID] = Field(min_length=3)

    @field_validator("category_ids")
    @classmethod
    def reject_duplicate_categories(cls, value: list[UUID]) -> list[UUID]:
        if len(set(value)) != len(value):
            raise ValueError("Interest categories must be unique")
        return value


class PublisherInterestsResponse(BaseModel):
    categories: list[CategoryOptionResponse]


class PublisherCapabilitiesUpdate(BaseModel):
    capabilities: list[CapabilityValue] = Field(min_length=1)

    @field_validator("capabilities")
    @classmethod
    def reject_duplicate_capabilities(
        cls,
        value: list[CapabilityValue],
    ) -> list[CapabilityValue]:
        if len(set(value)) != len(value):
            raise ValueError("Capabilities must be unique")
        return value


class PublisherCapabilitiesResponse(BaseModel):
    capabilities: list[CapabilityValue]


class PublisherOnboardingStatusResponse(BaseModel):
    profile_exists: bool
    base_profile_complete: bool
    active_platform_accounts: int
    active_media_plans: int
    interests_count: int
    capabilities_count: int
    discoverable: bool
    next_step: str
    missing_requirements: list[str]
