import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.arvai.knowledge_base import knowledge_base
from app.services.arvai.telemetry_connectors import PrometheusConnector, LokiConnector, EbpfTraceConnector
from app.services.arvai.retrieval import grounding_engine

client = TestClient(app)

def test_knowledge_base_indexing():
    """Verify that documentation and runbooks are indexed properly."""
    assert len(knowledge_base.indexed_files) >= 10
    assert len(knowledge_base.chunks) >= 50
    results = knowledge_base.search("CrashLoopBackOff OOMKilled", top_k=2)
    assert len(results) > 0
    assert any("crashloop" in r["file_path"].lower() or "troubleshoot" in r["file_path"].lower() for r in results)

@pytest.mark.asyncio
async def test_telemetry_connectors():
    """Verify telemetry connectors return structured data schemas."""
    prom = PrometheusConnector()
    snapshot = await prom.get_cluster_snapshot()
    assert "cluster_cpu_utilization_pct" in snapshot
    assert snapshot["active_nodes"] > 0

    loki = LokiConnector()
    logs = await loki.query_logs('{app="api-gateway"}', limit=5)
    assert len(logs) > 0
    assert "timestamp" in logs[0]

    ebpf = EbpfTraceConnector()
    traces = await ebpf.get_active_traces()
    assert traces["monitored_sockets"] > 0
    assert len(traces["active_connections"]) > 0

@pytest.mark.asyncio
async def test_grounding_engine():
    """Verify GroundingEngine returns unified context with citations."""
    ctx = await grounding_engine.retrieve_context("check CPU and database memory")
    assert "query" in ctx
    assert "telemetry" in ctx
    assert "inventory" in ctx
    assert "citations" in ctx
    assert len(ctx["citations"]) > 0

def test_ai_health_endpoint():
    """Verify /api/v1/ai/health returns 200 OK with all modules."""
    res = client.get("/api/v1/ai/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["modules"]["console_copilot"] == "ACTIVE (Read-Only)"

def test_copilot_suggestions_endpoint():
    """Verify /api/v1/ai/copilot/suggestions adapts to current tab."""
    res = client.get("/api/v1/ai/copilot/suggestions?tab=kubernetes")
    assert res.status_code == 200
    data = res.json()
    assert data["tab"] == "kubernetes"
    assert len(data["suggestions"]) >= 3

def test_copilot_chat_vm_query():
    """Verify Console Copilot answers VM compute inquiries."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "What is the status of my virtual machines?",
        "tab_context": "compute"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "compute_status"
    assert data["read_only_guarantee"] is True
    assert len(data["citations"]) > 0

def test_copilot_chat_k8s_query():
    """Verify Console Copilot answers Kubernetes cluster inquiries."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "Check Kubernetes cluster health and pods",
        "tab_context": "kubernetes"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "k8s_status"
    assert "Kubernetes" in data["reply"]

def test_copilot_chat_billing_query():
    """Verify Console Copilot answers billing inquiries in INR and USD."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "How much have we spent on cloud billing this month in INR?",
        "tab_context": "billing"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "billing_status"
    assert "INR" in data["reply"]
    assert "₹" in data["reply"]

def test_war_room_rca_agent():
    """Verify War-Room RCA Agent outputs ranked root causes."""
    res = client.post("/api/v1/ai/rca/analyze/INC-8921")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == "INC-8921"
    assert data["status"] == "ANALYSIS_COMPLETE"
    assert len(data["ranked_root_causes"]) >= 2
    assert data["auto_remediate"] is False
    assert data["ranked_root_causes"][0]["rank"] == 1

def test_infra_automation_agent():
    """Verify Infra Automation Agent enforces blast-radius human approvals."""
    res = client.get("/api/v1/ai/automation/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) >= 2
    low_risk = [r for r in recs if r["risk_level"] == "LOW"][0]
    assert low_risk["requires_approval"] is False
    assert low_risk["auto_executable"] is True
    high_risk = [r for r in recs if r["risk_level"] == "HIGH"][0]
    assert high_risk["requires_approval"] is True
    assert high_risk["auto_executable"] is False

def test_copilot_chat_storage_s3_query():
    """Verify Console Copilot answers S3 and ArvStore object storage queries."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "How do I create an S3 bucket in ArvStore?",
        "tab_context": "storage"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "storage_status"
    assert "ArvStore" in data["reply"]
    assert "S3" in data["reply"]
    assert data["read_only_guarantee"] is True
    assert len(data["citations"]) > 0

def test_copilot_chat_database_patroni_query():
    """Verify Console Copilot answers database queries with Patroni HA facts."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "Explain Patroni database failover and connection pooling",
        "tab_context": "database"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "database_status"
    assert "Patroni" in data["reply"]
    assert "failover" in data["reply"].lower()
    assert len(data["suggested_followups"]) >= 3

def test_copilot_chat_security_totp_mfa_query():
    """Verify Console Copilot answers security, RBAC, and TOTP MFA queries."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "How do I configure TOTP MFA and what are the RBAC roles?",
        "tab_context": "security"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "security_status"
    assert "TOTP" in data["reply"]
    assert "RBAC" in data["reply"]

def test_copilot_chat_cli_query():
    """Verify Console Copilot provides CLI command references."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "Show me arv CLI commands syntax",
        "tab_context": "dashboard"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "cli_guidance"
    assert "arv" in data["reply"]

def test_copilot_read_only_mutation_guardrail():
    """Verify Console Copilot blocks imperative destructive actions under strict read-only guarantee."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "delete all my compute instances",
        "tab_context": "compute"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "read_only_guardrail"
    assert data["read_only_guarantee"] is True
    assert "Read-Only Safety Guarantee" in data["reply"]

def test_copilot_chat_runbook_oom_query():
    """Verify Console Copilot diagnoses Exit Code 137 OOMKilled errors with actionable steps."""
    res = client.post("/api/v1/ai/copilot/chat", json={
        "message": "What should I do if a container fails with exit code 137?",
        "tab_context": "incidents"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "runbook_triage"
    assert "137" in data["reply"]
    assert "OOMKilled" in data["reply"]
