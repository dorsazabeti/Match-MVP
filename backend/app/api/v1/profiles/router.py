from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.dependencies import (
    get_db,
    get_current_user,
)

from backend.app.models.user import User

from backend.app.schemas.business import (
    BusinessProfileCreate,
    BusinessProfileResponse,
)

from backend.app.schemas.publisher import (
    PublisherProfileCreate,
    PublisherProfileResponse,
)
from backend.app.services.profile_service import (
    create_business_profile,
    create_publisher_profile,
    get_business_profile,
    get_publisher_profile,
)


router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"],
)


@router.post(
    "/business",
    response_model=BusinessProfileResponse,
)
def create_business(
    request: BusinessProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        profile = create_business_profile(
            db,
            current_user,
            request.model_dump(),
        )

        return profile

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post(
    "/publisher",
    response_model=PublisherProfileResponse,
)
def create_publisher(
    request: PublisherProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        profile = create_publisher_profile(
            db,
            current_user,
            request.model_dump(),
        )

        return profile

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
@router.get(
    "/business/me",
    response_model=BusinessProfileResponse,
)
def get_my_business_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_business_profile(
            db,
            current_user,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get(
    "/publisher/me",
    response_model=PublisherProfileResponse,
)
def get_my_publisher_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_publisher_profile(
            db,
            current_user,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )