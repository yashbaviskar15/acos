from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import json
from app.core.database import Base

class CloudProviderCredential(Base):
    __tablename__ = "cloud_provider_credentials"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    provider = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    encrypted_credentials = Column(Text, nullable=False)
    status = Column(String(30), default="NOT_CONFIGURED")
    last_checked_at = Column(DateTime, nullable=True)
    details = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_secrets=False):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "workspace_id": self.workspace_id,
            "provider": self.provider,
            "name": self.name,
            "status": self.status,
            "last_checked_at": self.last_checked_at.isoformat() if self.last_checked_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "details": json.loads(self.details) if self.details else {}
        }
        
        return d
