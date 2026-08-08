from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pyotp
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aravanta_shared.security import create_jwt, decode_jwt
from app.core.config import settings
from app.models.entities import AuditEvent, RefreshToken, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "SuperAdmin": ["*"],
    "Admin": ["auth:read", "auth:write", "compute:read", "kube:read", "audit:read"],
    "Auditor": ["audit:read", "auth:read"],
    "Developer": ["compute:read", "compute:write", "kube:read", "kube:write"],
    "Viewer": ["compute:read", "kube:read", "watch:read"],
}


def role_names() -> list[str]:
    return list(ROLE_PERMISSIONS.keys())


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def role_permissions(role: str) -> list[str]:
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["Viewer"])


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def generate_totp_uri(email: str, secret: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=settings.default_mfa_issuer)


def verify_totp(secret: str, code: str) -> bool:
    return pyotp.TOTP(secret).verify(code, valid_window=1)


async def write_audit_event(
    session: AsyncSession,
    *,
    actor_email: str,
    action: str,
    resource: str,
    status: str,
    detail: str,
    ip_address: str,
) -> None:
    session.add(
        AuditEvent(
            actor_email=actor_email,
            action=action,
            resource=resource,
            status=status,
            detail=detail,
            ip_address=ip_address,
        )
    )
    await session.commit()


def issue_mfa_challenge_token(user: User) -> str:
    return create_jwt(
        subject=user.email,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        expires_minutes=5,
        roles=user.roles,
        token_type="mfa_challenge",
        extra={"uid": user.id},
    )


async def issue_token_pair(session: AsyncSession, user: User) -> tuple[str, str, int]:
    access_ttl = settings.access_token_expire_minutes
    refresh_ttl = settings.refresh_token_expire_minutes
    refresh_token_id = str(uuid4())

    access_token = create_jwt(
        subject=user.email,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        expires_minutes=access_ttl,
        roles=user.roles,
        token_type="access",
        extra={"uid": user.id},
    )
    refresh_token = create_jwt(
        subject=user.email,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        expires_minutes=refresh_ttl,
        roles=user.roles,
        token_type="refresh",
        extra={"uid": user.id, "jti": refresh_token_id},
    )

    session.add(
        RefreshToken(
            user_id=user.id,
            token_id=refresh_token_id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=refresh_ttl),
        )
    )
    await session.commit()
    return access_token, refresh_token, access_ttl * 60


async def exchange_refresh_token(session: AsyncSession, refresh_token: str) -> tuple[User, str, str, int]:
    payload = decode_jwt(
        refresh_token,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    if payload.get("type") != "refresh":
        raise ValueError("Refresh token required")

    token_id = str(payload.get("jti", ""))
    result = await session.execute(select(RefreshToken).where(RefreshToken.token_id == token_id))
    token_record = result.scalar_one_or_none()
    if not token_record or token_record.revoked:
        raise ValueError("Refresh token not recognized")
    if token_record.expires_at <= datetime.now(timezone.utc):
        raise ValueError("Refresh token expired")

    token_record.revoked = True
    user_result = await session.execute(select(User).where(User.id == token_record.user_id))
    user = user_result.scalar_one()
    await session.commit()
    access_token, new_refresh_token, expires_in = await issue_token_pair(session, user)
    return user, access_token, new_refresh_token, expires_in
