from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.publisher import PublisherProfileResponse
from backend.app.schemas.publisher_onboarding import (
    MediaPlanCreate,
    MediaPlanResponse,
    MediaPlanUpdate,
    PlatformAccountCreate,
    PlatformAccountResponse,
    PlatformAccountUpdate,
    PublisherCapabilitiesResponse,
    PublisherCapabilitiesUpdate,
    PublisherInterestsResponse,
    PublisherInterestsUpdate,
    PublisherOnboardingOptionsResponse,
    PublisherOnboardingStatusResponse,
    PublisherProfileUpdate,
)
from backend.app.services import publisher_onboarding_service as service


router = APIRouter(
    prefix="/profiles/publisher",
    tags=["Publisher onboarding"],
)


def _raise_http_error(error: Exception) -> None:
    if isinstance(error, service.PublisherOnboardingConflictError):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(error, PermissionError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(error, LookupError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(error, ValueError):
        status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    else:
        raise error

    raise HTTPException(
        status_code=status_code,
        detail=str(error),
    ) from error


@router.get(
    "/onboarding-options",
    response_model=PublisherOnboardingOptionsResponse,
)
def get_onboarding_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_onboarding_options(db, current_user)
    except Exception as error:
        _raise_http_error(error)


@router.get(
    "/onboarding-status",
    response_model=PublisherOnboardingStatusResponse,
)
def get_onboarding_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_onboarding_status(db, current_user)
    except Exception as error:
        _raise_http_error(error)


@router.patch(
    "/me",
    response_model=PublisherProfileResponse,
)
def update_publisher_profile(
    request: PublisherProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_publisher_profile(
            db,
            current_user,
            request.model_dump(exclude_unset=True, mode="json"),
        )
    except Exception as error:
        _raise_http_error(error)


@router.get(
    "/platform-accounts",
    response_model=list[PlatformAccountResponse],
)
def list_platform_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_platform_accounts(db, current_user)
    except Exception as error:
        _raise_http_error(error)


@router.post(
    "/platform-accounts",
    response_model=PlatformAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_platform_account(
    request: PlatformAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_platform_account(
            db,
            current_user,
            request.model_dump(mode="json"),
        )
    except Exception as error:
        _raise_http_error(error)


@router.patch(
    "/platform-accounts/{account_id}",
    response_model=PlatformAccountResponse,
)
def update_platform_account(
    account_id: UUID,
    request: PlatformAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_platform_account(
            db,
            current_user,
            account_id,
            request.model_dump(exclude_unset=True, mode="json"),
        )
    except Exception as error:
        _raise_http_error(error)


@router.delete(
    "/platform-accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_platform_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.deactivate_platform_account(
            db,
            current_user,
            account_id,
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        _raise_http_error(error)


@router.get(
    "/media-plans",
    response_model=list[MediaPlanResponse],
)
def list_media_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.list_media_plans(db, current_user)
    except Exception as error:
        _raise_http_error(error)


@router.post(
    "/media-plans",
    response_model=MediaPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_media_plan(
    request: MediaPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.create_media_plan(
            db,
            current_user,
            request.model_dump(mode="json"),
        )
    except Exception as error:
        _raise_http_error(error)


@router.patch(
    "/media-plans/{media_plan_id}",
    response_model=MediaPlanResponse,
)
def update_media_plan(
    media_plan_id: UUID,
    request: MediaPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_media_plan(
            db,
            current_user,
            media_plan_id,
            request.model_dump(exclude_unset=True, mode="json"),
        )
    except Exception as error:
        _raise_http_error(error)


@router.delete(
    "/media-plans/{media_plan_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_media_plan(
    media_plan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service.deactivate_media_plan(
            db,
            current_user,
            media_plan_id,
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        _raise_http_error(error)


@router.get(
    "/interests",
    response_model=PublisherInterestsResponse,
)
def get_publisher_interests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return {
            "categories": service.get_publisher_interests(
                db,
                current_user,
            )
        }
    except Exception as error:
        _raise_http_error(error)


@router.put(
    "/interests",
    response_model=PublisherInterestsResponse,
)
def replace_publisher_interests(
    request: PublisherInterestsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return {
            "categories": service.replace_publisher_interests(
                db,
                current_user,
                request.category_ids,
            )
        }
    except Exception as error:
        _raise_http_error(error)


@router.get(
    "/capabilities",
    response_model=PublisherCapabilitiesResponse,
)
def get_publisher_capabilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return {
            "capabilities": service.get_publisher_capabilities(
                db,
                current_user,
            )
        }
    except Exception as error:
        _raise_http_error(error)


@router.put(
    "/capabilities",
    response_model=PublisherCapabilitiesResponse,
)
def replace_publisher_capabilities(
    request: PublisherCapabilitiesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return {
            "capabilities": service.replace_publisher_capabilities(
                db,
                current_user,
                [item.value for item in request.capabilities],
            )
        }
    except Exception as error:
        _raise_http_error(error)
