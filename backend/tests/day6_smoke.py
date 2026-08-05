"""Integration and contract tests for Day 6 exchange-package generation.

Run from the repository root after applying migrations:
    python3 -m backend.tests.day6_smoke
"""

import json
import time
from decimal import Decimal
from uuid import UUID

from backend.app.core.config import get_settings
from backend.app.core.database import SessionLocal
from backend.app.models.ai_log import AiLog
from backend.app.models.offer import Offer
from backend.app.models.promotion import Promotion
from backend.app.models.recommendation import Recommendation
from backend.app.repositories import promotion_repository
from backend.app.services.llm_package_selector import (
    LlmTimeoutError,
    ProviderResponse,
    select_exchange_package,
)
from backend.app.services.package_candidate_service import (
    generate_package_candidates,
)
from backend.tests.day5_smoke import (
    create_business,
    create_publisher,
    offer_payload,
    request,
)


class RepairingSelector:
    def __init__(self, candidate_id: str):
        self.candidate_id = candidate_id
        self.calls = 0

    def select(self, payload: dict, *, repair: bool = False) -> ProviderResponse:
        self.calls += 1
        if self.calls == 1:
            return ProviderResponse("not-json", 11, 3)
        assert repair is True
        return ProviderResponse(
            json.dumps(
                {
                    "candidate_id": self.candidate_id,
                    "reason": "این بسته معتبر، ساده و متناسب با هدف تولید محتواست.",
                    "confidence": 0.88,
                    "risk_flags": [],
                }
            ),
            12,
            5,
        )


class TimeoutSelector:
    def __init__(self):
        self.calls = 0

    def select(self, payload: dict, *, repair: bool = False) -> ProviderResponse:
        self.calls += 1
        raise LlmTimeoutError()


def main() -> None:
    suffix = str(time.time_ns())
    target_city = f"شهر بسته {suffix}"
    business_token = create_business(f"day6_{suffix}")
    other_business_token = create_business(f"day6_other_{suffix}")

    offer_options = request("GET", "/api/v1/offers/options")
    categories = offer_options["categories"]
    offer_category_id = categories[0]["id"]
    publisher_token = create_publisher(
        f"day6_{suffix}",
        city=target_city,
        platform="INSTAGRAM",
        price="6000000.00",
        interest_ids=[item["id"] for item in categories[:3]],
        capabilities=["UGC", "REVIEW"],
    )
    account = request(
        "GET",
        "/api/v1/profiles/publisher/platform-accounts",
        token=publisher_token,
    )[0]
    for content_type, price in (("STORY", "4000000.00"), ("POST", "5000000.00")):
        request(
            "POST",
            "/api/v1/profiles/publisher/media-plans",
            token=publisher_token,
            payload={
                "platform_account_id": account["id"],
                "content_type": content_type,
                "price": price,
                "typical_views": 9000,
            },
            expected_status=201,
        )

    payload = offer_payload(offer_category_id)
    payload["title"] = "پیشنهاد تست بسته همکاری روز ششم"
    payload["remotely_fulfillable"] = False
    offer_response = request(
        "POST",
        "/api/v1/offers",
        token=business_token,
        payload=payload,
        expected_status=201,
    )
    promotion_response = request(
        "POST",
        f"/api/v1/offers/{offer_response['id']}/promotions",
        token=business_token,
        payload={
            "goal": "CONTENT",
            "target_city": target_city,
            "preferred_platforms": ["INSTAGRAM"],
            "desired_deals": 2,
            "invitation_expiry_hours": 72,
            "content_deadline_days": 7,
            "brief": "بسته‌ای ساده برای تولید محتوای تجربه‌محور انتخاب شود.",
        },
        expected_status=201,
    )
    assert promotion_response["status"] == "READY"
    assert promotion_response["recommendation_count"] == 1

    result = request(
        "GET",
        f"/api/v1/promotions/{promotion_response['id']}/recommendations",
        token=business_token,
    )["items"][0]
    package = result["package"]
    assert package["version"] == "exchange-package-v1"
    assert package["selection"]["method"] == "DETERMINISTIC_FALLBACK"
    assert package["selection"]["prompt_version"] == "package-selector-v1"
    assert 1 <= package["total_items"] <= 6
    assert 1 <= len(package["deliverables"]) <= 3
    assert len({item["content_type"] for item in package["deliverables"]}) == len(
        package["deliverables"]
    )
    assert {item["platform"] for item in package["deliverables"]} == {
        package["platform"]
    }
    subtotal = sum(Decimal(item["subtotal"]) for item in package["deliverables"])
    assert subtotal == Decimal(package["total_media_value"])
    ratio = Decimal(package["value_ratio"])
    assert Decimal("0.75") <= ratio <= Decimal("1.35")

    detail = request(
        "GET",
        f"/api/v1/recommendations/{result['id']}",
        token=business_token,
    )
    assert detail["id"] == result["id"]
    request(
        "GET",
        f"/api/v1/recommendations/{result['id']}",
        token=other_business_token,
        expected_status=404,
    )

    db = SessionLocal()
    try:
        recommendation = db.get(Recommendation, UUID(result["id"]))
        assert recommendation is not None
        assert recommendation.ai_log_id is not None
        log_record = db.get(AiLog, recommendation.ai_log_id)
        assert log_record is not None
        assert log_record.fallback_used is True
        assert log_record.error_code == "LLM_DISABLED"
        assert len(log_record.request_hash) == 64

        offer = db.get(Offer, UUID(offer_response["id"]))
        promotion = db.get(Promotion, UUID(promotion_response["id"]))
        candidates = promotion_repository.load_eligible_candidates(
            db,
            preferred_platforms=["INSTAGRAM"],
            target_city=target_city,
            remotely_fulfillable=False,
            currency="IRR",
        )
        candidate = next(
            item for item in candidates if item.profile.id == recommendation.publisher_id
        )
        candidates_packages = generate_package_candidates(
            offer=offer,
            goal=promotion.goal,
            plans=candidate.media_plans,
            accounts=candidate.accounts,
            capabilities=candidate.capabilities,
        )
        assert 1 <= len(candidates_packages) <= 5

        settings = get_settings()
        original_enabled = settings.llm_selection_enabled
        settings.llm_selection_enabled = True
        try:
            repairing = RepairingSelector(candidates_packages[0].candidate_id)
            selected, selected_log = select_exchange_package(
                offer=offer,
                promotion=promotion,
                candidate=candidate,
                packages=candidates_packages,
                selector=repairing,
            )
            assert repairing.calls == 2
            assert selected.selection.method == "LLM"
            assert selected_log.success is True
            assert selected_log.result_json["attempts"] == 2

            timing_out = TimeoutSelector()
            fallback, fallback_log = select_exchange_package(
                offer=offer,
                promotion=promotion,
                candidate=candidate,
                packages=candidates_packages,
                selector=timing_out,
            )
            assert timing_out.calls == 2
            assert fallback.selection.method == "DETERMINISTIC_FALLBACK"
            assert fallback_log.error_code == "TIMEOUT"
            assert fallback_log.fallback_used is True
        finally:
            settings.llm_selection_enabled = original_enabled
    finally:
        db.close()

    print("Day 6 package generation and LLM fallback smoke test passed")


if __name__ == "__main__":
    main()
