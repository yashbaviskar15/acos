import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.core.database import Base

class Sandbox(Base):
    __tablename__ = "sandboxes"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"sbx-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    user_id = Column(String(50), index=True)
    name = Column(String(100))
    source_environment = Column(String(50))
    status = Column(String(20), default="creating")
    ttl_hours = Column(Integer, default=24)
    resources_cloned = Column(Text, default="{}")
    access_url = Column(String(255))
    estimated_cost = Column(Float)
    data_anonymized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)
    destroyed_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "user_id": self.user_id,
            "name": self.name,
            "source_environment": self.source_environment,
            "status": self.status,
            "ttl_hours": self.ttl_hours,
            "resources_cloned": json.loads(self.resources_cloned) if self.resources_cloned else {},
            "access_url": self.access_url,
            "estimated_cost": self.estimated_cost,
            "data_anonymized": self.data_anonymized,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "destroyed_at": self.destroyed_at.isoformat() if self.destroyed_at else None
        }
