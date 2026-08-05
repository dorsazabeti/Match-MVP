from __future__ import annotations

import hashlib
import json
import socket
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Protocol

from pydantic import ValidationError

from backend.app.core.config import get_settings
from backend.app.models.ai_log import AiLog
from backend.app.models.offer import Offer
from backend.app.models.promotion import Promotion
from backend.app.repositories.promotion_repository import CandidateData
from backend.app.schemas.package import (
    ExchangePackage,
    PackageCandidate,
    PackageSelectionOutput,
)


SYSTEM_INSTRUCTION = """You select exactly one package only from supplied valid candidates.
Do not invent deliverables, prices, platforms, quantities, facts, or performance.
Optimize for fairness, simplicity, marketing-goal fit, publisher capability, and acceptance likelihood.
Return JSON only. Keep the reason under 180 characters."""

REPAIR_INSTRUCTION = """The previous response was invalid. Return only JSON matching the schema,
and choose a candidate_id that exists in candidate_packages."""


class LlmSelectionError(Exception):
    code = "LLM_ERROR"
    retryable = False


class LlmTimeoutError(LlmSelectionError):
    code = "TIMEOUT"
    retryable = True


class LlmInvalidResponseError(LlmSelectionError):
    code = "INVALID_RESPONSE"
    retryable = True


class LlmProviderError(LlmSelectionError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


@dataclass
class ProviderResponse:
    output_text: str
    input_tokens: int | None
    output_tokens: int | None


class PackageSelector(Protocol):
    def select(self, payload: dict, *, repair: bool = False) -> ProviderResponse:
        ...


class OpenAIResponsesSelector:
    def select(self, payload: dict, *, repair: bool = False) -> ProviderResponse:
        settings = get_settings()
        if settings.openai_api_key is None:
            raise LlmProviderError("API_KEY_MISSING")

        instruction = SYSTEM_INSTRUCTION
        if repair:
            instruction = f"{instruction}\n\n{REPAIR_INSTRUCTION}"
        body = {
            "model": settings.openai_model,
            "instructions": instruction,
            "input": json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            "reasoning": {"effort": settings.openai_reasoning_effort},
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "package_selection",
                    "strict": True,
                    "schema": PackageSelectionOutput.model_json_schema(),
                }
            },
            "max_output_tokens": 300,
            "store": False,
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": (
                    "Bearer " + settings.openai_api_key.get_secret_value()
                ),
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(
                request,
                timeout=settings.openai_timeout_seconds,
            ) as response:
                decoded = json.loads(response.read())
        except (TimeoutError, socket.timeout) as error:
            raise LlmTimeoutError() from error
        except urllib.error.HTTPError as error:
            raise LlmProviderError(f"HTTP_{error.code}") from error
        except urllib.error.URLError as error:
            if isinstance(error.reason, (TimeoutError, socket.timeout)):
                raise LlmTimeoutError() from error
            raise LlmProviderError("NETWORK_ERROR") from error
        except (json.JSONDecodeError, KeyError) as error:
            raise LlmInvalidResponseError() from error

        output_text = next(
            (
                content["text"]
                for item in decoded.get("output", [])
                if item.get("type") == "message"
                for content in item.get("content", [])
                if content.get("type") == "output_text"
            ),
            None,
        )
        if not output_text:
            raise LlmInvalidResponseError()
        usage = decoded.get("usage", {})
        return ProviderResponse(
            output_text=output_text,
            input_tokens=usage.get("input_tokens"),
            output_tokens=usage.get("output_tokens"),
        )


def _selection_payload(
    offer: Offer,
    promotion: Promotion,
    candidate: CandidateData,
    packages: list[PackageCandidate],
) -> dict:
    return {
        "offer": {
            "id": str(offer.id),
            "title": offer.title,
            "category_id": str(offer.category_id),
            "reward_type": offer.reward_type,
            "retail_value": str(offer.retail_value) if offer.retail_value else None,
            "cash_amount": str(offer.cash_amount) if offer.cash_amount else None,
            "currency": offer.currency,
            "remotely_fulfillable": offer.remotely_fulfillable,
        },
        "promotion": {
            "goal": promotion.goal,
            "target_city": promotion.target_city,
            "preferred_platforms": promotion.preferred_platforms,
            "brief": promotion.brief,
        },
        "publisher_public_profile": {
            "public_name": candidate.profile.public_name,
            "city": candidate.profile.city,
            "capabilities": sorted(candidate.capabilities),
            "platforms": sorted(
                {account.platform for account in candidate.accounts.values()}
            ),
        },
        "candidate_packages": [
            package.model_dump(mode="json") for package in packages
        ],
    }


def _fallback_selection(
    package: PackageCandidate,
    *,
    widened: bool,
) -> PackageSelectionOutput:
    risk_flags = ["WIDENED_FAIR_VALUE_BAND"] if widened else []
    reason = (
        "نزدیک‌ترین بسته معتبر به ارزش پیشنهاد، با ساختار ساده و متناسب با هدف کمپین انتخاب شد."
    )
    confidence = float(package.deterministic_rank_score)
    if widened:
        confidence = min(confidence, 0.65)
    return PackageSelectionOutput(
        candidate_id=package.candidate_id,
        reason=reason,
        confidence=confidence,
        risk_flags=risk_flags,
    )


def select_exchange_package(
    *,
    offer: Offer,
    promotion: Promotion,
    candidate: CandidateData,
    packages: list[PackageCandidate],
    selector: PackageSelector | None = None,
) -> tuple[ExchangePackage, AiLog]:
    if not packages:
        raise ValueError("At least one valid package candidate is required")
    settings = get_settings()
    payload = _selection_payload(offer, promotion, candidate, packages)
    canonical = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    request_hash = hashlib.sha256(canonical).hexdigest()
    allowed = {item.candidate_id: item for item in packages}
    started = time.perf_counter()
    input_tokens = 0
    output_tokens = 0
    attempts = 0
    error_code: str | None = None
    selected: PackageSelectionOutput | None = None

    if settings.llm_selection_enabled:
        provider = selector or OpenAIResponsesSelector()
        for attempt in range(2):
            attempts += 1
            try:
                response = provider.select(payload, repair=attempt == 1)
                input_tokens += response.input_tokens or 0
                output_tokens += response.output_tokens or 0
                parsed = PackageSelectionOutput.model_validate_json(
                    response.output_text
                )
                if parsed.candidate_id not in allowed:
                    raise LlmInvalidResponseError()
                selected = parsed
                break
            except (ValidationError, json.JSONDecodeError) as error:
                error_code = "INVALID_RESPONSE"
                if attempt == 1:
                    break
            except LlmSelectionError as error:
                error_code = error.code
                if not error.retryable or attempt == 1:
                    break
    else:
        error_code = "LLM_DISABLED"

    fallback_used = selected is None
    if selected is None:
        selected = _fallback_selection(
            packages[0],
            widened=packages[0].fair_value_band.widened,
        )
    selected_package = allowed[selected.candidate_id]
    if fallback_used:
        confidence = float(selected_package.deterministic_rank_score)
    else:
        confidence = (
            selected.confidence
            + float(selected_package.deterministic_rank_score)
        ) / 2
    if selected_package.fair_value_band.widened:
        confidence = min(confidence, 0.65)

    reward_value = (offer.retail_value or 0) + (offer.cash_amount or 0)
    package = ExchangePackage(
        version="exchange-package-v1",
        candidate_id=selected_package.candidate_id,
        goal=promotion.goal,
        platform=selected_package.platform,
        deliverables=selected_package.deliverables,
        total_items=selected_package.total_items,
        total_media_value=selected_package.total_media_value,
        currency=selected_package.currency,
        reward={
            "offer_id": offer.id,
            "reward_type": offer.reward_type,
            "offer_units": (
                offer.units_per_deal if offer.reward_type != "CASH" else 0
            ),
            "retail_value": offer.retail_value,
            "cash_amount": offer.cash_amount,
            "total_reward_value": reward_value,
        },
        value_ratio=selected_package.value_ratio,
        fair_value_band=selected_package.fair_value_band,
        selection={
            "method": "DETERMINISTIC_FALLBACK" if fallback_used else "LLM",
            "reason": selected.reason,
            "confidence": confidence,
            "risk_flags": selected.risk_flags,
            "prompt_version": settings.ai_prompt_version,
            "model": settings.openai_model,
        },
    )
    latency_ms = int((time.perf_counter() - started) * 1000)
    ai_log = AiLog(
        purpose="PACKAGE_SELECTION",
        prompt_version=settings.ai_prompt_version,
        model=settings.openai_model,
        request_hash=request_hash,
        latency_ms=latency_ms,
        input_tokens=input_tokens or None,
        output_tokens=output_tokens or None,
        success=not fallback_used,
        fallback_used=fallback_used,
        error_code=error_code if fallback_used else None,
        result_json={
            "candidate_id": package.candidate_id,
            "method": package.selection.method,
            "confidence": package.selection.confidence,
            "risk_flags": package.selection.risk_flags,
            "attempts": attempts,
            "candidate_count": len(packages),
        },
    )
    return package, ai_log
