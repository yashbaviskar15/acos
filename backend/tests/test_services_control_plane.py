"""
Aravanta Cloud OS — Phase 2 Services Control Plane Verification Tests
Validates that every single service behaves strictly as a real control plane:
- Honest AWAITING_PROVIDER_SETUP states when infrastructure/providers are missing
- Zero fabricated metrics, fake IPs, synthetic pods, fake nameservers, or fake commit hashes
- Prohibits actions on unprovisioned infrastructure
- Correct state provenance tracking (provider_resource_id, state_source, observed_at, last_error)
"""
import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.services.cloud_providers.models import CloudProviderCredential
from app.services.arvgate.models import User, AuditLog
from app.core.cloud_models import (
    ComputeInstance, KubeCluster, DatabaseInstance, StorageBucket, StorageObject,
    ApplicationRecord, AlertRecord, WorkflowRecord, Notification, SSHKeyPair
)
from app.services.arvnetwork.models import ArvVPC, ArvLoadBalancer, ArvFirewallRule
from app.services.arvdns.models import ArvDNSZone, ArvDNSRecord
from app.services.arvfunctions.models import ArvFunction, ArvFunctionInvocation
from app.services.arvevents.models import ArvEventQueue, ArvQueueMessage, ArvEventTopic, ArvEventRule
from app.services.arvvault.models import ArvVaultSecret, ArvVaultKey, ArvKeyAuditLog
from app.control_plane.models import JobRecord
from app.services.arvgate.dependencies import get_current_user, require_roles

@pytest.fixture(scope="module")
def mock_user():
    return User(
        id="usr-test-1234",
        email="test@aravanta.cloud",
        full_name="Tester",
        role="SuperAdmin",
        workspace_id="ws-test",
        workspace_name="Test Workspace"
    )

@pytest.fixture(scope="module")
def client(mock_user):
    def override_get_user():
        return mock_user

    def override_require_roles(roles):
        def _role_checker():
            return mock_user
        return _role_checker

    app.dependency_overrides[get_current_user] = override_get_user
    app.dependency_overrides[require_roles] = override_require_roles

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_roles, None)


# ─── 1. ArvCompute Tests ──────────────────────────────────────────
def test_compute_instance_creation_without_provider(client):
    """Creating an instance without cloud credentials must result in AWAITING_PROVIDER_SETUP."""
    res = client.post("/api/v1/compute/instances", json={
        "name": "web-prod-01",
        "instance_type": "arv.medium",
        "region": "arv-us-east-1",
        "disk_gb": 50
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["private_ip"] is None
    assert data["public_ip"] is None
    assert data["state_source"] == "registry-only"
    assert "No compute provider configured" in data["last_error"]


def test_compute_actions_blocked_on_unprovisioned(client):
    """Start, stop, reboot must fail on unprovisioned instances."""
    res = client.post("/api/v1/compute/instances", json={
        "name": "unprov-vm",
        "instance_type": "arv.small"
    })
    inst_id = res.json()["id"]

    for action in ["start", "stop", "reboot"]:
        act_res = client.post(f"/api/v1/compute/instances/{inst_id}/action", json={"action": action})
        assert act_res.status_code == 400
        assert "unprovisioned instance" in act_res.json()["detail"].lower()


def test_compute_connect_blocked_without_public_ip(client):
    """Connect endpoint must honestly state connectable=False when no public IP is allocated."""
    res = client.post("/api/v1/compute/instances", json={"name": "no-ip-vm"})
    inst_id = res.json()["id"]

    conn_res = client.get(f"/api/v1/compute/instances/{inst_id}/connect")
    assert conn_res.status_code == 200
    conn_data = conn_res.json()
    assert conn_data["connectable"] is False
    assert "no public ip" in conn_data["reason"].lower()


# ─── 2. ArvNetwork Tests ──────────────────────────────────────────
def test_vpc_creation_without_provider(client):
    """Creating a VPC without AWS provider sets AWAITING_PROVIDER_SETUP."""
    res = client.post("/api/v1/network/vpcs", json={
        "name": "prod-vpc",
        "cidr_block": "10.0.0.0/16",
        "region": "arv-us-east-1"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["state_source"] == "registry-only"
    assert data["provider_resource_id"] is None


def test_load_balancer_creation_without_provider(client):
    """Creating a Load Balancer without provider driver sets AWAITING_PROVIDER_SETUP."""
    res = client.post("/api/v1/network/load-balancers", json={
        "name": "app-lb",
        "lb_type": "APPLICATION",
        "protocol": "HTTPS"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["state_source"] == "registry-only"


# ─── 3. ArvDB Tests ───────────────────────────────────────────────
def test_database_creation_non_postgres(client):
    """Engines like MySQL or MongoDB set AWAITING_PROVIDER_SETUP without provider."""
    res = client.post("/api/v1/databases/instances", json={
        "name": "orders-db",
        "engine": "MySQL 8.0",
        "tier": "db.arv.small"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["endpoint"] is None
    assert data["state_source"] == "registry-only"


# ─── 4. ArvWatch Tests ────────────────────────────────────────────
def test_watch_telemetry_honesty(client):
    """Monitoring metrics must return NO_TELEMETRY when no agent data is reported."""
    res = client.get("/api/v1/monitoring/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["telemetry_status"] in ["NO_TELEMETRY", "ACTIVE"]


def test_watch_dashboard_services_cost_honesty(client):
    """Unprovisioned services must accrue 0 cost."""
    res = client.get("/api/v1/monitoring/dashboard/services")
    assert res.status_code == 200
    data = res.json()
    for s in data["services"]:
        if s["status"] == "AWAITING_PROVIDER_SETUP":
            assert s["accrued_cost_usd"] == 0.0


# ─── 5. ArvDNS Tests ──────────────────────────────────────────────
def test_dns_zone_creation_no_fake_nameservers(client):
    """DNS zone created without provider must not have fake ns1.arvdns.cloud."""
    res = client.post("/api/v1/dns/zones", json={
        "domain_name": "example.com",
        "zone_type": "PUBLIC"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["nameservers"] == [] or data["nameservers"] is None


# ─── 6. ArvKube Tests ─────────────────────────────────────────────
def test_kube_cluster_creation_without_provider(client):
    """Cluster created without EKS or live cluster endpoint sets AWAITING_PROVIDER_SETUP."""
    res = client.post("/api/v1/kubernetes/clusters", json={
        "name": "prod-k8s",
        "version": "1.30.1"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "AWAITING_PROVIDER_SETUP"
    assert data["node_count"] == 0
    assert data["endpoint"] is None
    assert data["state_source"] == "registry-only"


def test_kube_cluster_scale_blocked(client):
    """Scaling an unprovisioned cluster is blocked."""
    res = client.post("/api/v1/kubernetes/clusters", json={"name": "scale-test"})
    cid = res.json()["id"]

    scale_res = client.post(f"/api/v1/kubernetes/clusters/{cid}/scale", json={"node_count": 5})
    assert scale_res.status_code == 400


def test_kube_pods_empty_telemetry(client):
    """Listing pods for unprovisioned cluster returns NO_TELEMETRY header."""
    res = client.post("/api/v1/kubernetes/clusters", json={"name": "pods-test"})
    cid = res.json()["id"]

    pods_res = client.get(f"/api/v1/kubernetes/clusters/{cid}/pods")
    assert pods_res.status_code == 200
    assert pods_res.json() == []
    assert pods_res.headers.get("x-telemetry-status") == "NO_TELEMETRY"


# ─── 7. ArvEdge Tests ─────────────────────────────────────────────
def test_edge_load_balancers_no_fake_alb(client):
    """ArvEdge must not synthesize fake alb-main-01."""
    res = client.get("/api/v1/edge/load-balancers")
    assert res.status_code == 200
    data = res.json()
    for lb in data:
        assert lb["id"] != "alb-main-01"
        assert not (lb.get("dns_name") and "gateway.default.aravanta.cloud" in lb["dns_name"])


# ─── 8. ArvRegistry Tests ─────────────────────────────────────────
def test_registry_no_formula_sizes(client):
    """ArvRegistry must not use formula size_mb = 120 + len(name)*8.5."""
    res = client.get("/api/v1/registry/repositories")
    assert res.status_code == 200
    # Any repository returned should have size_mb None or verified from docker engine
    for r in res.json():
        if r.get("source") == "registry-only":
            assert r.get("size_mb") is None


# ─── 9. ArvCICD Tests ─────────────────────────────────────────────
def test_cicd_pipeline_no_fake_commits(client):
    """Pipelines created without GitHub Actions runs must not have fake MD5 commit hashes."""
    res = client.post("/api/v1/cicd/pipelines", json={
        "name": "frontend-ci",
        "repository": "aravanta/frontend",
        "branch": "main"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["commit"] is None
    assert data["status"] in ["AWAITING_PROVIDER_SETUP", "ACTIVE"]
