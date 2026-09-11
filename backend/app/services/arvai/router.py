"""
Aravanta CloudOS — ArvAI API Router
Exposes endpoints for Console Copilot (Module 1), War-Room RCA Agent (Module 2),
and Infra Automation Agent (Module 3).
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.arvgate.models import User
from app.services.arvgate.dependencies import get_current_user, get_current_user_optional

from .copilot import copilot_engine
from .rca_scaffold import rca_agent
from .automation_scaffold import automation_agent
from .retrieval import grounding_engine

router = APIRouter(prefix="/api/v1/ai", tags=["ArvAI — AI Agent Layer"])


class CopilotChatRequest(BaseModel):
    message: str = Field(..., example="What is the health of my virtual machines and Kubernetes clusters?")
    tab_context: Optional[str] = Field("dashboard", example="compute")


class CopilotChatResponse(BaseModel):
    reply: str
    intent: str
    citations: List[str]
    suggested_followups: List[str]
    metric_cards: Optional[List[Dict[str, Any]]] = []
    timestamp: str
    read_only_guarantee: bool = True


@router.get("/health")
def ai_health_check():
    """Returns AI Agent Layer readiness and subsystem status."""
    return {
        "status": "HEALTHY",
        "service": "Aravanta CloudOS AI Agent Layer (ArvAI)",
        "modules": {
            "console_copilot": "ACTIVE (Read-Only)",
            "war_room_rca": "SCAFFOLD_READY",
            "infra_automation": "SCAFFOLD_READY",
            "grounding_rag": "ACTIVE"
        },
        "retrieval_sources": [
            "Docs & Runbooks (In-Memory TF-IDF)",
            "Observability Hub (Prometheus Metrics)",
            "Loki Log Streams",
            "eBPF Kernel Traces",
            "Live Database Cloud Models"
        ]
    }


@router.post("/copilot/chat", response_model=CopilotChatResponse)
async def copilot_chat(
    req: CopilotChatRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Console Copilot Chat Interaction.
    Answers developer and SRE questions about infrastructure, metrics, billing, and runbooks.
    Enforces strict read-only guarantee.
    """
    ws_id = current_user.workspace_id if current_user else None
    u_id = current_user.id if current_user else None

    result = await copilot_engine.process_chat(
        message=req.message,
        tab_context=req.tab_context,
        workspace_id=ws_id,
        user_id=u_id,
        db=db
    )
    return result


@router.get("/copilot/suggestions")
def get_copilot_suggestions(tab: Optional[str] = "dashboard"):
    """
    Provides context-aware prompt suggestions adapted to the active console tab.
    """
    suggestions_map = {
        "dashboard": [
            "What is the overall health of my infrastructure fleet?",
            "Are there any firing alerts across my services?",
            "What is our estimated accrued billing for this month in INR?"
        ],
        "compute": [
            "List all running and stopped virtual machines",
            "What is the average CPU utilization across my VM fleet?",
            "Which instance type is most cost-effective for my workload?"
        ],
        "kubernetes": [
            "Show active Kubernetes clusters and node counts",
            "Are there any pods in CrashLoopBackOff state?",
            "What is the P95 latency across our microservices?"
        ],
        "database": [
            "What is the connection pool status on aravanta-core-db?",
            "How much database storage has been utilized?",
            "When was the last automated PITR backup completed?"
        ],
        "billing": [
            "Break down our cloud costs between compute, storage, and databases",
            "How does per-second billing compare to hourly rates?",
            "Explain our zero egress fee policy"
        ],
        "incidents": [
            "Summarize the root cause analysis for the active incident",
            "What runbook applies to database pool exhaustion?",
            "Show the timeline of events for incident INC-8921"
        ],
        "deployments": [
            "What was the result of our last canary release?",
            "How does the 1.2-second automatic rollback work?",
            "Show recent deployment errors in the Loki log stream"
        ]
    }
    return {
        "tab": tab,
        "suggestions": suggestions_map.get(tab or "dashboard", suggestions_map["dashboard"])
    }


@router.post("/rca/analyze/{incident_id}")
async def analyze_incident_rca(
    incident_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Module 2: War-Room RCA Agent.
    Correlates incident timeline, recent releases, and telemetry to output ranked root causes.
    """
    ws_id = current_user.workspace_id if current_user else None
    u_id = current_user.id if current_user else None

    return await rca_agent.analyze_incident(incident_id, ws_id, u_id, db)


@router.get("/automation/recommendations")
async def get_automation_recommendations(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Module 3: Infra Automation Agent recommendations.
    Provides anomaly detection and blast-radius categorized self-healing recommendations.
    """
    ws_id = current_user.workspace_id if current_user else None
    u_id = current_user.id if current_user else None

    return await automation_agent.get_recommendations(ws_id, u_id, db)
