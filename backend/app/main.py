from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import api_router
from backend.app.core.config import get_settings


settings = get_settings()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    debug=settings.debug,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)


@app.get("/")
def read_root() -> dict[str, str]:
    """
    Basic root endpoint for confirming that the API is running.
    """

    return {
        "message": "Match MVP Python Backend is running!",
        "documentation": "/docs",
    }
