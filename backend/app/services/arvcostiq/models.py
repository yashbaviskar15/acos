import uuid
import datetime
import json
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.core.database import Base

class CostForecast(Base):
    __tablename__ = "cost_forecasts"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"cfc-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    user_id = Column(String(50), index=True)
    forecast_date = Column(DateTime, default=datetime.datetime.utcnow)
    predicted_amount = Column(Float)
    currency = Column(String(10), default="INR")
    confidence = Column(Float)
    breakdown = Column(Text, default="{}")
    period = Column(String(20), default="30d")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "user_id": self.user_id,
            "forecast_date": self.forecast_date.isoformat() if self.forecast_date else None,
            "predicted_amount": self.predicted_amount,
            "currency": self.currency,
            "confidence": self.confidence,
            "breakdown": json.loads(self.breakdown) if self.breakdown else {},
            "period": self.period,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CostRecommendation(Base):
    __tablename__ = "cost_recommendations"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"crc-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    resource_id = Column(String(50))
    resource_type = Column(String(50))
    recommendation_type = Column(String(50))
    title = Column(String(200))
    description = Column(Text)
    estimated_savings = Column(Float)
    currency = Column(String(10), default="INR")
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "recommendation_type": self.recommendation_type,
            "title": self.title,
            "description": self.description,
            "estimated_savings": self.estimated_savings,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CostBudget(Base):
    __tablename__ = "cost_budgets"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"cbd-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    user_id = Column(String(50), index=True)
    name = Column(String(100))
    amount = Column(Float)
    currency = Column(String(10), default="INR")
    period = Column(String(20), default="monthly")
    autopilot_enabled = Column(Boolean, default=False)
    current_spend = Column(Float, default=0.0)
    alert_threshold_pct = Column(Float, default=80.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "user_id": self.user_id,
            "name": self.name,
            "amount": self.amount,
            "currency": self.currency,
            "period": self.period,
            "autopilot_enabled": self.autopilot_enabled,
            "current_spend": self.current_spend,
            "alert_threshold_pct": self.alert_threshold_pct,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class CostAnomaly(Base):
    __tablename__ = "cost_anomalies"
    id = Column(String(50), primary_key=True, index=True, default=lambda: f"can-{uuid.uuid4().hex[:12]}")
    workspace_id = Column(String(50), index=True)
    resource_id = Column(String(50))
    anomaly_type = Column(String(50))
    description = Column(Text)
    expected_cost = Column(Float)
    actual_cost = Column(Float)
    severity = Column(String(20))
    status = Column(String(20), default="active")
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "resource_id": self.resource_id,
            "anomaly_type": self.anomaly_type,
            "description": self.description,
            "expected_cost": self.expected_cost,
            "actual_cost": self.actual_cost,
            "severity": self.severity,
            "status": self.status,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None
        }
