import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.core.database import Base


class ArvDNSZone(Base):
    __tablename__ = "arv_dns_zones"
    id = Column(String(50), primary_key=True, default=lambda: f"zone-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    domain_name = Column(String(200), nullable=False)
    zone_type = Column(String(10), default="PUBLIC")
    status = Column(String(20), default="ACTIVE")
    nameservers = Column(Text, default='["ns1.arvdns.cloud","ns2.arvdns.cloud"]')
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)