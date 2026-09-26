import os
import re
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aravanta CloudOS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"

    BACKEND_CORS_ORIGINS: str = (
        "https://aravantacos.vercel.app,"
        "https://arv-frontend.vercel.app,"
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:3000"
    )

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError(
                "SECRET_KEY is required and must be a non-empty string. "
                "Set it via environment variable or .env file. "
                "Generate a secure one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        stripped = v.strip()
        insecure_patterns = [
            r"^change.?me$",
            r"^aravanta_super_secret",
            r"^default$",
            r"^test123$",
            r"changeme",
            r"^please.?change",
        ]
        lowered = stripped.lower()
        for pat in insecure_patterns:
            if re.search(pat, lowered):
                raise ValueError(
                    "SECRET_KEY looks like an insecure placeholder. "
                    "Generate a real secret with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
                )
        if len(stripped) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters for HS256 cryptographic safety. "
                "Generate a secure one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        return stripped

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

settings = Settings()
