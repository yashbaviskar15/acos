import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from app.core.database import Base

def gen_sec_id():
    return f"sec-{uuid.uuid4().hex}"

def gen_key_id():
    return f"key-{uuid.uuid4().hex}"

class ArvVaultSecret(Base):
    __tablename__ = "arv_vault_secrets"

    id = Column(String, primary_key=True, default=gen_sec_id)
    project_id = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    encrypted_value = Column(Text)
    encryption_algorithm = Column(String, default="AES-256-GCM")
    key_version = Column(Integer, default=1)
    auto_rotate_days = Column(Integer, default=0)
    last_rotated_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, nullable=True)
    access_count = Column(Integer, default=0)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_val=False):
        d = {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "encryption_algorithm": self.encryption_algorithm,
            "key_version": self.key_version,
            "auto_rotate_days": self.auto_rotate_days,
            "last_rotated_at": self.last_rotated_at.isoformat() if self.last_rotated_at else None,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "access_count": self.access_count,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_val:
            d["encrypted_value"] = self.encrypted_value
        return d

class ArvVaultKey(Base):
    __tablename__ = "arv_vault_keys"

    id = Column(String, primary_key=True, default=gen_key_id)
    project_id = Column(String, index=True)
    name = Column(String, index=True)
    algorithm = Column(String, default="AES-256-GCM")
    purpose = Column(String, default="ENCRYPT_DECRYPT")
    status = Column(String, default="ACTIVE")
    key_material_hash = Column(String(64), nullable=True)
    rotation_period_days = Column(Integer, default=0)
    last_rotated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "algorithm": self.algorithm,
            "purpose": self.purpose,
            "status": self.status,
            "key_material_hash": self.key_material_hash,
            "rotation_period_days": self.rotation_period_days,
            "last_rotated_at": self.last_rotated_at.isoformat() if self.last_rotated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ArvKeyAuditLog(Base):
    __tablename__ = "arv_key_audit_logs"

    id = Column(String, primary_key=True, default=lambda: f"aud-{uuid.uuid4().hex}")
    key_id = Column(String)  # Can be sec- or key-
    action = Column(String)
    actor_email = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "key_id": self.key_id,
            "action": self.action,
            "actor_email": self.actor_email,
            "ip_address": self.ip_address,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
