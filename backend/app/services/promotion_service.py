from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.business_profile import BusinessProfile
from backend.app.models.media_plan import MediaPlan
from backend.app.models.offer import Offer
from backend.app.models.promotion import Promotion
from backend.app.models.recommendation import Recommendation
from backend.app.models.user import User
from backend.app.repositories import promotion_repository as repository
from backend.app.schemas.publisher_onboarding import PlatformValue
from backend.app.services.offer_service import (
    get_business_offer,
    require_business,
)
from backend.app.services.publisher_onboarding_service import PLATFORM_LABELS


GOAL_LABELS = {
    "AWARENESS": "افزایش آگاهی از برند",
    "ENGAGEMENT": "افزایش تعامل",
    "CONTENT": "تولید محتوای باکیفیت",
    "TRAFFIC": "هدایت مخاطب",
    "SALES": "فروش و تبدیل",
}

GOAL_CAPABILITIES = {
    "AWARENESS": {"NEWS", "LIFESTYLE", "REVIEW"},
    "ENGAGEMENT": {"REVIEW", "UGC", "INTERVIEW"},
    "CONTENT": {"UGC", "TUTORIAL", "UNBOXING"},
    "TRAFFIC": {"REVIEW", "TUTORIAL", "NEWS"},
    "SALES": {"REVIEW", "TUTORIAL", "UNBOXING"},
}


def get_promotion_options() -> dict:
    settings = get_settings()
    return {
        "goals": [
            {"value": value, "label": label}
            for value, label in GOAL_LABELS.items()
        ],
        "platforms": [
            {"value": platform.value, "label": PLATFORM_LABELS[platform]}
            for platform in PlatformValue
        ],
        "default_invitation_expiry_hours": 72,
        "default_content_deadline_days": 7,
        "maximum_cash_deals": settings.promotion_cash_deal_cap,
    }


def _reward_value(offer: Offer) -> Decimal:
    return (offer.retail_value or Decimal("0")) + (
        offer.cash_amount or Decimal("0")
    )


def _value_fit_score(ratio: Decimal) -> Decimal:
    if ratio >= Decimal("1"):
        return Decimal("30")
    if ratio >= Decimal("0.85"):
        return Decimal("27")
    if ratio >= Decimal("0.70"):
        return Decimal("22")
    return Decimal("14")


def _promotion_dict(promotion: Promotion, recommendation_count: int) -> dict:
    return {
        "id": promotion.id,
        "business_id": promotion.business_id,
        "offer_id": promotion.offer_id,
        "goal": promotion.goal,
        "target_city": promotion.target_city,
        "preferred_platforms": promotion.preferred_platforms,
        "desired_deals": promotion.desired_deals,
        "active_deals_count": promotion.active_deals_count,
        "invitation_expiry_hours": promotion.invitation_expiry_hours,
        "content_deadline_days": promotion.content_deadline_days,
        "brief": promotion.brief,
        "status": promotion.status,
        "recommendation_count": recommendation_count,
        "created_at": promotion.created_at,
        "updated_at": promotion.updated_at,
    }


def _validate_promotable_offer(offer: Offer, desired_deals: int) -> None:
    settings = get_settings()
    if offer.status != "ACTIVE":
        raise ValueError("Only active Offers can be promoted")
    if offer.reward_type == "CASH":
        if desired_deals > settings.promotion_cash_deal_cap:
            raise ValueError(
                f"Cash promotions support up to {settings.promotion_cash_deal_cap} deals"
            )
        return

    maximum_deals = offer.available_quantity // offer.units_per_deal
    if maximum_deals < desired_deals:
        raise ValueError(
            f"Inventory supports at most {maximum_deals} collaboration(s)"
        )


def _build_recommendation(
    promotion: Promotion,
    offer: Offer,
    candidate: repository.CandidateData,
) -> Recommendation | None:
    settings = get_settings()
    reward_value = _reward_value(offer)
    if reward_value <= 0:
        return None

    scored_plans: list[tuple[Decimal, Decimal, MediaPlan]] = []
    for plan in candidate.media_plans:
        ratio = reward_value / plan.price
        if ratio < Decimal(str(settings.promotion_min_value_ratio)):
            continue
        scored_plans.append((_value_fit_score(ratio), ratio, plan))
    if not scored_plans:
        return None

    value_score, value_ratio, best_plan = max(
        scored_plans,
        key=lambda item: (item[0], -abs(item[1] - Decimal("1"))),
    )
    best_account = candidate.accounts[best_plan.platform_account_id]

    interest_match = offer.category_id in candidate.interest_ids
    interest_score = Decimal("30") if interest_match else Decimal("0")
    location_score = Decimal("15") if promotion.target_city else Decimal("10")
    platform_score = (
        Decimal("15") if promotion.preferred_platforms else Decimal("10")
    )
    relevant_capabilities = GOAL_CAPABILITIES[promotion.goal]
    matched_capabilities = sorted(
        candidate.capabilities.intersection(relevant_capabilities)
    )
    capability_score = Decimal("10") if matched_capabilities else Decimal("4")

    score = (
        interest_score
        + value_score
        + location_score
        + platform_score
        + capability_score
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    confidence = (score / Decimal("100")).quantize(
        Decimal("0.001"), rounding=ROUND_HALF_UP
    )

    account_snapshots = [
        {
            "platform": account.platform,
            "handle": account.handle,
            "followers_count": account.followers_count,
            "verification_status": account.verification_status,
        }
        for account in sorted(
            candidate.accounts.values(),
            key=lambda account: account.followers_count,
            reverse=True,
        )
    ]
    factors = {
        "algorithm_version": "deterministic-v1",
        "publisher_snapshot": {
            "public_name": candidate.profile.public_name,
            "city": candidate.profile.city,
            "bio": candidate.profile.bio,
            "avatar_url": candidate.profile.avatar_url,
            "platforms": account_snapshots,
        },
        "best_media_plan": {
            "id": str(best_plan.id),
            "platform": best_account.platform,
            "content_type": best_plan.content_type,
            "price": str(best_plan.price),
            "currency": best_plan.currency,
            "typical_views": best_plan.typical_views,
        },
        "interest": {
            "score": int(interest_score),
            "maximum": 30,
            "matched": interest_match,
        },
        "value_fit": {
            "score": int(value_score),
            "maximum": 30,
            "reward_value": str(reward_value),
            "media_plan_price": str(best_plan.price),
            "ratio": str(value_ratio.quantize(Decimal("0.001"))),
        },
        "location": {
            "score": int(location_score),
            "maximum": 15,
            "target_city": promotion.target_city,
            "publisher_city": candidate.profile.city,
        },
        "platform": {
            "score": int(platform_score),
            "maximum": 15,
            "matched_platform": best_account.platform,
        },
        "capability": {
            "score": int(capability_score),
            "maximum": 10,
            "matched": matched_capabilities,
        },
    }

    reasons = [
        f"تناسب ارزشی {value_ratio.quantize(Decimal('0.01'))} برابر",
        f"رسانه فعال در {best_account.platform}",
    ]
    if interest_match:
        reasons.insert(0, "علاقه شخصی مرتبط با پیشنهاد")
    if promotion.target_city:
        reasons.append(f"حضور در {promotion.target_city}")
    if matched_capabilities:
        reasons.append("قابلیت محتوایی متناسب با هدف")

    return Recommendation(
        promotion_id=promotion.id,
        publisher_id=candidate.profile.id,
        score=score,
        factors_json=factors,
        package_json=None,
        explanation="، ".join(reasons) + ".",
        confidence=confidence,
        status="AVAILABLE",
    )


def create_promotion_and_recommendations(
    db: Session,
    user: User,
    offer_id: UUID,
    data: dict,
) -> dict:
    business = require_business(db, user)
    offer = get_business_offer(db, business, offer_id)
    _validate_promotable_offer(offer, data["desired_deals"])

    promotion = Promotion(
        business_id=business.id,
        offer_id=offer.id,
        goal=data["goal"],
        target_city=data.get("target_city"),
        preferred_platforms=[
            platform.value if hasattr(platform, "value") else platform
            for platform in data.get("preferred_platforms", [])
        ],
        desired_deals=data["desired_deals"],
        active_deals_count=0,
        invitation_expiry_hours=data["invitation_expiry_hours"],
        content_deadline_days=data["content_deadline_days"],
        brief=data.get("brief"),
        status="GENERATING",
    )

    try:
        repository.create_promotion(db, promotion)
        candidates = repository.load_eligible_candidates(
            db,
            preferred_platforms=promotion.preferred_platforms,
            target_city=promotion.target_city,
            currency=offer.currency,
        )
        recommendations = [
            recommendation
            for candidate in candidates
            if (
                recommendation := _build_recommendation(
                    promotion,
                    offer,
                    candidate,
                )
            )
            is not None
        ]
        recommendations.sort(key=lambda item: item.score, reverse=True)
        recommendations = recommendations[: get_settings().promotion_candidate_limit]
        repository.add_recommendations(db, recommendations)
        promotion.status = "READY"
        db.commit()
        db.refresh(promotion)
        return _promotion_dict(promotion, len(recommendations))
    except Exception:
        db.rollback()
        raise


def get_owned_promotion(
    db: Session,
    user: User,
    promotion_id: UUID,
) -> tuple[BusinessProfile, Promotion]:
    business = require_business(db, user)
    promotion = repository.get_owned_promotion(db, business.id, promotion_id)
    if promotion is None:
        raise LookupError("Promotion not found")
    return business, promotion


def get_promotion_response(
    db: Session,
    user: User,
    promotion_id: UUID,
) -> dict:
    _, promotion = get_owned_promotion(db, user, promotion_id)
    return _promotion_dict(
        promotion,
        repository.count_recommendations(db, promotion.id),
    )


def list_promotions(
    db: Session,
    user: User,
    offer_id: UUID | None = None,
) -> dict:
    business = require_business(db, user)
    rows = repository.list_owned_promotions(
        db,
        business.id,
        offer_id=offer_id,
    )
    items = [
        _promotion_dict(promotion, recommendation_count)
        for promotion, recommendation_count in rows
    ]
    return {"items": items, "total": len(items)}


def list_recommendations(
    db: Session,
    user: User,
    promotion_id: UUID,
) -> dict:
    _, promotion = get_owned_promotion(db, user, promotion_id)
    recommendations = repository.list_promotion_recommendations(
        db,
        promotion.id,
    )
    items = []
    for recommendation in recommendations:
        factors = recommendation.factors_json
        publisher = factors["publisher_snapshot"]
        items.append(
            {
                "id": recommendation.id,
                "promotion_id": recommendation.promotion_id,
                "publisher_id": recommendation.publisher_id,
                "publisher_public_name": publisher["public_name"],
                "publisher_city": publisher["city"],
                "publisher_bio": publisher.get("bio"),
                "publisher_avatar_url": publisher.get("avatar_url"),
                "platforms": publisher["platforms"],
                "best_media_plan": factors["best_media_plan"],
                "score": recommendation.score,
                "factors": {
                    key: value
                    for key, value in factors.items()
                    if key not in {"publisher_snapshot", "best_media_plan"}
                },
                "package": recommendation.package_json,
                "explanation": recommendation.explanation,
                "confidence": recommendation.confidence,
                "status": recommendation.status,
                "created_at": recommendation.created_at,
            }
        )
    return {"items": items, "total": len(items)}
