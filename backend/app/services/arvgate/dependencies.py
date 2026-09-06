import uuid
import random
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import decode_access_token, get_password_hash
from app.services.arvgate.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_email: str = payload.get("sub")
    if user_email is None:
        raise credentials_exception
        
    user = db.query(User).filter(func.lower(User.email) == str(user_email).strip().lower()).first()
    if user is None:
        # Token signature was cryptographically verified by SECRET_KEY.
        # If running on serverless (Vercel) and the ephemeral container restarted,
        # restore the user record from verified JWT claims.
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

    if user is None or not user.is_active:
        raise credentials_exception
        
    return user

def get_current_user_optional(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_email = payload.get("sub")
    if not user_email:
        return None
    return db.query(User).filter(func.lower(User.email) == str(user_email).strip().lower()).first()

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

