from fastapi import APIRouter

from backend.app.api.v1.auth.router import router as auth_router
from backend.app.api.v1.users.router import router as users_router
from backend.app.api.v1.profiles.router import router as profiles_router
from backend.app.api.v1.profiles.publisher_onboarding_router import (
    router as publisher_onboarding_router,
)


api_router = APIRouter()


api_router.include_router(
    auth_router
)

api_router.include_router(
    users_router
)

api_router.include_router(
    profiles_router
)

api_router.include_router(
    publisher_onboarding_router
)
