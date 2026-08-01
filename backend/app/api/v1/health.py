from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.core.database import get_db


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
def health_check() -> dict[str, str]:
    """
    Confirm that the FastAPI application is running.
    """

    return {
        "status": "ok",
        "service": "match-mvp-api",
    }


@router.get("/database")
def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Confirm that FastAPI can communicate with PostgreSQL.
    """

    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }
