"""Real HTTP smoke test for the Day 3 publisher onboarding flow.

Run while FastAPI is listening locally:
    python3 backend/tests/day3_smoke.py

The script creates clearly labelled disposable development records.
"""

import json
import os
import time
import urllib.error
import urllib.request


API_BASE_URL = os.getenv(
    "MATCH_API_BASE_URL",
    "http://127.0.0.1:8000/api/v1",
).rstrip("/")


def request(
    method: str,
    path: str,
    *,
    token: str | None = None,
    payload: dict | None = None,
    expected_status: int = 200,
):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None if payload is None else json.dumps(payload).encode()
    api_request = urllib.request.Request(
        f"{API_BASE_URL}{path}",
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(api_request, timeout=10) as response:
            status = response.status
            raw_body = response.read()
    except urllib.error.HTTPError as error:
        status = error.code
        raw_body = error.read()

    if status != expected_status:
        raise AssertionError(
            f"{method} {path}: expected {expected_status}, got {status}: "
            f"{raw_body.decode()}"
        )

    if not raw_body:
        return None
    return json.loads(raw_body)


def assert_step(token: str, expected_step: str, discoverable: bool):
    status = request(
        "GET",
        "/profiles/publisher/onboarding-status",
        token=token,
    )
    assert status["next_step"] == expected_step, status
    assert status["discoverable"] is discoverable, status
    return status


def main() -> None:
    suffix = str(time.time_ns())
    email = f"codex_day3_{suffix}@example.com"
    password = "Day3-smoke-password"

    request(
        "GET",
        "/profiles/publisher/onboarding-status",
        expected_status=401,
    )
    request(
        "POST",
        "/auth/register",
        payload={
            "display_name": "Codex Day 3 Test",
            "email": email,
            "password": password,
        },
        expected_status=200,
    )
    login = request(
        "POST",
        "/auth/login",
        payload={"email": email, "password": password},
    )
    token = login["access_token"]

    request(
        "POST",
        "/users/role",
        token=token,
        payload={"role": "PUBLISHER"},
    )
    assert_step(token, "PROFILE", False)

    options = request(
        "GET",
        "/profiles/publisher/onboarding-options",
        token=token,
    )
    assert len(options["categories"]) >= 3
    assert options["currency"]

    request(
        "POST",
        "/profiles/publisher",
        token=token,
        payload={
            "public_name": "ناشر تست روز سوم",
            "bio": "پروفایل واقعی برای تست یکپارچه‌سازی روز سوم",
            "city": "تهران",
            "avatar_url": None,
        },
    )
    updated_profile = request(
        "PATCH",
        "/profiles/publisher/me",
        token=token,
        payload={"bio": "نسخه ویرایش‌شده برای تست API روز سوم"},
    )
    assert updated_profile["public_name"] == "ناشر تست روز سوم"
    persisted_profile = request(
        "GET",
        "/profiles/publisher/me",
        token=token,
    )
    assert persisted_profile["bio"] == updated_profile["bio"]
    assert_step(token, "PLATFORM_ACCOUNTS", False)

    request(
        "POST",
        "/profiles/publisher/platform-accounts",
        token=token,
        payload={
            "platform": "INSTAGRAM",
            "handle": f"codex_{suffix}",
            "profile_url": "not-a-url",
            "followers_count": 1,
        },
        expected_status=422,
    )
    request(
        "POST",
        "/profiles/publisher/platform-accounts",
        token=token,
        payload={
            "platform": "INSTAGRAM",
            "handle": f"codex_{suffix}",
            "profile_url": f"https://instagram.com/codex_{suffix}",
            "followers_count": -1,
        },
        expected_status=422,
    )

    account = request(
        "POST",
        "/profiles/publisher/platform-accounts",
        token=token,
        payload={
            "platform": "INSTAGRAM",
            "handle": f"codex_{suffix}",
            "profile_url": f"https://instagram.com/codex_{suffix}",
            "followers_count": 12500,
        },
        expected_status=201,
    )
    request(
        "POST",
        "/profiles/publisher/platform-accounts",
        token=token,
        payload={
            "platform": "INSTAGRAM",
            "handle": f"codex_{suffix}",
            "profile_url": f"https://instagram.com/codex_{suffix}",
            "followers_count": 12500,
        },
        expected_status=409,
    )
    updated_account = request(
        "PATCH",
        f"/profiles/publisher/platform-accounts/{account['id']}",
        token=token,
        payload={"followers_count": 13000},
    )
    assert updated_account["followers_count"] == 13000
    accounts = request(
        "GET",
        "/profiles/publisher/platform-accounts",
        token=token,
    )
    assert len(accounts) == 1

    other_email = f"codex_day3_other_{suffix}@example.com"
    request(
        "POST",
        "/auth/register",
        payload={
            "display_name": "Codex Other Publisher",
            "email": other_email,
            "password": password,
        },
    )
    other_login = request(
        "POST",
        "/auth/login",
        payload={"email": other_email, "password": password},
    )
    other_token = other_login["access_token"]
    request(
        "POST",
        "/users/role",
        token=other_token,
        payload={"role": "PUBLISHER"},
    )
    request(
        "POST",
        "/profiles/publisher",
        token=other_token,
        payload={
            "public_name": "ناشر دوم تست",
            "bio": "برای بررسی جلوگیری از دسترسی به رکورد دیگران",
            "city": "شیراز",
        },
    )
    request(
        "PATCH",
        f"/profiles/publisher/platform-accounts/{account['id']}",
        token=other_token,
        payload={"followers_count": 999999},
        expected_status=404,
    )

    business_email = f"codex_day3_business_{suffix}@example.com"
    request(
        "POST",
        "/auth/register",
        payload={
            "display_name": "Codex Business Role Test",
            "email": business_email,
            "password": password,
        },
    )
    business_login = request(
        "POST",
        "/auth/login",
        payload={"email": business_email, "password": password},
    )
    business_token = business_login["access_token"]
    request(
        "POST",
        "/users/role",
        token=business_token,
        payload={"role": "BUSINESS"},
    )
    request(
        "GET",
        "/profiles/publisher/onboarding-options",
        token=business_token,
        expected_status=403,
    )
    assert_step(token, "MEDIA_PLANS", False)

    media_plan_payload = {
        "platform_account_id": account["id"],
        "content_type": "REEL",
        "price": "25000000.00",
        "typical_views": 8000,
    }
    media_plan = request(
        "POST",
        "/profiles/publisher/media-plans",
        token=token,
        payload=media_plan_payload,
        expected_status=201,
    )
    request(
        "POST",
        "/profiles/publisher/media-plans",
        token=token,
        payload=media_plan_payload,
        expected_status=409,
    )
    updated_media_plan = request(
        "PATCH",
        f"/profiles/publisher/media-plans/{media_plan['id']}",
        token=token,
        payload={"price": "26000000.00"},
    )
    assert updated_media_plan["price"] == "26000000.00"
    media_plans = request(
        "GET",
        "/profiles/publisher/media-plans",
        token=token,
    )
    assert len(media_plans) == 1
    assert_step(token, "PREFERENCES", False)

    category_ids = [item["id"] for item in options["categories"][:3]]
    request(
        "PUT",
        "/profiles/publisher/interests",
        token=token,
        payload={"category_ids": category_ids[:2]},
        expected_status=422,
    )
    request(
        "PUT",
        "/profiles/publisher/interests",
        token=token,
        payload={"category_ids": category_ids},
    )
    request(
        "PUT",
        "/profiles/publisher/capabilities",
        token=token,
        payload={"capabilities": ["REVIEW", "TUTORIAL"]},
    )
    interests = request(
        "GET",
        "/profiles/publisher/interests",
        token=token,
    )
    capabilities = request(
        "GET",
        "/profiles/publisher/capabilities",
        token=token,
    )
    assert len(interests["categories"]) == 3
    assert capabilities["capabilities"] == ["REVIEW", "TUTORIAL"]
    completed = assert_step(token, "COMPLETE", True)
    assert completed["active_platform_accounts"] == 1
    assert completed["active_media_plans"] == 1
    assert completed["interests_count"] == 3
    assert completed["capabilities_count"] == 2

    request(
        "DELETE",
        f"/profiles/publisher/media-plans/{media_plan['id']}",
        token=token,
        expected_status=204,
    )
    assert_step(token, "MEDIA_PLANS", False)

    replacement_plan = request(
        "POST",
        "/profiles/publisher/media-plans",
        token=token,
        payload=media_plan_payload,
        expected_status=201,
    )
    assert replacement_plan["id"] != media_plan["id"]
    assert_step(token, "COMPLETE", True)

    request(
        "DELETE",
        f"/profiles/publisher/platform-accounts/{account['id']}",
        token=token,
        expected_status=204,
    )
    final_status = assert_step(token, "PLATFORM_ACCOUNTS", False)
    assert final_status["active_media_plans"] == 0

    print("Day 3 publisher onboarding smoke test: PASS")
    print(f"Disposable test user: {email}")


if __name__ == "__main__":
    main()
