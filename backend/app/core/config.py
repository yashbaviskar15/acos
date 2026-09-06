import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aravanta CloudOS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security — MUST be overridden via SECRET_KEY env var in production
    SECRET_KEY: str = "aravanta_super_secret_jwt_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database — MUST be set to a PostgreSQL URL in production via DATABASE_URL env var
    # Examples:
    #   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
    #   postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
    DATABASE_URL: str = ""

    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS — comma-separated list of browser origins allowed to call this API.
    BACKEND_CORS_ORIGINS: str = (
        "https://aravantacos.vercel.app,"
        "https://arv-frontend.vercel.app,"
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:3000"
    )

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        """Parsed list form of BACKEND_CORS_ORIGINS for CORSMiddleware."""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        """True when running on serverless / production."""
        return bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

settings = Settings()
