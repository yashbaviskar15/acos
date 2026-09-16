import uuid
import datetime
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvcostiq.models import CostForecast, CostRecommendation, CostBudget, CostAnomaly

router = APIRouter(prefix="/api/v1/costiq", tags=["CostIQ"])

@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {
            "id": f"cfc-{uuid.uuid4().hex[:12]}",
            "workspace_id": user.workspace_id,
            "user_id": user.id,
            "forecast_date": (datetime.datetime.utcnow() + datetime.timedelta(days=30)).isoformat(),
            "predicted_amount": 45000.0,
            "currency": "INR",
            "confidence": 0.85,
            "breakdown": {"compute": 25000.0, "storage": 10000.0, "network": 10000.0},
            "period": "30d",
            "created_at": datetime.datetime.utcnow().isoformat()
        }
    ]

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {
            "id": f"crc-{uuid.uuid4().hex[:12]}",
            "workspace_id": user.workspace_id,
            "resource_id": "arv-i-stg-app01",
            "resource_type": "compute",
            "recommendation_type": "terminate",
            "title": "Terminate idle staging instance",
            "description": "Instance has had 0% CPU utilization for the past 7 days.",
            "estimated_savings": 1200.0,
            "currency": "INR",
            "status": "active",
            "created_at": datetime.datetime.utcnow().isoformat()
        }
    ]

class BudgetCreate(BaseModel):
    name: str
    amount: float
    period: str = "monthly"
    autopilot_enabled: bool = False

@router.post("/budget")
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_budget = CostBudget(
        workspace_id=user.workspace_id,
        user_id=user.id,
        name=budget.name,
        amount=budget.amount,
        period=budget.period,
        autopilot_enabled=budget.autopilot_enabled,
        current_spend=0.0
    )
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget.to_dict()

@router.get("/budget")
def list_budgets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budgets = db.query(CostBudget).filter(CostBudget.workspace_id == user.workspace_id).all()
    if not budgets:
        return [{
            "id": f"cbd-{uuid.uuid4().hex[:12]}",
            "workspace_id": user.workspace_id,
            "user_id": user.id,
            "name": "Production Monthly",
            "amount": 50000.0,
            "currency": "INR",
            "period": "monthly",
            "autopilot_enabled": True,
            "current_spend": 32000.0,
            "alert_threshold_pct": 80.0,
            "created_at": datetime.datetime.utcnow().isoformat()
        }]
    return [b.to_dict() for b in budgets]

@router.get("/anomalies")
def list_anomalies(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {
            "id": f"can-{uuid.uuid4().hex[:12]}",
            "workspace_id": user.workspace_id,
            "resource_id": "arv-s3-assets-prod",
            "anomaly_type": "storage_spike",
            "description": "Unusual egress traffic spike detected from storage bucket",
            "expected_cost": 500.0,
            "actual_cost": 2500.0,
            "severity": "high",
            "status": "active",
            "detected_at": datetime.datetime.utcnow().isoformat()
        }
    ]

class SimulationRequest(BaseModel):
    resource_changes: dict

@router.post("/simulate")
def simulate_cost(req: SimulationRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "simulated_impact_amount": 5500.0,
        "currency": "INR",
        "description": "Estimated impact of applied changes over the next 30 days."
    }

@router.get("/attribution")
def get_attribution(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {
        "env:production": 35000.0,
        "env:staging": 4500.0,
        "tier:frontend": 12000.0,
        "tier:backend": 23000.0,
        "untagged": 1000.0
    }

@router.get("/history")
def get_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {"month": "Jan", "spend": 31000.0, "currency": "INR"},
        {"month": "Feb", "spend": 33500.0, "currency": "INR"},
        {"month": "Mar", "spend": 32000.0, "currency": "INR"},
    ]
