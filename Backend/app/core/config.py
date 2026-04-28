from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Disaster Relief Backend"
    app_env: str = "development"
    debug: bool = True

    # Server — Railway injects $PORT automatically
    port: int = 8000

    # Database
    # Railway provides DATABASE_URL automatically when you attach a Postgres service.
    # asyncpg driver requires the postgresql+asyncpg:// scheme.
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/disaster_relief"
    sync_database_url: str = "postgresql://postgres:password@localhost:5432/disaster_relief"

    # Security
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    whatsapp_from: str = "whatsapp:+14155238886"
    whatsapp_verify_token: str = "verify_token"

    # Rate Limiting
    rate_limit_per_minute: int = 60

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore unknown Railway-injected env vars


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()