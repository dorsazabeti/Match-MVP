from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_db
from backend.app.services.user_service import register_user


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
