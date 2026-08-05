"""Integration smoke test for the complete Day 4 Offer vertical slice.

Run from the repository root:
    python3 -m backend.tests.day4_smoke

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
    files: dict | None = None,
):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = client.request(
        method,
        path,
        headers=headers,
        json=payload,
        files=files,
    )
    if response.status_code != expected_status:
        raise AssertionError(
            f"{method} {path}: expected {expected_status}, "
            f"got {response.status_code}: {response.text}"
        )
    return None if response.status_code == 204 else response.json()


def create_business(suffix: str) -> str:
    email = f"codex_day4_{suffix}@example.com"
    password = "Day4-smoke-password"
    request(
        "POST",
        "/api/v1/auth/register",
        payload={
            "display_name": "Codex Day 4 Business",
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
        payload={"role": "BUSINESS"},
    )
    request(
        "POST",
        "/api/v1/profiles/business",
        token=token,
        payload={
            "name": f"کسب‌وکار تست روز چهارم {suffix}",
            "category": "فناوری",
            "city": "تهران",
            "description": "رکورد توسعه برای تست Offer",
        },
    )
    return token


def offer_payload(category_id: str, reward_type: str) -> dict:
    inventory = reward_type != "CASH"
    cash = reward_type in {"CASH", "HYBRID"}
    return {
        "category_id": category_id,
        "title": f"پیشنهاد تست {reward_type}",
        "description": "این پیشنهاد برای تست یکپارچه روز چهارم ساخته شده است.",
        "reward_type": reward_type,
        "retail_value": "15000000.00" if inventory else None,
        "cash_amount": "5000000.00" if cash else None,
        "currency": "IRR",
        "units_per_deal": 2 if inventory else 0,
        "available_quantity": 10 if inventory else 0,
        "fulfillment_notes": "تحویل پس از فعال شدن همکاری",
        "remotely_fulfillable": True,
        "expires_at": None,
    }


def main() -> None:
    suffix = str(time.time_ns())
    token = create_business(suffix)
    options = request("GET", "/api/v1/offers/options")
    assert len(options["categories"]) >= 3
    assert {item["value"] for item in options["reward_types"]} == {
        "PRODUCT",
        "SERVICE",
        "CASH",
        "HYBRID",
    }
    category_id = options["categories"][0]["id"]

    invalid_cash = offer_payload(category_id, "CASH")
    invalid_cash["available_quantity"] = 1
    request(
        "POST",
        "/api/v1/offers",
        token=token,
        payload=invalid_cash,
        expected_status=422,
    )

    created = []
    for reward_type in ("PRODUCT", "SERVICE", "CASH", "HYBRID"):
        created.append(
            request(
                "POST",
                "/api/v1/offers",
                token=token,
                payload=offer_payload(category_id, reward_type),
                expected_status=201,
            )
        )

    product = created[0]
    listing = request("GET", "/api/v1/offers", token=token)
    assert listing["total"] == 4
    assert {item["reward_type"] for item in listing["items"]} == {
        "PRODUCT",
        "SERVICE",
        "CASH",
        "HYBRID",
    }

    updated_payload = offer_payload(category_id, "PRODUCT")
    updated_payload["title"] = "پیشنهاد محصول ویرایش‌شده"
    updated = request(
        "PATCH",
        f"/api/v1/offers/{product['id']}",
        token=token,
        payload=updated_payload,
    )
    assert updated["title"] == updated_payload["title"]

    request(
        "POST",
        f"/api/v1/offers/{product['id']}/images",
        token=token,
        files={"image": ("offer.txt", b"not-an-image", "text/plain")},
        expected_status=400,
    )
    image = request(
        "POST",
        f"/api/v1/offers/{product['id']}/images",
        token=token,
        files={"image": ("offer.png", b"\x89PNG\r\n\x1a\nmatch", "image/png")},
        expected_status=201,
    )
    persisted = request(
        "GET",
        f"/api/v1/offers/{product['id']}",
        token=token,
    )
    assert persisted["images"][0]["id"] == image["id"]

    replacement_image = request(
        "POST",
        f"/api/v1/offers/{product['id']}/images",
        token=token,
        files={"image": ("replacement.png", b"\x89PNG\r\n\x1a\nmatch2", "image/png")},
        expected_status=201,
    )
    request(
        "DELETE",
        f"/api/v1/offers/{product['id']}/images/{image['id']}",
        token=token,
        expected_status=204,
    )
    persisted_replacement = request(
        "GET",
        f"/api/v1/offers/{product['id']}",
        token=token,
    )
    assert persisted_replacement["images"] == [
        {
            "id": replacement_image["id"],
            "storage_path": replacement_image["storage_path"],
            "sort_order": 0,
        }
    ]

    other_token = create_business(f"other_{suffix}")
    request(
        "GET",
        f"/api/v1/offers/{product['id']}",
        token=other_token,
        expected_status=404,
    )

    paused = request(
        "POST",
        f"/api/v1/offers/{product['id']}/pause",
        token=token,
    )
    assert paused["status"] == "PAUSED"
    active = request(
        "POST",
        f"/api/v1/offers/{product['id']}/activate",
        token=token,
    )
    assert active["status"] == "ACTIVE"
    expired = request(
        "POST",
        f"/api/v1/offers/{product['id']}/expire",
        token=token,
    )
    assert expired["status"] == "EXPIRED"
    request(
        "PATCH",
        f"/api/v1/offers/{product['id']}",
        token=token,
        payload=updated_payload,
        expected_status=400,
    )

    request(
        "DELETE",
        f"/api/v1/offers/{product['id']}/images/{replacement_image['id']}",
        token=token,
        expected_status=204,
    )
    print("Day 4 Offer smoke test passed")


if __name__ == "__main__":
    main()
