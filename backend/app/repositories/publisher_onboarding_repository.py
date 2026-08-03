from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from backend.app.models.category import Category
from backend.app.models.media_plan import MediaPlan
from backend.app.models.platform_account import PlatformAccount
from backend.app.models.publisher_capability import PublisherCapability
from backend.app.models.publisher_interest import PublisherInterest
from backend.app.models.publisher_profile import PublisherProfile


def get_publisher_profile_by_user_id(
    db: Session,
    user_id: UUID,
) -> PublisherProfile | None:
    return db.scalar(
        select(PublisherProfile).where(
            PublisherProfile.user_id == user_id
        )
    )


def list_platform_accounts(
    db: Session,
    publisher_id: UUID,
    *,
    include_inactive: bool = False,
) -> list[PlatformAccount]:
    statement = select(PlatformAccount).where(
        PlatformAccount.publisher_id == publisher_id
    )
    if not include_inactive:
        statement = statement.where(
            PlatformAccount.status == "ACTIVE"
        )
    return list(
        db.scalars(
            statement.order_by(PlatformAccount.created_at.asc())
        ).all()
    )


def get_platform_account(
    db: Session,
    publisher_id: UUID,
    account_id: UUID,
) -> PlatformAccount | None:
    return db.scalar(
        select(PlatformAccount).where(
            PlatformAccount.id == account_id,
            PlatformAccount.publisher_id == publisher_id,
        )
    )


def find_platform_account_by_identity(
    db: Session,
    publisher_id: UUID,
    platform: str,
    handle: str,
) -> PlatformAccount | None:
    return db.scalar(
        select(PlatformAccount).where(
            PlatformAccount.publisher_id == publisher_id,
            PlatformAccount.platform == platform,
            PlatformAccount.handle == handle,
        )
    )


def create_platform_account(
    db: Session,
    publisher_id: UUID,
    data: dict,
) -> PlatformAccount:
    account = PlatformAccount(
        publisher_id=publisher_id,
        **data,
    )
    db.add(account)
    return account


def deactivate_media_plans_for_account(
    db: Session,
    publisher_id: UUID,
    account_id: UUID,
) -> None:
    db.execute(
        update(MediaPlan)
        .where(
            MediaPlan.publisher_id == publisher_id,
            MediaPlan.platform_account_id == account_id,
            MediaPlan.active.is_(True),
        )
        .values(active=False)
    )


def list_media_plans(
    db: Session,
    publisher_id: UUID,
    *,
    include_inactive: bool = False,
) -> list[MediaPlan]:
    statement = select(MediaPlan).where(
        MediaPlan.publisher_id == publisher_id
    )
    if not include_inactive:
        statement = statement.where(MediaPlan.active.is_(True))
    return list(
        db.scalars(
            statement.order_by(MediaPlan.created_at.asc())
        ).all()
    )


def get_media_plan(
    db: Session,
    publisher_id: UUID,
    media_plan_id: UUID,
) -> MediaPlan | None:
    return db.scalar(
        select(MediaPlan).where(
            MediaPlan.id == media_plan_id,
            MediaPlan.publisher_id == publisher_id,
        )
    )


def find_active_media_plan(
    db: Session,
    publisher_id: UUID,
    platform_account_id: UUID,
    content_type: str,
    *,
    exclude_id: UUID | None = None,
) -> MediaPlan | None:
    statement = select(MediaPlan).where(
        MediaPlan.publisher_id == publisher_id,
        MediaPlan.platform_account_id == platform_account_id,
        MediaPlan.content_type == content_type,
        MediaPlan.active.is_(True),
    )
    if exclude_id is not None:
        statement = statement.where(MediaPlan.id != exclude_id)
    return db.scalar(statement)


def create_media_plan(
    db: Session,
    publisher_id: UUID,
    data: dict,
) -> MediaPlan:
    media_plan = MediaPlan(
        publisher_id=publisher_id,
        **data,
    )
    db.add(media_plan)
    return media_plan


def list_active_categories(db: Session) -> list[Category]:
    return list(
        db.scalars(
            select(Category)
            .where(Category.active.is_(True))
            .order_by(Category.name.asc())
        ).all()
    )


def get_active_categories_by_ids(
    db: Session,
    category_ids: Iterable[UUID],
) -> list[Category]:
    ids = list(category_ids)
    if not ids:
        return []
    return list(
        db.scalars(
            select(Category).where(
                Category.id.in_(ids),
                Category.active.is_(True),
            )
        ).all()
    )


def replace_publisher_interests(
    db: Session,
    publisher_id: UUID,
    category_ids: Iterable[UUID],
) -> None:
    db.execute(
        delete(PublisherInterest).where(
            PublisherInterest.publisher_id == publisher_id
        )
    )
    db.add_all(
        [
            PublisherInterest(
                publisher_id=publisher_id,
                category_id=category_id,
            )
            for category_id in category_ids
        ]
    )


def list_publisher_interest_categories(
    db: Session,
    publisher_id: UUID,
) -> list[Category]:
    return list(
        db.scalars(
            select(Category)
            .join(
                PublisherInterest,
                PublisherInterest.category_id == Category.id,
            )
            .where(PublisherInterest.publisher_id == publisher_id)
            .order_by(Category.name.asc())
        ).all()
    )


def replace_publisher_capabilities(
    db: Session,
    publisher_id: UUID,
    capabilities: Iterable[str],
) -> None:
    db.execute(
        delete(PublisherCapability).where(
            PublisherCapability.publisher_id == publisher_id
        )
    )
    db.add_all(
        [
            PublisherCapability(
                publisher_id=publisher_id,
                capability=capability,
            )
            for capability in capabilities
        ]
    )


def list_publisher_capabilities(
    db: Session,
    publisher_id: UUID,
) -> list[str]:
    return list(
        db.scalars(
            select(PublisherCapability.capability)
            .where(PublisherCapability.publisher_id == publisher_id)
            .order_by(PublisherCapability.capability.asc())
        ).all()
    )


def count_active_platform_accounts(
    db: Session,
    publisher_id: UUID,
) -> int:
    return db.scalar(
        select(func.count(PlatformAccount.id)).where(
            PlatformAccount.publisher_id == publisher_id,
            PlatformAccount.status == "ACTIVE",
        )
    ) or 0


def count_active_media_plans(
    db: Session,
    publisher_id: UUID,
) -> int:
    return db.scalar(
        select(func.count(MediaPlan.id))
        .join(
            PlatformAccount,
            PlatformAccount.id == MediaPlan.platform_account_id,
        )
        .where(
            MediaPlan.publisher_id == publisher_id,
            MediaPlan.active.is_(True),
            PlatformAccount.status == "ACTIVE",
        )
    ) or 0


def count_publisher_interests(
    db: Session,
    publisher_id: UUID,
) -> int:
    return db.scalar(
        select(func.count(PublisherInterest.category_id)).where(
            PublisherInterest.publisher_id == publisher_id
        )
    ) or 0


def count_publisher_capabilities(
    db: Session,
    publisher_id: UUID,
) -> int:
    return db.scalar(
        select(func.count(PublisherCapability.capability)).where(
            PublisherCapability.publisher_id == publisher_id
        )
    ) or 0
