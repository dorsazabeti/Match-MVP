from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InvitationCreate(BaseModel):
    message: str | None = None


class InvitationResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: UUID

    recommendation_id: UUID

    publisher_id: UUID

    business_id: UUID

    package_snapshot: dict

    message: str | None

    status: str

    expires_at: datetime

    created_at: datetime


class InvitationListResponse(BaseModel):
    items: list[InvitationResponse]
    total: int
