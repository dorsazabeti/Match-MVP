from __future__ import annotations

from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from itertools import combinations, product
from math import log

from backend.app.core.config import get_settings
from backend.app.models.media_plan import MediaPlan
from backend.app.models.offer import Offer
from backend.app.models.platform_account import PlatformAccount
from backend.app.schemas.package import PackageCandidate


GOAL_CONTENT_TYPES = {
    "AWARENESS": {"REEL", "POST", "VIDEO", "SHORT_VIDEO"},
    "ENGAGEMENT": {"STORY", "REEL", "LIVE", "POST"},
    "CONTENT": {"REEL", "UGC", "SHORT_VIDEO", "VIDEO"},
    "TRAFFIC": {"STORY", "POST", "REEL"},
    "SALES": {"STORY", "REEL", "POST", "VIDEO"},
}

CONTENT_CAPABILITIES = {
    "POST": {"NEWS", "REVIEW", "LIFESTYLE"},
    "STORY": {"UGC", "LIFESTYLE", "REVIEW"},
    "REEL": {"UGC", "LIFESTYLE", "UNBOXING", "REVIEW"},
    "VIDEO": {"TUTORIAL", "REVIEW", "INTERVIEW"},
    "SHORT_VIDEO": {"UGC", "UNBOXING", "TUTORIAL"},
    "LIVE": {"INTERVIEW", "TUTORIAL", "REVIEW"},
    "UGC": {"UGC"},
}


def _reward_value(offer: Offer) -> Decimal:
    return (offer.retail_value or Decimal("0")) + (
        offer.cash_amount or Decimal("0")
    )


def _closeness(value_ratio: Decimal) -> Decimal:
    score = max(0.0, 1.0 - abs(log(float(value_ratio))) / log(2.0))
    return Decimal(str(score))


def _rank_score(
    *,
    value_ratio: Decimal,
    quantities: tuple[int, ...],
    content_types: tuple[str, ...],
    goal: str,
    capabilities: set[str],
) -> Decimal:
    total_items = sum(quantities)
    preferred = GOAL_CONTENT_TYPES[goal]
    preferred_items = sum(
        quantity
        for content_type, quantity in zip(content_types, quantities)
        if content_type in preferred
    )
    goal_fit = Decimal(preferred_items) / Decimal(total_items)
    supported_items = sum(
        quantity
        for content_type, quantity in zip(content_types, quantities)
        if CONTENT_CAPABILITIES[content_type].intersection(capabilities)
    )
    capability_fit = Decimal(supported_items) / Decimal(total_items)
    distinct_penalty = Decimal(len(content_types) - 1) / Decimal("2")
    quantity_penalty = Decimal(total_items - 1) / Decimal("5")
    simplicity = max(
        Decimal("0"),
        Decimal("1")
        - distinct_penalty * Decimal("0.5")
        - quantity_penalty * Decimal("0.5"),
    )
    score = (
        _closeness(value_ratio) * Decimal("0.55")
        + goal_fit * Decimal("0.25")
        + simplicity * Decimal("0.10")
        + capability_fit * Decimal("0.10")
    )
    return score.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def _best_plan_per_content_type(
    plans: list[MediaPlan],
    reward_value: Decimal,
) -> list[MediaPlan]:
    grouped: dict[str, list[MediaPlan]] = defaultdict(list)
    for plan in plans:
        grouped[plan.content_type].append(plan)
    return [
        min(
            options,
            key=lambda item: abs(log(float(item.price / reward_value))),
        )
        for options in grouped.values()
    ]


def _candidates_for_band(
    *,
    offer: Offer,
    goal: str,
    plans: list[MediaPlan],
    accounts: dict,
    capabilities: set[str],
    lower: Decimal,
    upper: Decimal,
    widened: bool,
) -> list[dict]:
    settings = get_settings()
    reward_value = _reward_value(offer)
    grouped: dict[str, list[MediaPlan]] = defaultdict(list)
    for plan in plans:
        account = accounts[plan.platform_account_id]
        grouped[account.platform].append(plan)

    raw: list[dict] = []
    fingerprints: set[tuple] = set()
    for platform, platform_plans in grouped.items():
        distinct_plans = sorted(
            _best_plan_per_content_type(platform_plans, reward_value),
            key=lambda item: item.content_type,
        )
        maximum_types = min(
            settings.package_max_distinct_types,
            len(distinct_plans),
        )
        for type_count in range(1, maximum_types + 1):
            for selected in combinations(distinct_plans, type_count):
                content_types = tuple(item.content_type for item in selected)
                for quantities in product(range(1, 5), repeat=type_count):
                    total_items = sum(quantities)
                    if total_items > settings.package_max_total_items:
                        continue
                    total_value = sum(
                        plan.price * quantity
                        for plan, quantity in zip(selected, quantities)
                    )
                    ratio = total_value / reward_value
                    if ratio < lower or ratio > upper:
                        continue
                    fingerprint = tuple(
                        (str(plan.id), quantity)
                        for plan, quantity in zip(selected, quantities)
                    )
                    if fingerprint in fingerprints:
                        continue
                    fingerprints.add(fingerprint)
                    deliverables = [
                        {
                            "media_plan_id": plan.id,
                            "platform_account_id": plan.platform_account_id,
                            "platform": platform,
                            "content_type": plan.content_type,
                            "quantity": quantity,
                            "unit_price": plan.price,
                            "subtotal": plan.price * quantity,
                            "typical_views": plan.typical_views,
                        }
                        for plan, quantity in zip(selected, quantities)
                    ]
                    raw.append(
                        {
                            "platform": platform,
                            "deliverables": deliverables,
                            "total_items": total_items,
                            "total_media_value": total_value,
                            "currency": offer.currency,
                            "value_ratio": ratio,
                            "fair_value_band": {
                                "lower": lower,
                                "upper": upper,
                                "widened": widened,
                            },
                            "deterministic_rank_score": _rank_score(
                                value_ratio=ratio,
                                quantities=quantities,
                                content_types=content_types,
                                goal=goal,
                                capabilities=capabilities,
                            ),
                        }
                    )
    return raw


def generate_package_candidates(
    *,
    offer: Offer,
    goal: str,
    plans: list[MediaPlan],
    accounts: dict,
    capabilities: set[str],
) -> list[PackageCandidate]:
    settings = get_settings()
    reward_value = _reward_value(offer)
    if reward_value <= 0:
        return []

    raw = _candidates_for_band(
        offer=offer,
        goal=goal,
        plans=plans,
        accounts=accounts,
        capabilities=capabilities,
        lower=Decimal(str(settings.package_fair_value_min)),
        upper=Decimal(str(settings.package_fair_value_max)),
        widened=False,
    )
    if not raw:
        raw = _candidates_for_band(
            offer=offer,
            goal=goal,
            plans=plans,
            accounts=accounts,
            capabilities=capabilities,
            lower=Decimal(str(settings.package_wide_value_min)),
            upper=Decimal(str(settings.package_wide_value_max)),
            widened=True,
        )

    raw.sort(
        key=lambda item: (
            item["deterministic_rank_score"],
            -item["total_items"],
        ),
        reverse=True,
    )
    return [
        PackageCandidate.model_validate({**item, "candidate_id": f"pkg_{index}"})
        for index, item in enumerate(
            raw[: settings.package_max_candidates],
            start=1,
        )
    ]
