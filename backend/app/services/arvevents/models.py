import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from app.core.database import Base

def gen_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex}"

class ArvEventQueue(Base):
    __tablename__ = "arv_event_queues"

    id = Column(String, primary_key=True, default=lambda: gen_id("q"))
    project_id = Column(String, index=True)
    name = Column(String, index=True)
    queue_type = Column(String, default="STANDARD")
    visibility_timeout_seconds = Column(Integer, default=30)
    message_retention_days = Column(Integer, default=4)
    max_message_size_kb = Column(Integer, default=256)
    dlq_target_id = Column(String, ForeignKey("arv_event_queues.id"), nullable=True)
    dlq_max_receive_count = Column(Integer, default=3)
    message_count = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "queue_type": self.queue_type,
            "visibility_timeout_seconds": self.visibility_timeout_seconds,
            "message_retention_days": self.message_retention_days,
            "max_message_size_kb": self.max_message_size_kb,
            "dlq_target_id": self.dlq_target_id,
            "dlq_max_receive_count": self.dlq_max_receive_count,
            "message_count": self.message_count,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ArvQueueMessage(Base):
    __tablename__ = "arv_queue_messages"

    id = Column(String, primary_key=True, default=lambda: gen_id("msg"))
    queue_id = Column(String, ForeignKey("arv_event_queues.id"))
    body = Column(Text)
    attributes = Column(JSON, default=dict)
    receive_count = Column(Integer, default=0)
    first_sent_at = Column(DateTime, default=datetime.utcnow)
    last_received_at = Column(DateTime, nullable=True)
    visibility_deadline = Column(DateTime, nullable=True)
    status = Column(String, default="AVAILABLE")
    
    def to_dict(self):
        return {
            "id": self.id,
            "queue_id": self.queue_id,
            "body": self.body,
            "attributes": self.attributes,
            "receive_count": self.receive_count,
            "first_sent_at": self.first_sent_at.isoformat() if self.first_sent_at else None,
            "last_received_at": self.last_received_at.isoformat() if self.last_received_at else None,
            "visibility_deadline": self.visibility_deadline.isoformat() if self.visibility_deadline else None,
            "status": self.status,
        }

class ArvEventTopic(Base):
    __tablename__ = "arv_event_topics"

    id = Column(String, primary_key=True, default=lambda: gen_id("topic"))
    project_id = Column(String, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    subscription_count = Column(Integer, default=0)
    message_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "subscription_count": self.subscription_count,
            "message_count": self.message_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class ArvEventRule(Base):
    __tablename__ = "arv_event_rules"

    id = Column(String, primary_key=True, default=lambda: gen_id("rule"))
    topic_id = Column(String, ForeignKey("arv_event_topics.id"))
    name = Column(String)
    pattern = Column(JSON, default=dict)
    target_type = Column(String, default="FUNCTION")
    target_id = Column(String)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "topic_id": self.topic_id,
            "name": self.name,
            "pattern": self.pattern,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
