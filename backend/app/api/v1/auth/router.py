from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.dependencies import (
    get_db,
    get_current_user,
)

from backend.app.core.exceptions import (
    UserAlreadyExists,
    InvalidCredentials,
)

from backend.app.core.security.password import (
    verify_password,
)

from backend.app.core.security.jwt import (
    create_access_token,
)

from backend.app.models.user import User

from backend.app.repositories.user_repository import (
    get_user_by_email,
)

from backend.app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

from backend.app.services.user_service import (
    register_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = register_user(
            db=db,
            email=request.email,
            password=request.password,
        )

        return RegisterResponse(
            id=str(user.id),
            email=user.email,
            status=user.status,
            role=user.role,
        )

    except UserAlreadyExists as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    try:
        user = get_user_by_email(
            db,
            request.email,
        )

        if not user:
            raise InvalidCredentials()

        if not verify_password(
            request.password,
            user.password_hash,
        ):
            raise InvalidCredentials()

    except InvalidCredentials:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        str(user.id),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        status=current_user.status,
        role=current_user.role,
    )