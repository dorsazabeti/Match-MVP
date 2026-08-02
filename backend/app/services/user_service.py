from sqlalchemy.orm import Session

from backend.app.core.exceptions import UserAlreadyExists

from backend.app.core.security.password import (
    hash_password,
)

from backend.app.repositories.user_repository import (
    create_user,
    get_user_by_email,
)


def register_user(
    db: Session,
    email: str,
    password: str,
):
    """
    Register a new user.

    Flow:
    1. Check if email already exists
    2. Hash password
    3. Create user
    4. Return created user
    """

    existing_user = get_user_by_email(
        db,
        email,
    )

    if existing_user:
        raise UserAlreadyExists(
            "Email already registered"
        )

    password_hash = hash_password(
        password
    )

    user = create_user(
        db,
        email,
        password_hash,
    )

