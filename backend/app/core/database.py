from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.app.core.config import get_settings


settings = get_settings()


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.

    Future models such as User, BusinessProfile, and PublisherProfile
    will inherit from this class.
    """

    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.debug,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Create one database session for one request.

    The session is always closed after the request finishes,
    even if an error occurs.
    """

    database_session = SessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()
