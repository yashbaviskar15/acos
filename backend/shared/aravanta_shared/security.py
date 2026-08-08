from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

http_bearer = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    subject: str
    roles: list[str] = Field(default_factory=list)
    token_type: str = "access"


def create_jwt(
    *,
    subject: str,
    secret_key: str,
    algorithm: str,
    expires_minutes: int,
    roles: list[str] | None = None,
    token_type: str = "access",
    extra: dict[str, Any] | None = None,
) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "roles": roles or [],
        "type": token_type,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_jwt(token: str, *, secret_key: str, algorithm: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, secret_key, algorithms=[algorithm])
    except jwt.PyJWTError as exc:  # pragma: no cover - library exception mapping
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def authenticated_user_dependency(secret_key: str, algorithm: str) -> Callable[..., AuthenticatedUser]:
    async def dependency(
        credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    ) -> AuthenticatedUser:
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Bearer token required",
            )

        payload = decode_jwt(credentials.credentials, secret_key=secret_key, algorithm=algorithm)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token required",
            )

        return AuthenticatedUser(
            subject=str(payload.get("sub", "")),
            roles=list(payload.get("roles", [])),
            token_type=str(payload.get("type", "access")),
        )

    return dependency


def require_roles(
    secret_key: str,
    algorithm: str,
    allowed_roles: list[str],
) -> Callable[..., AuthenticatedUser]:
    auth_dependency = authenticated_user_dependency(secret_key, algorithm)

    async def dependency(user: AuthenticatedUser = Depends(auth_dependency)) -> AuthenticatedUser:
        if not set(user.roles).intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this action",
            )
        return user

    return dependency
