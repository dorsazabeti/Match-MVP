from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.promotion import (
    PromotionCreate,
    PromotionListResponse,
    PromotionOptionsResponse,
    PromotionResponse,
    RecommendationListResponse,
)
from backend.app.services.promotion_service import (
    create_promotion_and_recommendations,
    get_promotion_options,
    get_promotion_response,
    list_promotions,
    list_recommendations,
)


router = APIRouter(tags=["Promotions"])


def _raise_domain_error(error: Exception) -> None:
    if isinstance(error, PermissionError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(error, LookupError):
        status_code = status.HTTP_404_NOT_FOUND
    else:
        status_code = status.HTTP_400_BAD_REQUEST
    raise HTTPException(status_code=status_code, detail=str(error)) from error


@router.get("/promotions/options", response_model=PromotionOptionsResponse)
def promotion_options():
    return get_promotion_options()


@router.post(
    "/offers/{offer_id}/promotions",
    response_model=PromotionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_promotion(
    offer_id: UUID,
    request: PromotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_promotion_and_recommendations(
            db,
            current_user,
            offer_id,
            request.model_dump(),
        )
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get("/promotions", response_model=PromotionListResponse)
def get_my_promotions(
    offer_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return list_promotions(db, current_user, offer_id)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
def get_promotion(
    promotion_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return get_promotion_response(db, current_user, promotion_id)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get(
    "/promotions/{promotion_id}/recommendations",
    response_model=RecommendationListResponse,
)
def get_recommendations(
    promotion_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return list_recommendations(db, current_user, promotion_id)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)
