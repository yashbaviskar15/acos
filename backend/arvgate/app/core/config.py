from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "arvgate"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./arvgate.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_minutes: int = 60 * 24 * 7
    default_mfa_issuer: str = "Aravanta CloudOS"

    model_config = SettingsConfigDict(
        env_prefix="ARVGATE_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
