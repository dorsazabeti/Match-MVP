from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from math import log
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.business_profile import BusinessProfile
from backend.app.models.ai_log import AiLog
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
from backend.app.services.llm_package_selector import select_exchange_package
from backend.app.services.package_candidate_service import (
    generate_package_candidates,
)
from backend.app.schemas.package import PackageCandidate


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


def _value_fit_score(value_ratio: Decimal) -> Decimal:
    normalized = max(
        0.0,
        1.0 - abs(log(float(value_ratio))) / log(2.0),
    )
    return (Decimal(str(normalized)) * Decimal("30")).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


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


@dataclass
class RecommendationDraft:
    candidate: repository.CandidateData
    score: Decimal
    factors: dict
    match_explanation: str
    confidence: Decimal
    packages: list[PackageCandidate]


def _build_recommendation_draft(
    promotion: Promotion,
    offer: Offer,
    candidate: repository.CandidateData,
) -> RecommendationDraft | None:
    reward_value = _reward_value(offer)
    if reward_value <= 0:
        return None

    if offer.category_id not in candidate.interest_ids:
        return None

    scored_plans: list[MediaPlan] = []
    for plan in candidate.media_plans:
        media_ratio = plan.price / reward_value
        if media_ratio > Decimal("2"):
            continue
        scored_plans.append(plan)
    if not scored_plans:
        return None

    packages = generate_package_candidates(
        offer=offer,
        goal=promotion.goal,
        plans=scored_plans,
        accounts=candidate.accounts,
        capabilities=candidate.capabilities,
    )
    if not packages:
        return None
    best_package = packages[0]
    value_ratio = best_package.value_ratio
    value_score = _value_fit_score(value_ratio)
    best_deliverable = max(
        best_package.deliverables,
        key=lambda item: item.subtotal,
    )
    best_plan = next(
        plan for plan in scored_plans if plan.id == best_deliverable.media_plan_id
    )
    best_account = candidate.accounts[best_plan.platform_account_id]

    interest_score = Decimal("35")
    location_score = Decimal("5")
    platform_score = Decimal("15")
    relevant_capabilities = GOAL_CAPABILITIES[promotion.goal]
    matched_capabilities = sorted(
        candidate.capabilities.intersection(relevant_capabilities)
    )
    capability_score = Decimal("10") if matched_capabilities else Decimal("0")

    raw_score = (
        interest_score
        + value_score
        + location_score
        + platform_score
        + capability_score
    )
    # Reliability has no meaningful history before Day 8/9. Per PRD, redistribute
    # its 5% proportionally across the available 95 points.
    score = (raw_score / Decimal("95") * Decimal("100")).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )
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
        "algorithm_version": "deterministic-v2",
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
            "maximum": 35,
            "matched": True,
        },
        "value_fit": {
            "score": int(value_score),
            "maximum": 30,
            "reward_value": str(reward_value),
            "media_plan_price": str(best_package.total_media_value),
            "ratio": str(value_ratio.quantize(Decimal("0.001"))),
        },
        "location": {
            "score": int(location_score),
            "maximum": 5,
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
        "reliability": {
            "available": False,
            "base_weight": 5,
            "redistributed": True,
        },
    }

    reasons = [
        f"نسبت ارزش رسانه به پاداش {value_ratio.quantize(Decimal('0.01'))}",
        f"رسانه فعال در {best_account.platform}",
    ]
    reasons.insert(0, "علاقه شخصی دقیقاً مرتبط با پیشنهاد")
    if promotion.target_city:
        reasons.append(f"حضور در {promotion.target_city}")
    if matched_capabilities:
        reasons.append("قابلیت محتوایی متناسب با هدف")

    return RecommendationDraft(
        candidate=candidate,
        score=score,
        factors=factors,
        match_explanation="، ".join(reasons) + ".",
        confidence=confidence,
        packages=packages,
    )


def _finalize_recommendation(
    promotion: Promotion,
    offer: Offer,
    draft: RecommendationDraft,
) -> tuple[Recommendation, AiLog]:
    package, ai_log = select_exchange_package(
        offer=offer,
        promotion=promotion,
        candidate=draft.candidate,
        packages=draft.packages,
    )
    factors = {
        **draft.factors,
        "match_explanation": draft.match_explanation,
        "package_candidate_count": len(draft.packages),
    }
    recommendation = Recommendation(
        promotion_id=promotion.id,
        publisher_id=draft.candidate.profile.id,
        score=draft.score,
        factors_json=factors,
        package_json=package.model_dump(mode="json"),
        explanation=package.selection.reason,
        confidence=Decimal(str(package.selection.confidence)).quantize(
            Decimal("0.001"),
            rounding=ROUND_HALF_UP,
        ),
        status="AVAILABLE",
    )
    return recommendation, ai_log


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
            remotely_fulfillable=offer.remotely_fulfillable,
            currency=offer.currency,
        )
        drafts = [
            draft
            for candidate in candidates
            if (
                draft := _build_recommendation_draft(
                    promotion,
                    offer,
                    candidate,
                )
            )
            is not None
        ]
        drafts.sort(key=lambda item: item.score, reverse=True)
        drafts = drafts[: get_settings().promotion_candidate_limit]
        with ThreadPoolExecutor(
            max_workers=max(1, get_settings().openai_max_concurrency)
        ) as executor:
            finalized = list(
                executor.map(
                    lambda draft: _finalize_recommendation(
                        promotion,
                        offer,
                        draft,
                    ),
                    drafts,
                )
            )
        recommendations = []
        for recommendation, ai_log in finalized:
            repository.add_ai_log(db, ai_log)
            recommendation.ai_log_id = ai_log.id
            recommendations.append(recommendation)
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


def _recommendation_dict(recommendation: Recommendation) -> dict:
    factors = recommendation.factors_json
    publisher = factors["publisher_snapshot"]
    return {
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


def list_recommendations(
    db: Session,
    user: User,
    promotion_id: UUID,
) -> dict:
    _, promotion = get_owned_promotion(db, user, promotion_id)
    recommendations = repository.list_promotion_recommendations(db, promotion.id)
    items = [_recommendation_dict(item) for item in recommendations]
    return {"items": items, "total": len(items)}


def get_recommendation_response(
    db: Session,
    user: User,
    recommendation_id: UUID,
) -> dict:
    business = require_business(db, user)
    recommendation = repository.get_owned_recommendation(
        db,
        business.id,
        recommendation_id,
    )
    if recommendation is None:
        raise LookupError("Recommendation not found")
    return _recommendation_dict(recommendation)
