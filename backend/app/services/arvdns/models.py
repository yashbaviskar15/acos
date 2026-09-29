import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.core.database import Base


class ArvDNSZone(Base):
    __tablename__ = "arv_dns_zones"
    id = Column(String(50), primary_key=True, default=lambda: f"zone-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    domain_name = Column(String(200), nullable=False)
    zone_type = Column(String(10), default="PUBLIC")
    status = Column(String(30), default="AWAITING_PROVIDER_SETUP")
    nameservers = Column(Text, nullable=True, default=None)
    record_count = Column(Integer, default=0)
    provider_resource_id = Column(String(100), nullable=True)
    state_source = Column(String(50), nullable=True)
    observed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        try:
            ns = json.loads(self.nameservers) if self.nameservers else []
        except Exception:
            ns = []
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain_name": self.domain_name,
            "zone_type": self.zone_type,
            "status": self.status,
            "nameservers": ns,
            "record_count": self.record_count,
            "provider_resource_id": self.provider_resource_id,
            "state_source": self.state_source or ("provider" if self.provider_resource_id else "registry-only"),
            "observed_at": self.observed_at.isoformat() + "Z" if self.observed_at else None,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class ArvDNSRecord(Base):
    __tablename__ = "arv_dns_records"
    id = Column(String(50), primary_key=True, default=lambda: f"rec-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    zone_id = Column(String(50), nullable=False, index=True)
    record_name = Column(String(200), nullable=False)
    record_type = Column(String(10), default="A")
    record_value = Column(String(500), nullable=False)
    ttl = Column(Integer, default=300)
    priority = Column(Integer, nullable=True)
    status = Column(String(30), default="AWAITING_PROVIDER_SETUP")
    provider_resource_id = Column(String(100), nullable=True)
    state_source = Column(String(50), nullable=True)
    observed_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "zone_id": self.zone_id,
            "record_name": self.record_name,
            "record_type": self.record_type,
            "record_value": self.record_value,
            "ttl": self.ttl,
            "priority": self.priority,
            "status": self.status,
            "provider_resource_id": self.provider_resource_id,
            "state_source": self.state_source or ("provider" if self.provider_resource_id else "registry-only"),
            "observed_at": self.observed_at.isoformat() + "Z" if self.observed_at else None,
            "last_error": self.last_error,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }