from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from typing import Any


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)
    full_name: str = Field(min_length=2, max_length=255)

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and "role" in data:
            raise ValueError("Client-specified 'role' is forbidden. Roles are server-assigned and immutable during registration.")
        return data


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and "role" in data:
            raise ValueError("Client-specified 'role' is forbidden. Roles cannot be selected or changed at login time.")
        return data


class MFAVerifyRequest(BaseModel):
    email: EmailStr
    challenge_token: str = Field(min_length=20)
    mfa_code: str = Field(min_length=6, max_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    roles: list[str]
    permissions: list[str]
    mfa_enabled: bool
    fido2_registered: bool
    is_active: bool


class RegisterResponse(BaseModel):
    user: UserSummary
    mfa_secret: str
    totp_provisioning_uri: str
    note: str


class TokenResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    challenge_token: str | None = None
    token_type: str = "bearer"
    expires_in: int = 0
    mfa_required: bool = False
    user: UserSummary | None = None


class RolePolicyResponse(BaseModel):
    role: str
    permissions: list[str]


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_email: str
    action: str
    resource: str
    status: str
    detail: str
    ip_address: str
    created_at: datetime
