import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.app.models.business_profile import BusinessProfile
from backend.app.models.offer import Offer
from backend.app.models.offer_image import OfferImage
from backend.app.models.user import User
from backend.app.repositories.offer_repository import (
    category_exists,
    create_offer,
    create_offer_image,
    delete_offer_image,
    expire_due_offers,
    get_owned_offer,
    list_active_categories,
    list_owned_offers,
    save_offer,
)
from backend.app.repositories.profile_repository import (
    get_business_profile_by_user_id,
)


REWARD_TYPE_OPTIONS = [
    {"value": "PRODUCT", "label": "محصول"},
    {"value": "SERVICE", "label": "خدمت یا تجربه"},
    {"value": "CASH", "label": "پرداخت نقدی"},
    {"value": "HYBRID", "label": "ترکیبی"},
]


def require_business(db: Session, user: User) -> BusinessProfile:
    if user.role != "BUSINESS":
        raise PermissionError("Only business users can manage Offers")
    business = get_business_profile_by_user_id(db, user.id)
    if business is None:
        raise LookupError("Complete your business profile first")
    return business


def get_offer_options(db: Session, currency: str) -> dict:
    return {
        "reward_types": REWARD_TYPE_OPTIONS,
        "categories": list_active_categories(db),
        "currency": currency,
        "max_image_size_mb": 10,
    }


def _validate_category(db: Session, category_id: uuid.UUID) -> None:
    if not category_exists(db, category_id):
        raise ValueError("Selected category is not available")


def create_business_offer(
    db: Session,
    business: BusinessProfile,
    data: dict,
) -> Offer:
    _validate_category(db, data["category_id"])
    offer = Offer(
        business_id=business.id,
        reserved_quantity=0,
        status="ACTIVE",
        **data,
    )
    return create_offer(db, offer)


def list_business_offers(
    db: Session,
    business: BusinessProfile,
    status: str | None = None,
) -> list[Offer]:
    expire_due_offers(db, business.id, datetime.now(timezone.utc))
    return list_owned_offers(db, business.id, status)


def get_business_offer(
    db: Session,
    business: BusinessProfile,
    offer_id: uuid.UUID,
) -> Offer:
    expire_due_offers(db, business.id, datetime.now(timezone.utc))
    offer = get_owned_offer(db, business.id, offer_id)
    if offer is None:
        raise LookupError("Offer not found")
    return offer


def update_business_offer(
    db: Session,
    business: BusinessProfile,
    offer_id: uuid.UUID,
    data: dict,
) -> Offer:
    offer = get_business_offer(db, business, offer_id)
    if offer.status == "EXPIRED":
        raise ValueError("Expired Offers are read-only")
    _validate_category(db, data["category_id"])
    if offer.reserved_quantity > 0 and (
        data["reward_type"] != offer.reward_type
        or data["units_per_deal"] != offer.units_per_deal
    ):
        raise ValueError(
            "Reward type and units per deal cannot change while inventory is reserved"
        )

    for field, value in data.items():
        setattr(offer, field, value)
    return save_offer(db, offer)


def transition_offer(
    db: Session,
    business: BusinessProfile,
    offer_id: uuid.UUID,
    target_status: str,
) -> Offer:
    offer = get_business_offer(db, business, offer_id)
    allowed = {
        ("ACTIVE", "PAUSED"),
        ("PAUSED", "ACTIVE"),
        ("ACTIVE", "EXPIRED"),
        ("PAUSED", "EXPIRED"),
    }
    if (offer.status, target_status) not in allowed:
        raise ValueError(f"Offer cannot move from {offer.status} to {target_status}")
    if (
        target_status == "ACTIVE"
        and offer.expires_at is not None
        and offer.expires_at <= datetime.now(timezone.utc)
    ):
        raise ValueError("An expired Offer cannot be activated")
    offer.status = target_status
    return save_offer(db, offer)


def attach_offer_image(
    db: Session,
    business: BusinessProfile,
    offer_id: uuid.UUID,
    storage_path: str,
) -> OfferImage:
    offer = get_business_offer(db, business, offer_id)
    if len(offer.images) >= 5:
        raise ValueError("Each Offer can contain up to five images")
    next_order = max((image.sort_order for image in offer.images), default=-1) + 1
    return create_offer_image(db, offer.id, storage_path, next_order)


def remove_offer_image(
    db: Session,
    business: BusinessProfile,
    offer_id: uuid.UUID,
    image_id: uuid.UUID,
) -> str:
    offer = get_business_offer(db, business, offer_id)
    image = next((item for item in offer.images if item.id == image_id), None)
    if image is None:
        raise LookupError("Offer image not found")
    storage_path = image.storage_path
    delete_offer_image(db, image)
    return storage_path
