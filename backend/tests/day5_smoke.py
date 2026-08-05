"""Integration smoke test for Day 5 matching and recommendation persistence.

Run from the repository root after applying migrations:
    python3 -m backend.tests.day5_smoke

The test writes clearly labelled disposable development records.
"""

import time

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def request(
    method: str,
    path: str,
    *,
    token: str | None = None,
    payload: dict | None = None,
    expected_status: int = 200,
):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = client.request(method, path, headers=headers, json=payload)
    if response.status_code != expected_status:
        raise AssertionError(
            f"{method} {path}: expected {expected_status}, "
            f"got {response.status_code}: {response.text}"
        )
    return response.json()


def register_user(suffix: str, role: str) -> str:
    email = f"codex_day5_{suffix}@example.com"
    password = "Day5-smoke-password"
    request(
        "POST",
        "/api/v1/auth/register",
        payload={
            "display_name": f"Codex Day 5 {role}",
            "email": email,
            "password": password,
        },
    )
    login = request(
        "POST",
        "/api/v1/auth/login",
        payload={"email": email, "password": password},
    )
    token = login["access_token"]
    request(
        "POST",
        "/api/v1/users/role",
        token=token,
        payload={"role": role},
    )
    return token


def create_business(suffix: str) -> str:
    token = register_user(f"business_{suffix}", "BUSINESS")
    request(
        "POST",
        "/api/v1/profiles/business",
        token=token,
        payload={
            "name": f"کسب‌وکار تست تطبیق {suffix}",
            "category": "فناوری",
            "city": "تهران",
            "description": "رکورد توسعه برای تست روز پنجم",
        },
    )
    return token


def create_publisher(
    suffix: str,
    *,
    city: str,
    platform: str,
    price: str,
    interest_ids: list[str],
    capabilities: list[str],
) -> str:
    token = register_user(f"publisher_{suffix}", "PUBLISHER")
    request(
        "POST",
        "/api/v1/profiles/publisher",
        token=token,
        payload={
            "public_name": f"رسانه تست {suffix}",
            "bio": "پروفایل کامل و واقعی برای آزمون موتور تطبیق",
            "city": city,
        },
    )
    account = request(
        "POST",
        "/api/v1/profiles/publisher/platform-accounts",
        token=token,
        payload={
            "platform": platform,
            "handle": f"match_{suffix}",
            "profile_url": f"https://example.com/match_{suffix}",
            "followers_count": 24000,
        },
        expected_status=201,
    )
    request(
        "POST",
        "/api/v1/profiles/publisher/media-plans",
        token=token,
        payload={
            "platform_account_id": account["id"],
            "content_type": "REEL",
            "price": price,
            "typical_views": 12000,
        },
        expected_status=201,
    )
    request(
        "PUT",
        "/api/v1/profiles/publisher/interests",
        token=token,
        payload={"category_ids": interest_ids},
    )
    request(
        "PUT",
        "/api/v1/profiles/publisher/capabilities",
        token=token,
        payload={"capabilities": capabilities},
    )
    status = request(
        "GET",
        "/api/v1/profiles/publisher/onboarding-status",
        token=token,
    )
    assert status["discoverable"] is True, status
    return token


def offer_payload(category_id: str) -> dict:
    return {
        "category_id": category_id,
        "title": "محصول ویژه تست پیشنهاد رسانه",
        "description": "پیشنهاد واقعی برای سنجش کامل موتور تطبیق روز پنجم.",
        "reward_type": "PRODUCT",
        "retail_value": "20000000.00",
        "cash_amount": None,
        "currency": "IRR",
        "units_per_deal": 2,
        "available_quantity": 10,
        "fulfillment_notes": "ارسال رایگان به ناشر منتخب",
        "remotely_fulfillable": False,
        "expires_at": None,
    }


def main() -> None:
    suffix = str(time.time_ns())
    target_city = f"شهر تست {suffix}"
    business_token = create_business(suffix)
    other_business_token = create_business(f"other_{suffix}")

    offer_options = request("GET", "/api/v1/offers/options")
    categories = offer_options["categories"]
    assert len(categories) >= 4
    offer_category_id = categories[0]["id"]

    create_publisher(
        f"best_{suffix}",
        city=target_city,
        platform="INSTAGRAM",
        price="12000000.00",
        interest_ids=[item["id"] for item in categories[:3]],
        capabilities=["REVIEW", "UGC"],
    )
    create_publisher(
        f"lower_{suffix}",
        city=target_city,
        platform="INSTAGRAM",
        price="30000000.00",
        interest_ids=[item["id"] for item in categories[1:4]],
        capabilities=["INTERVIEW"],
    )
    create_publisher(
        f"filtered_{suffix}",
        city="شیراز",
        platform="TELEGRAM",
        price="12000000.00",
        interest_ids=[item["id"] for item in categories[:3]],
        capabilities=["REVIEW"],
    )

    offer = request(
        "POST",
        "/api/v1/offers",
        token=business_token,
        payload=offer_payload(offer_category_id),
        expected_status=201,
    )
    options = request("GET", "/api/v1/promotions/options")
    assert len(options["goals"]) == 5
    assert options["default_invitation_expiry_hours"] == 72

    promotion_payload = {
        "goal": "CONTENT",
        "target_city": target_city,
        "preferred_platforms": ["INSTAGRAM"],
        "desired_deals": 3,
        "invitation_expiry_hours": 48,
        "content_deadline_days": 10,
        "brief": "یک ریلز خلاقانه با تمرکز بر تجربه واقعی محصول.",
    }
    promotion = request(
        "POST",
        f"/api/v1/offers/{offer['id']}/promotions",
        token=business_token,
        payload=promotion_payload,
        expected_status=201,
    )
    assert promotion["status"] == "READY"
    assert promotion["recommendation_count"] == 1

    recommendations = request(
        "GET",
        f"/api/v1/promotions/{promotion['id']}/recommendations",
        token=business_token,
    )
    assert recommendations["total"] == 1
    first = recommendations["items"][0]
    assert float(first["score"]) > 90
    assert first["factors"]["algorithm_version"] == "deterministic-v2"
    assert first["factors"]["interest"]["matched"] is True
    assert first["best_media_plan"]["platform"] == "INSTAGRAM"
    assert first["package"]["version"] == "exchange-package-v1"
    assert first["package"]["selection"]["method"] == "DETERMINISTIC_FALLBACK"

    listing = request(
        "GET",
        f"/api/v1/promotions?offer_id={offer['id']}",
        token=business_token,
    )
    assert listing["total"] == 1
    assert listing["items"][0]["id"] == promotion["id"]
    request(
        "GET",
        f"/api/v1/promotions/{promotion['id']}",
        token=other_business_token,
        expected_status=404,
    )
    request(
        "GET",
        f"/api/v1/promotions/{promotion['id']}/recommendations",
        token=other_business_token,
        expected_status=404,
    )

    too_many = dict(promotion_payload, desired_deals=6)
    request(
        "POST",
        f"/api/v1/offers/{offer['id']}/promotions",
        token=business_token,
        payload=too_many,
        expected_status=400,
    )
    request(
        "POST",
        f"/api/v1/offers/{offer['id']}/pause",
        token=business_token,
    )
    request(
        "POST",
        f"/api/v1/offers/{offer['id']}/promotions",
        token=business_token,
        payload=promotion_payload,
        expected_status=400,
    )

    print("Day 5 promotion matching smoke test passed")


if __name__ == "__main__":
    main()
