from uuid import UUID

from pydantic import BaseModel, EmailStr


class BusinessProfileCreate(BaseModel):
    name: str
    category: str
    description: str | None = None
    city: str | None = None
    logo_url: str | None = None
    contact_phone: str | None = None
    contact_email: EmailStr | None = None


class BusinessProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    category: str
    description: str | None
    city: str | None
    logo_url: str | None
    contact_phone: str | None
    contact_email: str | None

    class Config:
        from_attributes = True
