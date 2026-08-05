from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.media_plan import MediaPlan
from backend.app.models.platform_account import PlatformAccount
from backend.app.models.promotion import Promotion
from backend.app.models.publisher_capability import PublisherCapability
from backend.app.models.publisher_interest import PublisherInterest
from backend.app.models.publisher_profile import PublisherProfile
from backend.app.models.recommendation import Recommendation
from backend.app.models.ai_log import AiLog


@dataclass
class CandidateData:
    profile: PublisherProfile
    accounts: dict[UUID, PlatformAccount] = field(default_factory=dict)
    media_plans: list[MediaPlan] = field(default_factory=list)
    interest_ids: set[UUID] = field(default_factory=set)
    capabilities: set[str] = field(default_factory=set)


def create_promotion(db: Session, promotion: Promotion) -> Promotion:
    db.add(promotion)
    db.flush()
    return promotion


def add_recommendations(
    db: Session,
    recommendations: list[Recommendation],
) -> None:
    db.add_all(recommendations)
    db.flush()


def add_ai_log(db: Session, ai_log: AiLog) -> AiLog:
    db.add(ai_log)
    db.flush()
    return ai_log


def get_owned_promotion(
    db: Session,
    business_id: UUID,
    promotion_id: UUID,
) -> Promotion | None:
    return db.scalar(
        select(Promotion).where(
            Promotion.id == promotion_id,
            Promotion.business_id == business_id,
        )
    )


def list_owned_promotions(
    db: Session,
    business_id: UUID,
    *,
    offer_id: UUID | None = None,
) -> list[tuple[Promotion, int]]:
    statement = (
        select(Promotion, func.count(Recommendation.id))
        .outerjoin(
            Recommendation,
            Recommendation.promotion_id == Promotion.id,
        )
        .where(Promotion.business_id == business_id)
        .group_by(Promotion.id)
        .order_by(Promotion.created_at.desc())
    )
    if offer_id is not None:
        statement = statement.where(Promotion.offer_id == offer_id)
    return [(promotion, count) for promotion, count in db.execute(statement).all()]


def count_recommendations(db: Session, promotion_id: UUID) -> int:
    return db.scalar(
        select(func.count(Recommendation.id)).where(
            Recommendation.promotion_id == promotion_id
        )
    ) or 0


def list_promotion_recommendations(
    db: Session,
    promotion_id: UUID,
) -> list[Recommendation]:
    return list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.promotion_id == promotion_id)
            .order_by(
                Recommendation.score.desc(),
                Recommendation.created_at.asc(),
            )
        ).all()
    )


def get_owned_recommendation(
    db: Session,
    business_id: UUID,
    recommendation_id: UUID,
) -> Recommendation | None:
    return db.scalar(
        select(Recommendation)
        .join(Promotion, Promotion.id == Recommendation.promotion_id)
        .where(
            Recommendation.id == recommendation_id,
            Promotion.business_id == business_id,
        )
    )


def load_eligible_candidates(
    db: Session,
    *,
    preferred_platforms: list[str],
    target_city: str | None,
    remotely_fulfillable: bool,
    currency: str,
) -> list[CandidateData]:
    statement = (
        select(PublisherProfile, PlatformAccount, MediaPlan)
        .join(
            PlatformAccount,
            PlatformAccount.publisher_id == PublisherProfile.id,
        )
        .join(
            MediaPlan,
            MediaPlan.platform_account_id == PlatformAccount.id,
        )
        .where(
            PublisherProfile.status == "ACTIVE",
            PublisherProfile.discoverable.is_(True),
            PlatformAccount.status == "ACTIVE",
            MediaPlan.active.is_(True),
            MediaPlan.currency == currency,
        )
    )
    if preferred_platforms:
        statement = statement.where(
            PlatformAccount.platform.in_(preferred_platforms)
        )
    if target_city and not remotely_fulfillable:
        statement = statement.where(
            func.lower(PublisherProfile.city) == target_city.casefold()
        )

    grouped: dict[UUID, CandidateData] = {}
    for profile, account, media_plan in db.execute(statement).all():
        candidate = grouped.setdefault(profile.id, CandidateData(profile=profile))
        candidate.accounts[account.id] = account
        candidate.media_plans.append(media_plan)

    publisher_ids = list(grouped)
    if not publisher_ids:
        return []

    for publisher_id, category_id in db.execute(
        select(
            PublisherInterest.publisher_id,
            PublisherInterest.category_id,
        ).where(PublisherInterest.publisher_id.in_(publisher_ids))
    ).all():
        grouped[publisher_id].interest_ids.add(category_id)

    for publisher_id, capability in db.execute(
        select(
            PublisherCapability.publisher_id,
            PublisherCapability.capability,
        ).where(PublisherCapability.publisher_id.in_(publisher_ids))
    ).all():
        grouped[publisher_id].capabilities.add(capability)

    return list(grouped.values())
