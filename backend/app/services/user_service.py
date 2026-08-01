from sqlalchemy.orm import Session

from backend.app.core.security.password import (
    hash_password,
    verify_password,
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
    2. Hash the password
    3. Create user in database
    4. Return created user
    """

    existing_user = get_user_by_email(
        db,
        email,
    )

    if existing_user:
        raise ValueError(
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

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
):
    """
    Authenticate an existing user.

    Flow:
    1. Find user by email
    2. Verify provided password against stored hash
    3. Return user if valid
    4. Return None if invalid
    """

    user = get_user_by_email(
        db,
        email,
    )

    if not user:
        return None

    password_valid = verify_password(
        password,
        user.password_hash,
    )

    if not password_valid:
        return None

    return user
