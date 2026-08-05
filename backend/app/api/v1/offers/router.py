from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.offer import (
    OfferCreate,
    OfferImageResponse,
    OfferListResponse,
    OfferOptionsResponse,
    OfferResponse,
    OfferStatus,
    OfferUpdate,
)
from backend.app.services.offer_service import (
    attach_offer_image,
    create_business_offer,
    get_business_offer,
    get_offer_options,
    list_business_offers,
    remove_offer_image,
    require_business,
    transition_offer,
    update_business_offer,
)
from backend.app.services.storage_service import (
    remove_uploaded_file,
    save_offer_image,
)


router = APIRouter(prefix="/offers", tags=["Offers"])


def _raise_domain_error(error: Exception) -> None:
    if isinstance(error, PermissionError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(error, LookupError):
        status_code = status.HTTP_404_NOT_FOUND
    else:
        status_code = status.HTTP_400_BAD_REQUEST
    raise HTTPException(status_code=status_code, detail=str(error)) from error


@router.get("/options", response_model=OfferOptionsResponse)
def offer_options(db: Session = Depends(get_db)):
    settings = get_settings()
    return get_offer_options(db, settings.publisher_currency)


@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    request: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return create_business_offer(db, business, request.model_dump())
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get("", response_model=OfferListResponse)
def get_my_offers(
    offer_status: OfferStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        items = list_business_offers(
            db,
            business,
            offer_status.value if offer_status else None,
        )
        return {"items": items, "total": len(items)}
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get("/me", response_model=list[OfferResponse], deprecated=True)
def get_my_offers_legacy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compatibility route for the first Day 4 prototype."""
    try:
        business = require_business(db, current_user)
        return list_business_offers(db, business)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return get_business_offer(db, business, offer_id)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.patch("/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: UUID,
    request: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return update_business_offer(
            db, business, offer_id, request.model_dump()
        )
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.post("/{offer_id}/pause", response_model=OfferResponse)
def pause_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return transition_offer(db, business, offer_id, "PAUSED")
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.post("/{offer_id}/activate", response_model=OfferResponse)
def activate_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return transition_offer(db, business, offer_id, "ACTIVE")
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.post("/{offer_id}/expire", response_model=OfferResponse)
def expire_offer(
    offer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        return transition_offer(db, business, offer_id, "EXPIRED")
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)


@router.post(
    "/{offer_id}/images",
    response_model=OfferImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_offer_image(
    offer_id: UUID,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    storage_path: str | None = None
    try:
        business = require_business(db, current_user)
        get_business_offer(db, business, offer_id)
        storage_path = await save_offer_image(image)
        return attach_offer_image(db, business, offer_id, storage_path)
    except (PermissionError, LookupError, ValueError) as error:
        if storage_path:
            remove_uploaded_file(storage_path)
        _raise_domain_error(error)
    except Exception:
        if storage_path:
            remove_uploaded_file(storage_path)
        raise
    finally:
        await image.close()


@router.delete(
    "/{offer_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_offer_image(
    offer_id: UUID,
    image_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        business = require_business(db, current_user)
        storage_path = remove_offer_image(db, business, offer_id, image_id)
        remove_uploaded_file(storage_path)
    except (PermissionError, LookupError, ValueError) as error:
        _raise_domain_error(error)
