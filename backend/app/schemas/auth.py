from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """
    Data required to create a new user.
    """

    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    """
    Data returned after successful registration.
    """

    id: str
    email: str
    status: str


class LoginRequest(BaseModel):
    """
    User login credentials.
    """

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """
    JWT token response.
    """

    access_token: str
    token_type: str


class UserResponse(BaseModel):
    """
    Public user information.
    """

    id: str
    email: str
    status: str
