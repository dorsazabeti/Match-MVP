from collections.abc import Generator

from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Create a database session for a request.

    The session is closed automatically
    after the request finishes.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
