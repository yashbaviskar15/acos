import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aravanta CloudOS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "aravanta_super_secret_jwt_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev convenience

    # Database
    DATABASE_URL: str = "sqlite:///./aravanta_dev.db"  # Relative path - will be resolved to persistent data/ directory locally. For production, set to PostgreSQL URL.
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS — comma-separated list of browser origins allowed to call this API.
    # A wildcard "*" is INVALID together with credentials (browsers reject that
    # combination), so the production frontend origin is declared explicitly.
    # Override with the BACKEND_CORS_ORIGINS environment variable as needed.
    BACKEND_CORS_ORIGINS: str = (
        "https://acos-taupe.vercel.app,"
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

settings = Settings()
