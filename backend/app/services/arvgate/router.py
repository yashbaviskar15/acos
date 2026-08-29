import uuid
import secrets
import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, generate_mfa_secret, verify_mfa_token
from app.services.arvgate.models import User, AuditLog, generate_account_id
from app.services.arvgate.schemas import (
    UserRegister, UserLogin, TokenResponse, MFAVerifyRequest, 
    UserResponse, AuditLogResponse, PasswordResetRequest, PasswordResetConfirm
)
from app.services.arvgate.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/api/v1/auth", tags=["ArvGate — Identity & Access"])

_reset_tokens: dict[str, dict] = {}

class RoleUpdateRequest(BaseModel):
    role: str

class MFAEnableRequest(BaseModel):
    mfa_code: str

def log_audit(db: Session, email: str, action: str, resource: str, request: Request = None, details: str = None):
    ip_addr = request.client.host if request and request.client else "127.0.0.1"
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_email=email,
        action=action,
        resource=resource,
        ip_address=ip_addr,
        details=details
    )
    db.add(audit)
    db.commit()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_id = str(uuid.uuid4())
    account_id = f"ARV-ACC-{random.randint(100000, 999999)}"
    hashed_pwd = get_password_hash(user_in.password)
    mfa_secret = generate_mfa_secret()
    assigned_role = user_in.role if user_in.role in ["SuperAdmin", "Admin", "Developer", "Viewer"] else "Developer"

    new_user = User(
        id=user_id,
        account_id=account_id,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=assigned_role,
        mfa_secret=mfa_secret,
        is_mfa_enabled=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(db, new_user.email, "USER_REGISTER", "ArvGate", request, f"Registered user {new_user.full_name} with role '{assigned_role}' & Account ID {account_id}")
    return new_user

@router.post("/login", response_model=TokenResponse)
def login_user(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    identifier = login_in.email.strip()
    
    user = db.query(User).filter(
        or_(User.email == identifier, User.account_id == identifier)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email/Account ID or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # If user selected a specific system role during sign in, apply it immediately
    if login_in.role and login_in.role in ["SuperAdmin", "Admin", "Developer", "Viewer"]:
        user.role = login_in.role
        db.commit()
        db.refresh(user)

    if not user.account_id:
        user.account_id = f"ARV-ACC-{random.randint(100000, 999999)}"
        db.commit()
        db.refresh(user)

    # Check if MFA is enabled
    if user.is_mfa_enabled:
        return TokenResponse(
            access_token="",
            token_type="bearer",
            expires_in=0,
            user_id=user.id,
            account_id=user.account_id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_mfa_required=True
        )

    token = create_access_token(subject=user.email, roles=[user.role])
    log_audit(db, user.email, "USER_LOGIN", "ArvGate", request, f"Successful login for {user.full_name} ({user.account_id}) as {user.role}")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user_id=user.id,
        account_id=user.account_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_mfa_required=False
    )

@router.post("/mfa/setup")
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates secret key and TOTP setup details for Authenticator app."""
    if not current_user.mfa_secret:
        current_user.mfa_secret = generate_mfa_secret()
        db.commit()

    otpauth_url = f"otpauth://totp/AravantaCloudOS:{current_user.email}?secret={current_user.mfa_secret}&issuer=AravantaCloudOS"
    return {
        "mfa_secret": current_user.mfa_secret,
        "otpauth_url": otpauth_url,
        "email": current_user.email,
        "is_mfa_enabled": current_user.is_mfa_enabled
    }

@router.post("/mfa/enable")
def enable_mfa(req: MFAEnableRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Verifies test code and enables Multi-Factor Authentication."""
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA is not initialized. Run setup first.")

    if not verify_mfa_token(current_user.mfa_secret, req.mfa_code):
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification passcode. Check your authenticator app.")

    current_user.is_mfa_enabled = True
    db.commit()
    return {"message": "Multi-Factor Authentication (MFA) enabled successfully!", "is_mfa_enabled": True}

@router.post("/mfa/disable")
def disable_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Disables Multi-Factor Authentication."""
    current_user.is_mfa_enabled = False
    db.commit()
    return {"message": "Multi-Factor Authentication (MFA) disabled.", "is_mfa_enabled": False}

@router.post("/mfa/verify", response_model=TokenResponse)
def verify_mfa(mfa_in: MFAVerifyRequest, request: Request, db: Session = Depends(get_db)):
    identifier = mfa_in.email.strip()
    user = db.query(User).filter(
        or_(User.email == identifier, User.account_id == identifier)
    ).first()

    if not user or not user.mfa_secret:
        raise HTTPException(status_code=404, detail="User or MFA configuration not found")

    # Accept the real TOTP code OR dev bypass '000000'
    is_valid = verify_mfa_token(user.mfa_secret, mfa_in.mfa_code) or mfa_in.mfa_code == "000000"

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid 6-digit MFA passcode. Please check your authenticator app.")

    token = create_access_token(subject=user.email, roles=[user.role])
    log_audit(db, user.email, "USER_MFA_VERIFY", "ArvGate", request, "Successful MFA verification")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user_id=user.id,
        account_id=user.account_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_mfa_required=False
    )

@router.post("/mfa/current-code")
def get_mfa_current_code(mfa_in: MFAVerifyRequest, db: Session = Depends(get_db)):
    """Dev endpoint: returns the current valid TOTP code for testing."""
    import pyotp
    identifier = mfa_in.email.strip()
    user = db.query(User).filter(
        or_(User.email == identifier, User.account_id == identifier)
    ).first()
    if not user or not user.mfa_secret:
        raise HTTPException(status_code=404, detail="User not found")
    current_code = pyotp.TOTP(user.mfa_secret).now()
    return {"current_code": current_code, "valid_for_seconds": 30}

@router.post("/role/update")
def update_role(req: RoleUpdateRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates assigned system role for the user and issues an updated JWT token."""
    if req.role not in ["SuperAdmin", "Admin", "Developer", "Viewer"]:
        raise HTTPException(status_code=400, detail="Invalid system role specified")

    current_user.role = req.role
    db.commit()
    db.refresh(current_user)

    new_token = create_access_token(subject=current_user.email, roles=[current_user.role])
    log_audit(db, current_user.email, "ROLE_UPDATE", "ArvGate", request, f"System role changed to '{req.role}'")

    return {
        "message": f"System role updated to '{req.role}'",
        "role": current_user.role,
        "access_token": new_token,
        "user": {
            "id": current_user.id,
            "account_id": current_user.account_id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "is_mfa_enabled": current_user.is_mfa_enabled
        }
    }

@router.post("/password-reset/request")
def request_password_reset(req: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    token = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    _reset_tokens[req.email] = {"token": token, "expires_at": expires_at}

    if user:
        log_audit(db, req.email, "PASSWORD_RESET_REQUEST", "ArvGate", request, "Password reset code generated")

    return {
        "message": f"Verification code sent to {req.email}",
        "reset_token": token,
        "expires_in_minutes": 15
    }

@router.post("/password-reset/confirm")
def confirm_password_reset(req: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found matching this email address")

    record = _reset_tokens.get(req.email)
    if not record or record["token"] != req.reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if datetime.datetime.utcnow() > record["expires_at"]:
        del _reset_tokens[req.email]
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new code.")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    del _reset_tokens[req.email]

    log_audit(db, user.email, "PASSWORD_RESET_SUCCESS", "ArvGate", request, "Password reset successfully completed")

    return {"message": "Password updated successfully. You can now sign in with your new password."}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles(["SuperAdmin", "Admin", "Auditor"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs
