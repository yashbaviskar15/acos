import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, model_validator, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    workspace_name: Optional[str] = "Production Cloud Ops"

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and "role" in data:
            raise ValueError(
                "Client-specified 'role' is forbidden. Roles are server-assigned and immutable during registration."
            )
        return data

class UserLogin(BaseModel):
    email: str  # Accepts either Email (e.g. user@domain.com) OR Account ID (e.g. ARV-ACC-123456)
    password: str

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and "role" in data:
            raise ValueError(
                "Client-specified 'role' is forbidden. Roles cannot be selected or changed at login time."
            )
        return data

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    account_id: Optional[str] = None
    workspace_id: Optional[str] = None
    workspace_name: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    role: str
    is_mfa_required: bool = False
    is_mfa_enabled: bool = False

class MFAVerifyRequest(BaseModel):
    email: str
    mfa_code: str

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and ("role" in data or "roles" in data or "permissions" in data or "scopes" in data):
            raise ValueError(
                "Client-specified role/permissions/scopes are forbidden on MFA verification. "
                "Identity is derived exclusively from the verified server session."
            )
        return data

class PasswordResetRequest(BaseModel):
    email: EmailStr

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and ("role" in data or "roles" in data or "permissions" in data or "scopes" in data):
            raise ValueError(
                "Client-specified role/permissions/scopes are forbidden on password reset requests."
            )
        return data

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and ("role" in data or "roles" in data or "permissions" in data or "scopes" in data):
            raise ValueError(
                "Client-specified role/permissions/scopes are forbidden on password reset confirmation. "
                "Roles are never mutated during account recovery."
            )
        return data

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and ("role" in data or "roles" in data or "permissions" in data or "scopes" in data):
            raise ValueError(
                "Client-specified role/permissions/scopes are forbidden on password change."
            )
        return data

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    workspace_name: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def reject_client_role(cls, data: Any) -> Any:
        if isinstance(data, dict) and ("role" in data or "roles" in data or "permissions" in data or "scopes" in data):
            raise ValueError(
                "Client-specified role/permissions/scopes are forbidden on profile updates. "
                "Role changes require a separate, explicitly-audited admin action."
            )
        return data

class UserResponse(BaseModel):
    id: str
    account_id: Optional[str] = None
    workspace_id: Optional[str] = None
    workspace_name: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    is_mfa_enabled: bool
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    workspace_id: Optional[str] = None
    user_email: str
    action: str
    resource: str
    ip_address: Optional[str]
    details: Optional[str]
    timestamp: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class OAuthLoginRequest(BaseModel):
    provider: str  # "google" or "github"
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    oauth_id: Optional[str] = None
    code: Optional[str] = None
