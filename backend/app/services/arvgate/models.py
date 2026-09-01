import datetime
import random
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.core.database import Base

def generate_account_id():
    return f"ARV-ACC-{random.randint(100000, 999999)}"

def generate_workspace_id():
    return f"ws-{random.randint(10000, 99999)}"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    account_id = Column(String(30), unique=True, index=True, nullable=True, default=generate_account_id)
    workspace_id = Column(String(50), index=True, nullable=True, default=generate_workspace_id)
    workspace_name = Column(String(100), nullable=True, default="Production Cloud Ops")
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Developer", nullable=False)
    is_active = Column(Boolean, default=True)
    is_mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(64), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=True)
    preferences = Column(Text, nullable=True, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, index=True)
    workspace_id = Column(String(50), index=True, nullable=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
