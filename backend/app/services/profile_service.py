from backend.app.repositories.profile_repository import (
    get_business_profile_by_user_id,
    get_publisher_profile_by_user_id,
)
from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.models.business_profile import BusinessProfile
from backend.app.models.publisher_profile import PublisherProfile


def assign_user_role(
    db: Session,
    user: User,
    role: str,
):
    """
    Assign role after onboarding selection.
    """

    user.role = role

    db.commit()
    db.refresh(user)

    return user


def create_business_profile(
    db: Session,
    user: User,
    data: dict,
):
    """
    Create business profile for business users.
    """

    if user.role != "BUSINESS":
        raise ValueError(
            "Only business users can create business profiles"
        )

    existing_profile = (
        db.query(BusinessProfile)
        .filter(
            BusinessProfile.user_id == user.id
        )
        .first()
    )

    if existing_profile:
        raise ValueError(
            "Business profile already exists"
        )

    profile = BusinessProfile(
        user_id=user.id,
        **data,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def create_publisher_profile(
    db: Session,
    user: User,
    data: dict,
):
    """
    Create publisher profile for publisher users.
    """

    if user.role != "PUBLISHER":
        raise ValueError(
            "Only publisher users can create publisher profiles"
        )

    existing_profile = (
        db.query(PublisherProfile)
        .filter(
            PublisherProfile.user_id == user.id
        )
        .first()
    )

    if existing_profile:
        raise ValueError(
            "Publisher profile already exists"
        )

    profile = PublisherProfile(
        user_id=user.id,
        **data,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile
def get_business_profile(
    db: Session,
    user: User,
):
    """
    Get business profile for current user.
    """

    if user.role != "BUSINESS":
        raise ValueError(
            "Only business users have business profiles"
        )

    profile = get_business_profile_by_user_id(
        db,
        user.id,
    )

    if not profile:
        raise ValueError(
            "Business profile not found"
        )

    return profile


def get_publisher_profile(
    db: Session,
    user: User,
):
    """
    Get publisher profile for current user.
    """

    if user.role != "PUBLISHER":
        raise ValueError(
            "Only publisher users have publisher profiles"
        )

    profile = get_publisher_profile_by_user_id(
        db,
        user.id,
    )

    if not profile:
        raise ValueError(
            "Publisher profile not found"
        )

    return profile
