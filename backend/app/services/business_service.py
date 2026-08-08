from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.models.business_profile import BusinessProfile


def require_business(
    db: Session,
    user: User,
) -> BusinessProfile:

    business = (
        db.query(BusinessProfile)
        .filter(
            BusinessProfile.user_id == user.id
        )
        .first()
    )

    if business is None:
        raise PermissionError(
            "Business profile required"
        )

    return business
