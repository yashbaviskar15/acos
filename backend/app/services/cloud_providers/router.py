from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
import json
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.crypto import encrypt_aes256gcm, decrypt_aes256gcm, PLATFORM_MASTER_KEY
from .models import CloudProviderCredential
from .drivers.aws_driver import AWSDriver
from .drivers.cloudflare_driver import CloudflareDriver
from .drivers.github_driver import GitHubDriver
from .drivers.docker_driver import DockerDriver
from .drivers.kube_driver import KubeDriver
from .drivers.base import BaseCloudDriver

router = APIRouter(prefix="/api/v1/providers", tags=["Cloud Providers"])

class RegisterCredentialRequest(BaseModel):
    user_id: str
    workspace_id: str = None
    provider: str
    name: str
    credentials: Dict[str, Any]

def get_driver(provider: str) -> BaseCloudDriver:
    providers = {
        "AWS": AWSDriver,
        "CLOUDFLARE": CloudflareDriver,
        "GITHUB": GitHubDriver,
        "DOCKER": DockerDriver,
        "KUBERNETES": KubeDriver
    }
    driver_class = providers.get(provider.upper())
    if driver_class:
        return driver_class()
    return BaseCloudDriver()

@router.get("/credentials")
def list_credentials(user_id: str, db: Session = Depends(get_db)):
    creds = db.query(CloudProviderCredential).filter(CloudProviderCredential.user_id == user_id).all()
    return [c.to_dict() for c in creds]

@router.post("/credentials")
def register_credential(req: RegisterCredentialRequest, db: Session = Depends(get_db)):
    cred_id = f"cred-{str(uuid.uuid4())[:12]}"
    encrypted = encrypt_aes256gcm(PLATFORM_MASTER_KEY, json.dumps(req.credentials))
    
    new_cred = CloudProviderCredential(
        id=cred_id,
        user_id=req.user_id,
        workspace_id=req.workspace_id,
        provider=req.provider.upper(),
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
        raise HTTPException(status_code=400, detail="Failed to decrypt credentials")
        
    driver = get_driver(cred.provider)
    success, status, details = driver.test_connection(raw_creds)
    
    cred.status = status
    cred.details = json.dumps(details)
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
    return {"status": "deleted"}

@router.get("/status")
def get_status(user_id: str, db: Session = Depends(get_db)):
    creds = db.query(CloudProviderCredential).filter(CloudProviderCredential.user_id == user_id).all()
    overview = {
        "AWS": {"configured": False, "status": "NOT_CONFIGURED", "instance_count": 0},
        "GCP": {"configured": False, "status": "NOT_CONFIGURED"},
        "Azure": {"configured": False, "status": "NOT_CONFIGURED"},
        "Docker": {"configured": False, "status": "NOT_CONFIGURED"},
        "Cloudflare": {"configured": False, "status": "NOT_CONFIGURED"},
        "GitHub": {"configured": False, "status": "NOT_CONFIGURED"},
        "Kubernetes": {"configured": False, "status": "NOT_CONFIGURED"},
    }
    
    for c in creds:
        provider = c.provider.upper()
        # Mapping to overview keys
        key_map = {
            "AWS": "AWS", "GCP": "GCP", "AZURE": "Azure", 
            "DOCKER": "Docker", "CLOUDFLARE": "Cloudflare", 
            "GITHUB": "GitHub", "KUBERNETES": "Kubernetes"
        }
        mapped_key = key_map.get(provider)
        if mapped_key:
            overview[mapped_key]["configured"] = True
            overview[mapped_key]["status"] = c.status
            
    return overview
