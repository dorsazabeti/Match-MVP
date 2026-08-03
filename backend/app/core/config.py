from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Pydantic validates the values when the application starts.
    """

    app_name: str = "Match MVP Backend"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str
    jwt_secret_key: str
    jwt_access_token_expire_minutes: int = 30
    publisher_currency: str = "IRR"
    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Create the settings object once and reuse it.

    This avoids reading and validating the environment file
    repeatedly during the application's lifetime.
    """

    return Settings()
