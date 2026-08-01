from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_db
from backend.app.core.security.jwt import create_access_token
from backend.app.services.user_service import (
    register_user,
    authenticate_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    id: str
    email: str
    status: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new user.
    """

    try:
        user = register_user(
            db=db,
            email=request.email,
            password=request.password,
        )

        return {
            "id": str(user.id),
            "email": user.email,
            "status": user.status,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT token.
    """

    user = authenticate_user(
        db=db,
        email=request.email,
        password=request.password,
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
    user_id=str(user.id),
)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
