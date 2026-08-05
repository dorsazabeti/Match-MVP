import uuid
from datetime import datetime

from sqlalchemy.orm import Session, selectinload

from backend.app.models.category import Category
from backend.app.models.offer import Offer
from backend.app.models.offer_image import OfferImage


def list_active_categories(db: Session) -> list[Category]:
    return (
        db.query(Category)
        .filter(Category.active.is_(True))
        .order_by(Category.name.asc())
        .all()
    )


def category_exists(db: Session, category_id: uuid.UUID) -> bool:
    return (
        db.query(Category.id)
        .filter(Category.id == category_id, Category.active.is_(True))
        .first()
        is not None
    )


def create_offer(db: Session, offer: Offer) -> Offer:
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return get_owned_offer(db, offer.business_id, offer.id)  # type: ignore[return-value]


def list_owned_offers(
    db: Session,
    business_id: uuid.UUID,
    status: str | None = None,
) -> list[Offer]:
    query = (
        db.query(Offer)
        .options(selectinload(Offer.images))
        .filter(Offer.business_id == business_id)
    )
    if status is not None:
        query = query.filter(Offer.status == status)
    return query.order_by(Offer.created_at.desc()).all()


def get_owned_offer(
    db: Session,
    business_id: uuid.UUID,
    offer_id: uuid.UUID,
) -> Offer | None:
    return (
        db.query(Offer)
        .options(selectinload(Offer.images))
        .filter(Offer.id == offer_id, Offer.business_id == business_id)
        .first()
    )


def expire_due_offers(
    db: Session,
    business_id: uuid.UUID,
    now: datetime,
) -> None:
    changed = (
        db.query(Offer)
        .filter(
            Offer.business_id == business_id,
            Offer.status.in_(["ACTIVE", "PAUSED"]),
            Offer.expires_at.is_not(None),
            Offer.expires_at <= now,
        )
        .update({Offer.status: "EXPIRED"}, synchronize_session=False)
    )
    if changed:
        db.commit()


def save_offer(db: Session, offer: Offer) -> Offer:
    db.commit()
    db.refresh(offer)
    return get_owned_offer(db, offer.business_id, offer.id)  # type: ignore[return-value]


def create_offer_image(
    db: Session,
    offer_id: uuid.UUID,
    storage_path: str,
    sort_order: int,
) -> OfferImage:
    image = OfferImage(
        offer_id=offer_id,
        storage_path=storage_path,
        sort_order=sort_order,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def delete_offer_image(db: Session, image: OfferImage) -> None:
    offer_id = image.offer_id
    db.delete(image)
    db.flush()
    remaining = (
        db.query(OfferImage)
        .filter(OfferImage.offer_id == offer_id)
        .order_by(OfferImage.sort_order.asc())
        .all()
    )
    for index, item in enumerate(remaining):
        item.sort_order = index
    db.commit()
