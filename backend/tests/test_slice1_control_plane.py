"""
Aravanta Cloud OS — Vertical Slice 1 Tests
Validates Multi-Tenancy Hierarchy, Tenant Isolation, RBAC,
Unified Resource Lifecycle, and Event Audit Logging.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app as fastapi_app
from tests.conftest import override_get_db

fastapi_app.dependency_overrides[get_db] = override_get_db
client = TestClient(fastapi_app)

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"


def _create_user(name: str) -> tuple[str, str, dict]:
    uid = uuid.uuid4().hex[:6]
    email = f"{name.lower()}_{uid}@aravanta.cloud"
    pwd = "SecurePassword123!"
    reg = client.post(REGISTER_URL, json={
        "email": email,
        "password": pwd,
        "full_name": name
    })
    assert reg.status_code == 201
    login = client.post(LOGIN_URL, json={"email": email, "password": pwd})
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return email, token, headers


def test_organization_and_default_project_creation():
    _, _, headers = _create_user("Alice")

    # List organizations should auto-provision default org & project
    res = client.get("/api/v1/organizations", headers=headers)
    assert res.status_code == 200
    orgs = res.json()
    assert len(orgs) >= 1
    org = orgs[0]
    assert "id" in org
    assert org["id"].startswith("org-")

    # Check project auto-creation
    res_prjs = client.get(f"/api/v1/projects?organization_id={org['id']}", headers=headers)
    assert res_prjs.status_code == 200
    prjs = res_prjs.json()
    assert len(prjs) >= 1
    assert prjs[0]["organization_id"] == org["id"]


def test_custom_project_creation():
    _, _, headers = _create_user("Bob")

    # Create explicit new organization
    org_res = client.post("/api/v1/organizations", json={"name": "Acme Cloud"}, headers=headers)
    assert org_res.status_code == 201
    org_data = org_res.json()
    org_id = org_data["id"]

    # Create new project under this organization
    prj_res = client.post("/api/v1/projects", json={
        "organization_id": org_id,
        "name": "E-Commerce Microservices",
        "region": "arv-ap-south-1",
        "description": "Backend services for checkout"
    }, headers=headers)
    assert prj_res.status_code == 201
    prj_data = prj_res.json()
    assert prj_data["name"] == "E-Commerce Microservices"
    assert prj_data["organization_id"] == org_id
    assert prj_data["region"] == "arv-ap-south-1"


def test_multitenant_isolation_prevents_cross_tenant_access():
    _, _, headers_alice = _create_user("AliceTenant")
    _, _, headers_mallory = _create_user("MalloryTenant")

    # Alice creates an organization and project
    org_res = client.post("/api/v1/organizations", json={"name": "Alice Corp"}, headers=headers_alice)
    assert org_res.status_code == 201
    alice_org_id = org_res.json()["id"]

    prj_res = client.post("/api/v1/projects", json={
        "organization_id": alice_org_id,
        "name": "Secret Project"
    }, headers=headers_alice)
    assert prj_res.status_code == 201
    alice_prj_id = prj_res.json()["id"]

    # Mallory attempts to inspect Alice's organization -> MUST be forbidden (403)
    mallory_org_res = client.get(f"/api/v1/organizations/{alice_org_id}", headers=headers_mallory)
    assert mallory_org_res.status_code in (403, 404)

    # Mallory attempts to access Alice's project -> MUST be forbidden (403)
    mallory_prj_res = client.get(f"/api/v1/projects/{alice_prj_id}", headers=headers_mallory)
    assert mallory_prj_res.status_code in (403, 404)

    # Mallory attempts to create a resource in Alice's project -> MUST be forbidden (403)
    mallory_res = client.post("/api/v1/resources", json={
        "name": "rogue-instance",
        "type": "compute",
        "project_id": alice_prj_id
    }, headers=headers_mallory)
    assert mallory_res.status_code in (403, 404)


def test_unified_resource_lifecycle_and_reconciliation():
    _, _, headers = _create_user("DevUser")

    # Get user default project
    orgs = client.get("/api/v1/organizations", headers=headers).json()
    org_id = orgs[0]["id"]
    prjs = client.get(f"/api/v1/projects?organization_id={org_id}", headers=headers).json()
    project_id = prjs[0]["id"]

    # 1. Create compute resource
    create_res = client.post("/api/v1/resources", json={
        "name": "api-gateway-node",
        "type": "compute",
        "project_id": project_id,
        "region": "arv-us-east-1",
        "spec": {"cpu": 4, "ram_mb": 8192, "os_image": "Ubuntu 22.04 LTS"},
        "tags": {"env": "staging", "tier": "web"}
    }, headers=headers)
    assert create_res.status_code == 201
    res_data = create_res.json()
    res_id = res_data["id"]

    assert res_data["name"] == "api-gateway-node"
    assert res_data["type"] == "compute"
    assert res_data["status"] == "RUNNING"
    assert res_data["desired_state"] == "RUNNING"
    assert res_data["observed_state"] == "RUNNING"
    assert "private_ip" in res_data["metadata"]
    assert res_data["metadata"]["private_ip"].startswith("10.240.")

    # 2. Get resource
    get_res = client.get(f"/api/v1/resources/{res_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == res_id

    # 3. List resources
    list_res = client.get(f"/api/v1/resources?project_id={project_id}", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(r["id"] == res_id for r in items)

    # 4. Stop resource action
    stop_res = client.post(f"/api/v1/resources/{res_id}/actions", json={"action": "stop"}, headers=headers)
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "STOPPED"
    assert stop_res.json()["desired_state"] == "STOPPED"

    # 5. Start resource action
    start_res = client.post(f"/api/v1/resources/{res_id}/actions", json={"action": "start"}, headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "RUNNING"
    assert start_res.json()["desired_state"] == "RUNNING"

    # 6. Verify audit events recorded
    events_res = client.get(f"/api/v1/events?project_id={project_id}&resource_id={res_id}", headers=headers)
    assert events_res.status_code == 200
    events = events_res.json()
    event_types = [e["event_type"] for e in events]
    assert "ResourceCreated" in event_types
    assert "ResourceAction:Stop" in event_types
    assert "ResourceAction:Start" in event_types

    # 7. Delete resource
    del_res = client.delete(f"/api/v1/resources/{res_id}", headers=headers)
    assert del_res.status_code == 200

    # Resource should no longer exist
    get_del = client.get(f"/api/v1/resources/{res_id}", headers=headers)
    assert get_del.status_code == 404
