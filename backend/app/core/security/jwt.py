from datetime import datetime, timedelta, timezone

import jwt

from backend.app.core.config import get_settings


settings = get_settings()

ALGORITHM = "HS256"


def create_access_token(user_id: str) -> str:
    """
    Create a JWT token containing the user's ID.
    """

    expire_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )

    payload = {
        "sub": user_id,
        "exp": expire_time,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=ALGORITHM,
    )

    return token


def decode_access_token(token: str) -> dict:
    """
    Decode and verify a JWT token.
    """

    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[ALGORITHM],
    )

    return payload
