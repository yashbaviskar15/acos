import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from app.core.database import Base


class ArvNotifyChannel(Base):
    __tablename__ = "arv_notify_channels"
    id = Column(String(50), primary_key=True, default=lambda: f"ch-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    channel_type = Column(String(20), default="EMAIL")
    config = Column(Text, default="{}")
    is_verified = Column(Boolean, default=False)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ArvNotifyMessage(Base):
    __tablename__ = "arv_notify_messages"
    id = Column(String(50), primary_key=True, default=lambda: f"msg-{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=True, index=True)
    channel_id = Column(String(50), nullable=True)
    subject = Column(String(200), default="")
    body = Column(Text, nullable=False)
    status = Column(String(20), default="QUEUED")
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)