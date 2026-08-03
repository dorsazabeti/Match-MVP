from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    display_name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=72,
    )


class RegisterResponse(BaseModel):
    id: str
    display_name: str | None
    email: str
    status: str
    role: str | None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=72,
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    display_name: str | None
    email: str
    status: str
    role: str | None
