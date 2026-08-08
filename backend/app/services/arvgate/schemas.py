import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "Developer"

class UserLogin(BaseModel):
    email: str  # Accepts either Email (e.g. user@domain.com) OR Account ID (e.g. ARV-ACC-123456)
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    account_id: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    role: str
    is_mfa_required: bool = False

class MFAVerifyRequest(BaseModel):
    email: str
    mfa_code: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    account_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    is_mfa_enabled: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    user_email: str
    action: str
    resource: str
    ip_address: Optional[str]
    details: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
