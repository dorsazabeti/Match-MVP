from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PackageDeliverable(BaseModel):
    model_config = ConfigDict(extra="forbid")

    media_plan_id: UUID
    platform_account_id: UUID
    platform: str
    content_type: str
    quantity: int = Field(ge=1, le=4)
    unit_price: Decimal = Field(gt=0)
    subtotal: Decimal = Field(gt=0)
    typical_views: int | None = Field(default=None, ge=0)


class PackageReward(BaseModel):
    model_config = ConfigDict(extra="forbid")

    offer_id: UUID
    reward_type: str
    offer_units: int = Field(ge=0)
    retail_value: Decimal | None
    cash_amount: Decimal | None
    total_reward_value: Decimal = Field(gt=0)


class FairValueBand(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lower: Decimal
    upper: Decimal
    widened: bool


class PackageCandidate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidate_id: str = Field(pattern=r"^pkg_[1-9][0-9]*$")
    platform: str
    deliverables: list[PackageDeliverable] = Field(min_length=1, max_length=3)
    total_items: int = Field(ge=1, le=6)
    total_media_value: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    value_ratio: Decimal = Field(gt=0)
    fair_value_band: FairValueBand
    deterministic_rank_score: Decimal = Field(ge=0, le=1)

    @field_validator("deliverables")
    @classmethod
    def distinct_content_types(
        cls,
        value: list[PackageDeliverable],
    ) -> list[PackageDeliverable]:
        types = [item.content_type for item in value]
        if len(types) != len(set(types)):
            raise ValueError("Package content types must be distinct")
        if len({item.platform for item in value}) != 1:
            raise ValueError("A package must use one platform")
        return value


class PackageSelectionOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    candidate_id: str = Field(pattern=r"^pkg_[1-9][0-9]*$")
    reason: str = Field(min_length=1, max_length=180)
    confidence: float = Field(ge=0, le=1)
    risk_flags: list[str] = Field(max_length=5)

    @field_validator("reason")
    @classmethod
    def compact_reason(cls, value: str) -> str:
        return " ".join(value.strip().split())


class PackageSelectionMeta(BaseModel):
    model_config = ConfigDict(extra="forbid")

    method: Literal["LLM", "DETERMINISTIC_FALLBACK"]
    reason: str
    confidence: float = Field(ge=0, le=1)
    risk_flags: list[str]
    prompt_version: str
    model: str


class ExchangePackage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: Literal["exchange-package-v1"]
    candidate_id: str
    goal: str
    platform: str
    deliverables: list[PackageDeliverable]
    total_items: int
    total_media_value: Decimal
    currency: str
    reward: PackageReward
    value_ratio: Decimal
    fair_value_band: FairValueBand
    selection: PackageSelectionMeta
