from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), env_file_encoding="utf-8", extra="ignore")

    database_url: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    environment: Literal["development", "production", "testing"] = "development"

    # Clerk authentication
    clerk_secret_key: str = ""

    # Sentry monitoring
    sentry_dsn: str = ""

    # Cloudflare R2 object storage
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
