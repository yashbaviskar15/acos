from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
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
        
    user = db.query(User).filter(User.email == user_email).first()
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
    return db.query(User).filter(User.email == user_email).first()

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

