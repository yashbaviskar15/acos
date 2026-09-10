import uuid
import random
import hashlib
import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import decode_access_token, get_password_hash
from app.services.arvgate.models import User
from app.core.cloud_models import ApiKeyRecord

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Check Bearer JWT token
    if token:
        payload = decode_access_token(token)
        if payload is not None:
            user_email: str = payload.get("sub")
            if user_email is not None:
                user = db.query(User).filter(func.lower(User.email) == str(user_email).strip().lower()).first()
                if user is None:
                    # Token signature was cryptographically verified by SECRET_KEY.
                    uid = payload.get("uid") or str(uuid.uuid4())
                    name = payload.get("name") or user_email.split("@")[0].replace(".", " ").title()
                    acc = payload.get("acc") or f"ARV-ACC-{random.randint(100000, 999999)}"
                    ws_id = payload.get("ws_id") or f"ws-{random.randint(10000, 99999)}"
                    ws_name = payload.get("ws_name") or f"{name}'s Workspace"
                    roles = payload.get("roles") or ["Developer"]
                    role = payload.get("role") or (roles[0] if isinstance(roles, list) and roles else "Developer")
                    
                    import secrets
                    user = User(
                        id=uid,
                        account_id=acc,
                        workspace_id=ws_id,
                        workspace_name=ws_name,
                        email=str(user_email).strip().lower(),
                        full_name=name,
                        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                        role=role,
                        is_active=True,
                        is_mfa_enabled=False
                    )
                    try:
                        db.add(user)
                        db.commit()
                        db.refresh(user)
                    except Exception:
                        db.rollback()
                        user = db.query(User).filter(func.lower(User.email) == str(user_email).strip().lower()).first()

                if user is not None and user.is_active:
                    return user

    # 2. Check X-API-Key header (e.g. for CI/CD runners, Terraform, monitoring agents)
    if x_api_key:
        key_clean = x_api_key.strip()
        key_hash = hashlib.sha256(key_clean.encode("utf-8")).hexdigest()
        key_record = db.query(ApiKeyRecord).filter(
            ApiKeyRecord.key_hash == key_hash,
            ApiKeyRecord.is_active == True
        ).first()

        if key_record:
            if key_record.expires_at and key_record.expires_at < datetime.datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired"
                )
            try:
                key_record.last_used_at = datetime.datetime.utcnow()
                db.commit()
            except Exception:
                db.rollback()

            user = db.query(User).filter(User.id == key_record.user_id).first()
            if user and user.is_active:
                return user

    raise credentials_exception

def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> User | None:
    try:
        return get_current_user(token=token, x_api_key=x_api_key, db=db)
    except Exception:
        return None

def get_current_user_flexible(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Strictly authenticate user from Bearer token without insecure fallback."""
    return get_current_user(token, db)

def require_roles(*allowed_roles):
    """
    Dependency factory to enforce RBAC.
    Accepts roles as a list, tuple, set, or separate string arguments.
    Roles are compared case-insensitively.
    'SuperAdmin' always passes (platform owner).
    Raises HTTP 403 FORBIDDEN if the authenticated user's role is not authorized.
    """
    flat_roles = set()
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            for item in r:
                flat_roles.add(str(item).strip().lower())
        else:
            flat_roles.add(str(r).strip().lower())

    def role_checker(user: User = Depends(get_current_user)) -> User:
        user_role = (user.role or "").strip().lower()
        if user_role == "superadmin":
            return user
        if user_role not in flat_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{user.role}' is not authorized to perform this operation."
            )
        return user

    return role_checker

