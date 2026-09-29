"""
Aravanta Cloud OS — Cloud Providers Management Router
Encrypted via ArvVault (AES-256-GCM), with real authenticated TEST CONNECTION.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
import json
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.crypto import encrypt_aes256gcm, decrypt_aes256gcm, PLATFORM_MASTER_KEY
from app.core.providers import get_provider
from .models import CloudProviderCredential

router = APIRouter(prefix="/api/v1/providers", tags=["Cloud Providers"])

class RegisterCredentialRequest(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    provider: str
    name: str
    credentials: Dict[str, Any]

@router.get("/credentials")
def list_credentials(user_id: str, db: Session = Depends(get_db)):
    creds = db.query(CloudProviderCredential).filter(CloudProviderCredential.user_id == user_id).all()
    # Mask all secrets in output
    results = []
    for c in creds:
        d = c.to_dict()
        results.append(d)
    return results

@router.post("/credentials")
def register_credential(req: RegisterCredentialRequest, db: Session = Depends(get_db)):
    provider_name = req.provider.upper()
    cred_id = f"cred-{str(uuid.uuid4())[:12]}"
    encrypted = encrypt_aes256gcm(PLATFORM_MASTER_KEY, json.dumps(req.credentials))
    
    new_cred = CloudProviderCredential(
        id=cred_id,
        user_id=req.user_id,
        workspace_id=req.workspace_id,
        provider=provider_name,
        name=req.name,
        encrypted_credentials=encrypted,
        status="NOT_CONFIGURED"
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    return new_cred.to_dict()

@router.post("/credentials/{cred_id}/test")
def test_credential(cred_id: str, db: Session = Depends(get_db)):
    cred = db.query(CloudProviderCredential).filter(CloudProviderCredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    try:
        raw_creds = json.loads(decrypt_aes256gcm(PLATFORM_MASTER_KEY, cred.encrypted_credentials))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to decrypt credentials using ArvVault master key")
        
    try:
        driver = get_provider(cred.provider, raw_creds)
        success, status, details = driver.test_connection(raw_creds)
    except Exception as e:
        success = False
        status = "NETWORK_ERROR"
        details = {"error": str(e)}

    # Never persist raw secrets in details
    safe_details = {k: v for k, v in details.items() if "secret" not in k.lower() and "token" not in k.lower()}
    
    cred.status = status
    cred.details = json.dumps(safe_details)
    cred.last_checked_at = datetime.utcnow()
    db.commit()
    db.refresh(cred)
    return cred.to_dict()

@router.delete("/credentials/{cred_id}")
def delete_credential(cred_id: str, db: Session = Depends(get_db)):
    cred = db.query(CloudProviderCredential).filter(CloudProviderCredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    db.delete(cred)
    db.commit()
    return {"status": "deleted", "id": cred_id}

@router.get("/status")
def get_status(user_id: str, db: Session = Depends(get_db)):
    creds = db.query(CloudProviderCredential).filter(CloudProviderCredential.user_id == user_id).all()
    overview = {
        "AWS": {"configured": False, "status": "NOT_CONFIGURED", "provider": "AWS"},
        "GCP": {"configured": False, "status": "NOT_CONFIGURED", "provider": "GCP"},
        "Azure": {"configured": False, "status": "NOT_CONFIGURED", "provider": "Azure"},
        "Docker": {"configured": False, "status": "NOT_CONFIGURED", "provider": "Docker"},
        "Cloudflare": {"configured": False, "status": "NOT_CONFIGURED", "provider": "Cloudflare"},
        "GitHub": {"configured": False, "status": "NOT_CONFIGURED", "provider": "GitHub"},
        "Kubernetes": {"configured": False, "status": "NOT_CONFIGURED", "provider": "Kubernetes"},
    }
    
    for c in creds:
        provider = c.provider.upper()
        key_map = {
            "AWS": "AWS", "GCP": "GCP", "AZURE": "Azure", 
            "DOCKER": "Docker", "CLOUDFLARE": "Cloudflare", 
            "GITHUB": "GitHub", "KUBERNETES": "Kubernetes"
        }
        mapped_key = key_map.get(provider)
        if mapped_key:
            overview[mapped_key]["configured"] = True
            overview[mapped_key]["status"] = c.status
            overview[mapped_key]["last_checked_at"] = c.last_checked_at.isoformat() if c.last_checked_at else None
            
    return overview
