import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from app.core.database import Base

class PulseScore(Base):
    __tablename__ = "pulse_scores"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"pls-{uuid.uuid4().hex[:12]}")
    resource_id = Column(String(50), index=True)
    resource_type = Column(String(50))
    workspace_id = Column(String(50), index=True)
    score = Column(Integer, default=100)
    trend = Column(String(20), default="stable")
    factors = Column(Text, default="{}")
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "workspace_id": self.workspace_id,
            "score": self.score,
            "trend": self.trend,
            "factors": json.loads(self.factors) if self.factors else {},
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }

class PulsePrediction(Base):
    __tablename__ = "pulse_predictions"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"pred-{uuid.uuid4().hex[:12]}")
    resource_id = Column(String(50), index=True)
    resource_type = Column(String(50))
    workspace_id = Column(String(50), index=True)
    prediction_type = Column(String(50))
    severity = Column(String(20))
    confidence = Column(Float)
    predicted_time = Column(DateTime)
    description = Column(Text)
    root_cause = Column(Text)
    remediation = Column(Text, default="{}")
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "workspace_id": self.workspace_id,
            "prediction_type": self.prediction_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "predicted_time": self.predicted_time.isoformat() if self.predicted_time else None,
            "description": self.description,
            "root_cause": self.root_cause,
            "remediation": json.loads(self.remediation) if self.remediation else {},
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class PulsePattern(Base):
    __tablename__ = "pulse_patterns"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"pat-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    pattern_name = Column(String(100))
    description = Column(Text)
    occurrences = Column(Integer, default=1)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    recommendation = Column(Text)
    severity = Column(String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "pattern_name": self.pattern_name,
            "description": self.description,
            "occurrences": self.occurrences,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "recommendation": self.recommendation,
            "severity": self.severity
        }
