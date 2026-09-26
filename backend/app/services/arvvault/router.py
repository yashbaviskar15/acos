from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.arvvault.models import ArvVaultSecret, ArvVaultKey, ArvKeyAuditLog
import datetime

router = APIRouter(prefix="/api/v1/vault", tags=["ArvVault"])

class CreateSecretRequest(BaseModel):
    name: str
    description: Optional[str] = None
    value: str
    encryption_algorithm: str = "AES-256-GCM"
    auto_rotate_days: int = 0

class UpdateSecretRequest(BaseModel):
    value: str

class CreateKeyRequest(BaseModel):
    name: str
    algorithm: str = "AES-256-GCM"
    purpose: str = "ENCRYPT_DECRYPT"
    rotation_period_days: int = 0

class CryptoRequest(BaseModel):
    data: str

def log_audit(db, key_id, action, actor="system", ip="0.0.0.0"):
    log = ArvKeyAuditLog(key_id=key_id, action=action, actor_email=actor, ip_address=ip)
    db.add(log)
    db.commit()

@router.get("/secrets")
def list_secrets(db: Session = Depends(get_db)):
    secrets = db.query(ArvVaultSecret).all()
    return [s.to_dict() for s in secrets]

@router.post("/secrets")
def create_secret(req: CreateSecretRequest, db: Session = Depends(get_db)):
    from app.core.crypto import encrypt_aes256gcm, PLATFORM_MASTER_KEY
    encrypted_val = encrypt_aes256gcm(PLATFORM_MASTER_KEY, req.value)
    secret = ArvVaultSecret(
        name=req.name,
        description=req.description,
        encrypted_value=encrypted_val,
        encryption_algorithm=req.encryption_algorithm,
        auto_rotate_days=req.auto_rotate_days
    )
    db.add(secret)
    db.commit()
    db.refresh(secret)
    log_audit(db, secret.id, "CREATE")
    return secret.to_dict()

@router.get("/secrets/{secret_id}")
def get_secret(secret_id: str, db: Session = Depends(get_db)):
    secret = db.query(ArvVaultSecret).filter(ArvVaultSecret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    return secret.to_dict()

@router.post("/secrets/{secret_id}/access")
def access_secret(secret_id: str, db: Session = Depends(get_db)):
    secret = db.query(ArvVaultSecret).filter(ArvVaultSecret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    
    secret.access_count += 1
    secret.last_accessed_at = datetime.datetime.utcnow()
    db.commit()
    log_audit(db, secret_id, "ACCESS")
    
    data = secret.to_dict(include_val=True)
    if secret.encrypted_value:
        from app.core.crypto import decrypt_aes256gcm, PLATFORM_MASTER_KEY
        try:
            data["value"] = decrypt_aes256gcm(PLATFORM_MASTER_KEY, secret.encrypted_value)
            del data["encrypted_value"]
        except Exception:
            pass # Keep encrypted_value if decryption fails (e.g. old unencrypted data in dev)
    return data

@router.put("/secrets/{secret_id}")
def update_secret(secret_id: str, req: UpdateSecretRequest, db: Session = Depends(get_db)):
    secret = db.query(ArvVaultSecret).filter(ArvVaultSecret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    from app.core.crypto import encrypt_aes256gcm, PLATFORM_MASTER_KEY
    secret.encrypted_value = encrypt_aes256gcm(PLATFORM_MASTER_KEY, req.value)
    secret.key_version += 1
    secret.updated_at = datetime.datetime.utcnow()
    db.commit()
    log_audit(db, secret_id, "ROTATE")
    return secret.to_dict()

@router.delete("/secrets/{secret_id}")
def delete_secret(secret_id: str, db: Session = Depends(get_db)):
    secret = db.query(ArvVaultSecret).filter(ArvVaultSecret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    db.delete(secret)
    db.commit()
    log_audit(db, secret_id, "DESTROY")
    return {"status": "deleted"}

@router.post("/secrets/{secret_id}/rotate")
def rotate_secret(secret_id: str, req: UpdateSecretRequest, db: Session = Depends(get_db)):
    secret = db.query(ArvVaultSecret).filter(ArvVaultSecret.id == secret_id).first()
    if not secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    from app.core.crypto import encrypt_aes256gcm, PLATFORM_MASTER_KEY
    secret.encrypted_value = encrypt_aes256gcm(PLATFORM_MASTER_KEY, req.value)
    secret.key_version += 1
    secret.last_rotated_at = datetime.datetime.utcnow()
    db.commit()
    log_audit(db, secret_id, "ROTATE")
    return secret.to_dict()

@router.get("/keys")
def list_keys(db: Session = Depends(get_db)):
    keys = db.query(ArvVaultKey).all()
    return [k.to_dict() for k in keys]

@router.post("/keys")
def create_key(req: CreateKeyRequest, db: Session = Depends(get_db)):
    from app.core.crypto import generate_key_material
    raw_key, key_hash = generate_key_material()
    key = ArvVaultKey(
        name=req.name,
        algorithm=req.algorithm,
        purpose=req.purpose,
        rotation_period_days=req.rotation_period_days,
        key_material=raw_key,
        key_material_hash=key_hash,
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    log_audit(db, key.id, "CREATE")
    return key.to_dict()

@router.post("/keys/{key_id}/encrypt")
def encrypt_with_key(key_id: str, req: CryptoRequest, db: Session = Depends(get_db)):
    key = db.query(ArvVaultKey).filter(ArvVaultKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    if key.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Key is not active")
    if not key.key_material:
        raise HTTPException(status_code=400, detail="Key has no material — regenerate key")
    from app.core.crypto import encrypt_aes256gcm
    encrypted = encrypt_aes256gcm(key.key_material, req.data)
    log_audit(db, key_id, "ENCRYPT")
    return {"ciphertext": encrypted, "algorithm": key.algorithm, "key_id": key_id}

@router.post("/keys/{key_id}/decrypt")
def decrypt_with_key(key_id: str, req: CryptoRequest, db: Session = Depends(get_db)):
    key = db.query(ArvVaultKey).filter(ArvVaultKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    if not key.key_material:
        raise HTTPException(status_code=400, detail="Key has no material")
    from app.core.crypto import decrypt_aes256gcm
    try:
        plaintext = decrypt_aes256gcm(key.key_material, req.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Decryption failed: {str(e)}")
    log_audit(db, key_id, "DECRYPT")
    return {"plaintext": plaintext, "algorithm": key.algorithm, "key_id": key_id}

@router.get("/audit-log")
def get_audit_log(db: Session = Depends(get_db)):
    logs = db.query(ArvKeyAuditLog).order_by(ArvKeyAuditLog.timestamp.desc()).limit(100).all()
    return [log.to_dict() for log in logs]
