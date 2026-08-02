from sqlalchemy.orm import Session

from backend.app.models.business_profile import BusinessProfile
from backend.app.models.publisher_profile import PublisherProfile


def get_business_profile_by_user_id(
    db: Session,
    user_id,
):
    return (
        db.query(BusinessProfile)
        .filter(
            BusinessProfile.user_id == user_id
        )
        .first()
    )


def get_publisher_profile_by_user_id(
    db: Session,
    user_id,
):
    return (
        db.query(PublisherProfile)
        .filter(
            PublisherProfile.user_id == user_id
        )
        .first()
    )
