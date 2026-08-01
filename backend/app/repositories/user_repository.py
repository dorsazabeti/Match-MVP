from sqlalchemy.orm import Session

from backend.app.models.user import User


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    """
    Find a user by email address.

    Returns:
        User object if found
        None if no user exists
    """

    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


def create_user(
    db: Session,
    email: str,
    password_hash: str,
) -> User:
    """
    Create a new user record in the database.
    """

    user = User(
        email=email,
        password_hash=password_hash,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user
