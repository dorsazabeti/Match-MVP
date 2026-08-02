from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security.jwt import decode_access_token
from backend.app.repositories.user_repository import get_user_by_id


security_scheme = HTTPBearer()


def get_current_user(
    credentials=Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """
    Get the currently authenticated user from JWT token.

    Flow:
    1. Receive Authorization header
    2. Extract Bearer token
    3. Decode JWT token
    4. Extract user ID from token
    5. Find user in database
    6. Return user object
    """

    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = get_user_by_id(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
