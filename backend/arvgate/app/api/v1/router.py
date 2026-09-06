from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aravanta_shared.security import authenticated_user_dependency, decode_jwt, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.models.entities import AuditEvent, User
from app.schemas.auth import (
    AuditEventResponse,
    MFAVerifyRequest,
    RolePolicyResponse,
    RefreshTokenRequest,
    RegisterResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserSummary,
)
from app.services.auth import (
    exchange_refresh_token,
    generate_totp_secret,
    generate_totp_uri,
    hash_password,
    issue_mfa_challenge_token,
    issue_token_pair,
    role_names,
    role_permissions,
    verify_password,
    verify_totp,
    write_audit_event,
)

router = APIRouter(prefix="/auth", tags=["ArvGate"])
current_user = authenticated_user_dependency(settings.jwt_secret_key, settings.jwt_algorithm)
audit_reader = require_roles(
    settings.jwt_secret_key,
    settings.jwt_algorithm,
    ["SuperAdmin", "Admin", "Auditor"],
)


async def resolve_user(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    existing_user = await resolve_user(session, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    role = "Developer"
    mfa_secret = generate_totp_secret()
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        roles=[role],
        permissions=role_permissions(role),
        mfa_secret=mfa_secret,
        mfa_enabled=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    await write_audit_event(
        session,
        actor_email=user.email,
        action="auth.register",
        resource="user",
        status="success",
        detail=f"Registered self-service user with role {role}",
        ip_address=request.client.host if request.client else "unknown",
    )

    return RegisterResponse(
        user=UserSummary.model_validate(user),
        mfa_secret=mfa_secret,
        totp_provisioning_uri=generate_totp_uri(user.email, mfa_secret),
        note="Store the TOTP secret in a real secrets manager or one-time enrollment flow before production.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await resolve_user(session, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account disabled")

    if not user.mfa_enabled:
        access_token, refresh_token, expires_in = await issue_token_pair(session, user)
        await write_audit_event(
            session,
            actor_email=user.email,
            action="auth.login.password",
            resource="session",
            status="success",
            detail="Password verified, issued access and refresh tokens",
            ip_address=request.client.host if request.client else "unknown",
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            mfa_required=False,
            user=UserSummary.model_validate(user),
        )

    await write_audit_event(
        session,
        actor_email=user.email,
        action="auth.login.password",
        resource="session",
        status="success",
        detail="Password verified, MFA challenge required",
        ip_address=request.client.host if request.client else "unknown",
    )
    return TokenResponse(
        challenge_token=issue_mfa_challenge_token(user),
        expires_in=300,
        mfa_required=user.mfa_enabled,
        user=UserSummary.model_validate(user),
    )


@router.post("/mfa/verify", response_model=TokenResponse)
async def verify_mfa(
    payload: MFAVerifyRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await resolve_user(session, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    challenge_payload = decode_jwt(
        payload.challenge_token,
        secret_key=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    if challenge_payload.get("type") != "mfa_challenge":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA challenge token required")
    if challenge_payload.get("sub") != user.email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA challenge token mismatch")
    if not verify_totp(user.mfa_secret, payload.mfa_code):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA code")

    access_token, refresh_token, expires_in = await issue_token_pair(session, user)
    await write_audit_event(
        session,
        actor_email=user.email,
        action="auth.login.mfa",
        resource="session",
        status="success",
        detail="Issued access and refresh tokens after MFA verification",
        ip_address=request.client.host if request.client else "unknown",
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        mfa_required=False,
        user=UserSummary.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    try:
        user, access_token, refresh_token, expires_in = await exchange_refresh_token(
            session, payload.refresh_token
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    await write_audit_event(
        session,
        actor_email=user.email,
        action="auth.refresh",
        resource="session",
        status="success",
        detail="Rotated refresh token",
        ip_address=request.client.host if request.client else "unknown",
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        mfa_required=False,
        user=UserSummary.model_validate(user),
    )


@router.get("/me", response_model=UserSummary)
async def me(
    identity=Depends(current_user),
    session: AsyncSession = Depends(get_db),
) -> UserSummary:
    user = await resolve_user(session, identity.subject)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserSummary.model_validate(user)


@router.get("/audit-logs", response_model=list[AuditEventResponse])
async def audit_logs(
    _identity=Depends(audit_reader),
    session: AsyncSession = Depends(get_db),
) -> list[AuditEvent]:
    result = await session.execute(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(100))
    return list(result.scalars().all())


@router.get("/rbac/roles", response_model=list[RolePolicyResponse])
async def list_role_policies(_identity=Depends(current_user)) -> list[RolePolicyResponse]:
    return [
        RolePolicyResponse(role=role, permissions=role_permissions(role))
        for role in sorted(role_names())
    ]
