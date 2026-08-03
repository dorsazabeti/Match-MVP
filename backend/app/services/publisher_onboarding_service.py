from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.media_plan import MediaPlan
from backend.app.models.platform_account import PlatformAccount
from backend.app.models.publisher_profile import PublisherProfile
from backend.app.models.user import User
from backend.app.repositories import publisher_onboarding_repository as repository
from backend.app.schemas.publisher_onboarding import (
    CapabilityValue,
    ContentTypeValue,
    PlatformValue,
    PublisherOnboardingStatusResponse,
)


class PublisherOnboardingConflictError(ValueError):
    """A unique active publisher resource already exists."""


PLATFORM_LABELS = {
    PlatformValue.INSTAGRAM: "اینستاگرام",
    PlatformValue.TELEGRAM: "تلگرام",
    PlatformValue.YOUTUBE: "یوتیوب",
    PlatformValue.RUBIKA: "روبیکا",
    PlatformValue.BALE: "بله",
    PlatformValue.EITAA: "ایتا",
    PlatformValue.OTHER: "سایر",
}

CONTENT_TYPE_LABELS = {
    ContentTypeValue.POST: "پست",
    ContentTypeValue.STORY: "استوری",
    ContentTypeValue.REEL: "ریلز",
    ContentTypeValue.VIDEO: "ویدئو",
    ContentTypeValue.SHORT_VIDEO: "ویدئوی کوتاه",
    ContentTypeValue.LIVE: "لایو",
    ContentTypeValue.UGC: "محتوای UGC",
}

CAPABILITY_LABELS = {
    CapabilityValue.REVIEW: "نقد و بررسی",
    CapabilityValue.TUTORIAL: "آموزش",
    CapabilityValue.UGC: "تولید محتوای UGC",
    CapabilityValue.NEWS: "خبر و اطلاع‌رسانی",
    CapabilityValue.LIFESTYLE: "سبک زندگی",
    CapabilityValue.UNBOXING: "آنباکسینگ",
    CapabilityValue.INTERVIEW: "مصاحبه",
}


def _require_publisher_role(user: User) -> None:
    if user.role != "PUBLISHER":
        raise PermissionError(
            "Only publisher users can manage publisher onboarding"
        )


def _get_profile_or_raise(
    db: Session,
    user: User,
) -> PublisherProfile:
    _require_publisher_role(user)
    profile = repository.get_publisher_profile_by_user_id(
        db,
        user.id,
    )
    if profile is None:
        raise LookupError("Publisher profile not found")
    return profile


def _base_profile_complete(profile: PublisherProfile) -> bool:
    return all(
        isinstance(value, str) and bool(value.strip())
        for value in (
            profile.public_name,
            profile.bio,
            profile.city,
        )
    )


def _build_status(
    db: Session,
    profile: PublisherProfile | None,
) -> PublisherOnboardingStatusResponse:
    if profile is None:
        return PublisherOnboardingStatusResponse(
            profile_exists=False,
            base_profile_complete=False,
            active_platform_accounts=0,
            active_media_plans=0,
            interests_count=0,
            capabilities_count=0,
            discoverable=False,
            next_step="PROFILE",
            missing_requirements=["PROFILE"],
        )

    platform_count = repository.count_active_platform_accounts(
        db,
        profile.id,
    )
    media_plan_count = repository.count_active_media_plans(
        db,
        profile.id,
    )
    interests_count = repository.count_publisher_interests(
        db,
        profile.id,
    )
    capabilities_count = repository.count_publisher_capabilities(
        db,
        profile.id,
    )
    base_complete = _base_profile_complete(profile)

    missing: list[str] = []
    if not base_complete:
        missing.append("PROFILE")
    if platform_count < 1:
        missing.append("PLATFORM_ACCOUNT")
    if media_plan_count < 1:
        missing.append("MEDIA_PLAN")
    if interests_count < 3:
        missing.append("INTERESTS")
    if capabilities_count < 1:
        missing.append("CAPABILITIES")

    discoverable = profile.status == "ACTIVE" and not missing

    if not base_complete:
        next_step = "PROFILE"
    elif platform_count < 1:
        next_step = "PLATFORM_ACCOUNTS"
    elif media_plan_count < 1:
        next_step = "MEDIA_PLANS"
    elif interests_count < 3 or capabilities_count < 1:
        next_step = "PREFERENCES"
    else:
        next_step = "COMPLETE"

    return PublisherOnboardingStatusResponse(
        profile_exists=True,
        base_profile_complete=base_complete,
        active_platform_accounts=platform_count,
        active_media_plans=media_plan_count,
        interests_count=interests_count,
        capabilities_count=capabilities_count,
        discoverable=discoverable,
        next_step=next_step,
        missing_requirements=missing,
    )


def _sync_discoverability(
    db: Session,
    profile: PublisherProfile,
) -> PublisherOnboardingStatusResponse:
    db.flush()
    status = _build_status(db, profile)
    profile.discoverable = status.discoverable
    db.flush()
    return status


def get_onboarding_options(
    db: Session,
    user: User,
) -> dict:
    _require_publisher_role(user)
    settings = get_settings()
    return {
        "platforms": [
            {"value": item.value, "label": PLATFORM_LABELS[item]}
            for item in PlatformValue
        ],
        "content_types": [
            {"value": item.value, "label": CONTENT_TYPE_LABELS[item]}
            for item in ContentTypeValue
        ],
        "capabilities": [
            {"value": item.value, "label": CAPABILITY_LABELS[item]}
            for item in CapabilityValue
        ],
        "categories": repository.list_active_categories(db),
        "currency": settings.publisher_currency.upper(),
    }


def get_onboarding_status(
    db: Session,
    user: User,
) -> PublisherOnboardingStatusResponse:
    _require_publisher_role(user)
    profile = repository.get_publisher_profile_by_user_id(
        db,
        user.id,
    )
    return _build_status(db, profile)


def update_publisher_profile(
    db: Session,
    user: User,
    data: dict,
) -> PublisherProfile:
    profile = _get_profile_or_raise(db, user)
    for field, value in data.items():
        setattr(profile, field, value)

    try:
        _sync_discoverability(db, profile)
        db.commit()
        db.refresh(profile)
        return profile
    except Exception:
        db.rollback()
        raise


def list_platform_accounts(
    db: Session,
    user: User,
) -> list[PlatformAccount]:
    profile = _get_profile_or_raise(db, user)
    return repository.list_platform_accounts(db, profile.id)


def create_platform_account(
    db: Session,
    user: User,
    data: dict,
) -> PlatformAccount:
    profile = _get_profile_or_raise(db, user)
    existing = repository.find_platform_account_by_identity(
        db,
        profile.id,
        data["platform"],
        data["handle"],
    )
    if existing and existing.status == "ACTIVE":
        raise PublisherOnboardingConflictError(
            "This platform account already exists"
        )

    if existing:
        for field, value in data.items():
            setattr(existing, field, value)
        existing.status = "ACTIVE"
        account = existing
    else:
        account = repository.create_platform_account(
            db,
            profile.id,
            data,
        )

    try:
        _sync_discoverability(db, profile)
        db.commit()
        db.refresh(account)
        return account
    except IntegrityError as error:
        db.rollback()
        raise PublisherOnboardingConflictError(
            "This platform account already exists"
        ) from error
    except Exception:
        db.rollback()
        raise


def update_platform_account(
    db: Session,
    user: User,
    account_id: UUID,
    data: dict,
) -> PlatformAccount:
    profile = _get_profile_or_raise(db, user)
    account = repository.get_platform_account(
        db,
        profile.id,
        account_id,
    )
    if account is None:
        raise LookupError("Platform account not found")

    platform = data.get("platform", account.platform)
    handle = data.get("handle", account.handle)
    duplicate = repository.find_platform_account_by_identity(
        db,
        profile.id,
        platform,
        handle,
    )
    if duplicate is not None and duplicate.id != account.id:
        raise PublisherOnboardingConflictError(
            "This platform account already exists"
        )

    for field, value in data.items():
        setattr(account, field, value)
    if account.status == "INACTIVE":
        repository.deactivate_media_plans_for_account(
            db,
            profile.id,
            account.id,
        )

    try:
        _sync_discoverability(db, profile)
        db.commit()
        db.refresh(account)
        return account
    except IntegrityError as error:
        db.rollback()
        raise PublisherOnboardingConflictError(
            "This platform account already exists"
        ) from error
    except Exception:
        db.rollback()
        raise


def deactivate_platform_account(
    db: Session,
    user: User,
    account_id: UUID,
) -> None:
    profile = _get_profile_or_raise(db, user)
    account = repository.get_platform_account(
        db,
        profile.id,
        account_id,
    )
    if account is None:
        raise LookupError("Platform account not found")

    account.status = "INACTIVE"
    repository.deactivate_media_plans_for_account(
        db,
        profile.id,
        account.id,
    )
    try:
        _sync_discoverability(db, profile)
        db.commit()
    except Exception:
        db.rollback()
        raise


def list_media_plans(
    db: Session,
    user: User,
) -> list[MediaPlan]:
    profile = _get_profile_or_raise(db, user)
    return repository.list_media_plans(db, profile.id)


def _require_active_owned_account(
    db: Session,
    publisher_id: UUID,
    account_id: UUID,
) -> PlatformAccount:
    account = repository.get_platform_account(
        db,
        publisher_id,
        account_id,
    )
    if account is None:
        raise LookupError("Platform account not found")
    if account.status != "ACTIVE":
        raise ValueError("Platform account must be active")
    return account


def create_media_plan(
    db: Session,
    user: User,
    data: dict,
) -> MediaPlan:
    profile = _get_profile_or_raise(db, user)
    _require_active_owned_account(
        db,
        profile.id,
        data["platform_account_id"],
    )
    duplicate = repository.find_active_media_plan(
        db,
        profile.id,
        data["platform_account_id"],
        data["content_type"],
    )
    if duplicate:
        raise PublisherOnboardingConflictError(
            "An active media plan already exists for this content type"
        )

    data["currency"] = get_settings().publisher_currency.upper()
    media_plan = repository.create_media_plan(
        db,
        profile.id,
        data,
    )
    try:
        _sync_discoverability(db, profile)
        db.commit()
        db.refresh(media_plan)
        return media_plan
    except IntegrityError as error:
        db.rollback()
        raise PublisherOnboardingConflictError(
            "An active media plan already exists for this content type"
        ) from error
    except Exception:
        db.rollback()
        raise


def update_media_plan(
    db: Session,
    user: User,
    media_plan_id: UUID,
    data: dict,
) -> MediaPlan:
    profile = _get_profile_or_raise(db, user)
    media_plan = repository.get_media_plan(
        db,
        profile.id,
        media_plan_id,
    )
    if media_plan is None:
        raise LookupError("Media plan not found")

    account_id = data.get(
        "platform_account_id",
        media_plan.platform_account_id,
    )
    if data.get("active", media_plan.active):
        _require_active_owned_account(db, profile.id, account_id)

    content_type = data.get("content_type", media_plan.content_type)
    if data.get("active", media_plan.active):
        duplicate = repository.find_active_media_plan(
            db,
            profile.id,
            account_id,
            content_type,
            exclude_id=media_plan.id,
        )
        if duplicate:
            raise PublisherOnboardingConflictError(
                "An active media plan already exists for this content type"
            )

    for field, value in data.items():
        setattr(media_plan, field, value)

    try:
        _sync_discoverability(db, profile)
        db.commit()
        db.refresh(media_plan)
        return media_plan
    except IntegrityError as error:
        db.rollback()
        raise PublisherOnboardingConflictError(
            "An active media plan already exists for this content type"
        ) from error
    except Exception:
        db.rollback()
        raise


def deactivate_media_plan(
    db: Session,
    user: User,
    media_plan_id: UUID,
) -> None:
    profile = _get_profile_or_raise(db, user)
    media_plan = repository.get_media_plan(
        db,
        profile.id,
        media_plan_id,
    )
    if media_plan is None:
        raise LookupError("Media plan not found")

    media_plan.active = False
    try:
        _sync_discoverability(db, profile)
        db.commit()
    except Exception:
        db.rollback()
        raise


def get_publisher_interests(
    db: Session,
    user: User,
) -> list:
    profile = _get_profile_or_raise(db, user)
    return repository.list_publisher_interest_categories(
        db,
        profile.id,
    )


def replace_publisher_interests(
    db: Session,
    user: User,
    category_ids: list[UUID],
) -> list:
    profile = _get_profile_or_raise(db, user)
    categories = repository.get_active_categories_by_ids(
        db,
        category_ids,
    )
    if len(categories) != len(category_ids):
        raise ValueError("One or more interest categories are invalid")

    repository.replace_publisher_interests(
        db,
        profile.id,
        category_ids,
    )
    try:
        _sync_discoverability(db, profile)
        db.commit()
        return repository.list_publisher_interest_categories(
            db,
            profile.id,
        )
    except Exception:
        db.rollback()
        raise


def get_publisher_capabilities(
    db: Session,
    user: User,
) -> list[str]:
    profile = _get_profile_or_raise(db, user)
    return repository.list_publisher_capabilities(
        db,
        profile.id,
    )


def replace_publisher_capabilities(
    db: Session,
    user: User,
    capabilities: list[str],
) -> list[str]:
    profile = _get_profile_or_raise(db, user)
    repository.replace_publisher_capabilities(
        db,
        profile.id,
        capabilities,
    )
    try:
        _sync_discoverability(db, profile)
        db.commit()
        return repository.list_publisher_capabilities(
            db,
            profile.id,
        )
    except Exception:
        db.rollback()
        raise
