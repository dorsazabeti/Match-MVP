from datetime import datetime, timezone
from decimal import Decimal
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RewardType(StrEnum):
    PRODUCT = "PRODUCT"
    SERVICE = "SERVICE"
    CASH = "CASH"
    HYBRID = "HYBRID"


class OfferStatus(StrEnum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"


MoneyValue = Annotated[
    Decimal,
    Field(gt=0, max_digits=14, decimal_places=2),
]


def _normalize_text(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise ValueError("This field cannot be blank")
    return normalized


class OfferWriteBase(BaseModel):
    category_id: UUID
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=3000)
    reward_type: RewardType
    retail_value: MoneyValue | None = None
    cash_amount: MoneyValue | None = None
    currency: str = Field(default="IRR", min_length=3, max_length=3)
    units_per_deal: int = Field(default=0, ge=0)
    available_quantity: int = Field(default=0, ge=0)
    fulfillment_notes: str | None = Field(default=None, max_length=2000)
    remotely_fulfillable: bool = False
    expires_at: datetime | None = None

    @field_validator("title", "description")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        return _normalize_text(value)

    @field_validator("fulfillment_notes")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return _normalize_text(value)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("expires_at")
    @classmethod
    def require_future_expiry(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        normalized = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if normalized <= datetime.now(timezone.utc):
            raise ValueError("Expiry must be in the future")
        return normalized

    @model_validator(mode="after")
    def validate_reward_components(self):
        inventory_reward = self.reward_type in {
            RewardType.PRODUCT,
            RewardType.SERVICE,
            RewardType.HYBRID,
        }
        cash_reward = self.reward_type in {RewardType.CASH, RewardType.HYBRID}

        if inventory_reward:
            if self.retail_value is None:
                raise ValueError("Retail value is required for this reward type")
            if self.units_per_deal <= 0:
                raise ValueError("Units per deal must be greater than zero")
            if self.available_quantity < self.units_per_deal:
                raise ValueError("Quantity must cover at least one deal")
        elif self.units_per_deal != 0 or self.available_quantity != 0:
            raise ValueError("Cash Offers cannot contain inventory")

        if cash_reward and self.cash_amount is None:
            raise ValueError("Cash amount is required for this reward type")
        if not cash_reward and self.cash_amount is not None:
            raise ValueError("Cash amount is not allowed for this reward type")
        if self.reward_type == RewardType.CASH and self.retail_value is not None:
            raise ValueError("Retail value is not used for cash-only Offers")

        return self


class OfferCreate(OfferWriteBase):
    pass


class OfferUpdate(OfferWriteBase):
    """Full edit contract; the client always sends a complete editable Offer."""


class OfferImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    storage_path: str
    sort_order: int


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    category_id: UUID
    title: str
    description: str
    reward_type: RewardType
    retail_value: Decimal | None
    cash_amount: Decimal | None
    currency: str
    units_per_deal: int
    available_quantity: int
    reserved_quantity: int
    fulfillment_notes: str | None
    remotely_fulfillable: bool
    expires_at: datetime | None
    status: OfferStatus
    images: list[OfferImageResponse]
    created_at: datetime
    updated_at: datetime


class OfferListResponse(BaseModel):
    items: list[OfferResponse]
    total: int


class CategoryOptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str


class SelectOptionResponse(BaseModel):
    value: str
    label: str


class OfferOptionsResponse(BaseModel):
    reward_types: list[SelectOptionResponse]
    categories: list[CategoryOptionResponse]
    currency: str
    max_image_size_mb: int
