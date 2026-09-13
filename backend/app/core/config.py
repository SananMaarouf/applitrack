from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./data/applitrack.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    environment: Literal["development", "production", "testing"] = "development"

    # Clerk authentication
    clerk_secret_key: str = ""

    # Cloudflare R2 object storage
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def async_database_url(self) -> str:
        """
        The configured DATABASE_URL normalised to an async SQLAlchemy driver.

        Plain ``sqlite://`` URLs are rewritten to ``sqlite+aiosqlite://``.
        ``postgresql://`` is also handled so the one-off
        ``scripts/migrate_pg_to_sqlite.py`` can reuse this helper; the app itself
        no longer ships the asyncpg driver.
        """
        return normalize_async_url(self.database_url)


def normalize_async_url(url: str) -> str:
    """Rewrite a sync SQLAlchemy URL to its async driver equivalent."""
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


settings = Settings()
