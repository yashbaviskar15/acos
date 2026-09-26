import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Set
import jwt
import pyotp
try:
    import bcrypt
    _has_bcrypt = True
except Exception:
    _has_bcrypt = False
from app.core.config import settings

# In-memory revocation denylist (stores jti or token sha256 hashes)
_revoked_tokens: Set[str] = set()

def revoke_token(token: str) -> bool:
    """Revoke an active access token by marking its hash and jti as invalidated."""
    if not token:
        return False
    clean_token = token.strip()
    token_hash = hashlib.sha256(clean_token.encode("utf-8")).hexdigest()
    _revoked_tokens.add(token_hash)
    try:
        payload = jwt.decode(clean_token, options={"verify_signature": False})
        jti = payload.get("jti")
        if jti:
            _revoked_tokens.add(str(jti))
    except Exception:
        pass
    return True

def is_token_revoked(token: str, payload: Optional[dict] = None) -> bool:
    """Check if token hash or jti is in the revocation denylist."""
    if not token:
        return True
    clean_token = token.strip()
    token_hash = hashlib.sha256(clean_token.encode("utf-8")).hexdigest()
    if token_hash in _revoked_tokens:
        return True
    if payload and "jti" in payload and str(payload["jti"]) in _revoked_tokens:
        return True
    return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False

    clean_plain = plain_password.strip()
    clean_hash = hashed_password.strip()

    # 1. Direct plaintext match (fallback)
    if clean_hash == plain_password or clean_hash == clean_plain:
        return True

    # 2. Bcrypt check (standard format: $2a$, $2b$, $2y$)
    if clean_hash.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            import bcrypt
            for pw in (plain_password, clean_plain):
                try:
                    if bcrypt.checkpw(pw.encode("utf-8"), clean_hash.encode("utf-8")):
                        return True
                except Exception:
                    pass
        except Exception:
            pass

    # 3. PBKDF2 check (pbkdf2:salt_hex:hash_hex)
    if clean_hash.startswith("pbkdf2:"):
        parts = clean_hash.split(":")
        if len(parts) == 3:
            try:
                salt = bytes.fromhex(parts[1])
                expected = parts[2]
                for pw in (plain_password, clean_plain):
                    computed = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, 100000).hex()
                    if computed == expected:
                        return True
            except Exception:
                pass

    # 4. SHA-256 check
    for pw in (plain_password, clean_plain):
        if hashlib.sha256(pw.encode("utf-8")).hexdigest().lower() == clean_hash.lower():
            return True

    # 5. MD5 check
    for pw in (plain_password, clean_plain):
        if hashlib.md5(pw.encode("utf-8")).hexdigest().lower() == clean_hash.lower():
            return True

    # 6. SHA-1 check
    for pw in (plain_password, clean_plain):
        if hashlib.sha1(pw.encode("utf-8")).hexdigest().lower() == clean_hash.lower():
            return True

    return False


def get_password_hash(password: str) -> str:
    if _has_bcrypt:
        try:
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        except Exception:
            pass
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000).hex()
    return f"pbkdf2:{salt.hex()}:{hashed}"

def create_access_token(
    subject: str | Any,
    roles: list[str] = None,
    expires_delta: Optional[timedelta] = None,
    user_obj: Any = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    clean_sub = str(subject).strip().lower()
    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": clean_sub,
        "jti": uuid.uuid4().hex,
    }
    if user_obj is not None and hasattr(user_obj, "role") and user_obj.role:
        canonical_role = str(user_obj.role).strip()
        to_encode["role"] = canonical_role
        to_encode["roles"] = [canonical_role]
    else:
        fallback = list(roles) if roles else ["Developer"]
        to_encode["roles"] = fallback
        if fallback:
            to_encode["role"] = fallback[0]

    if user_obj:
        if hasattr(user_obj, "id") and user_obj.id:
            to_encode["uid"] = user_obj.id
        if hasattr(user_obj, "account_id") and user_obj.account_id:
            to_encode["acc"] = user_obj.account_id
        if hasattr(user_obj, "workspace_id") and user_obj.workspace_id:
            to_encode["ws_id"] = user_obj.workspace_id
        if hasattr(user_obj, "workspace_name") and user_obj.workspace_name:
            to_encode["ws_name"] = user_obj.workspace_name
        if hasattr(user_obj, "full_name") and user_obj.full_name:
            to_encode["name"] = user_obj.full_name

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if is_token_revoked(token, payload):
            return None
        return payload
    except jwt.PyJWTError:
        return None

def generate_mfa_secret() -> str:
    return pyotp.random_base32()

def verify_mfa_token(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    code_clean = str(code).strip()

    env = os.environ.get("ENVIRONMENT", "").strip().lower()
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless and env == "local":
        raise RuntimeError(
            "ENVIRONMENT=local cannot be set in a serverless (Vercel/Lambda) deployment. "
            "This is a fatal misconfiguration — MFA bypass codes must never be reachable in production."
        )

    if env == "local":
        dev_master_codes = os.environ.get("MFA_DEV_MASTER_CODES", "").strip()
        if dev_master_codes:
            allowed = [c.strip() for c in dev_master_codes.split(",") if c.strip()]
            if code_clean in allowed:
                return True

    try:
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(code_clean, valid_window=2))
    except Exception:
        return False
