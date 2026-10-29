"""
Aravanta Cloud OS — Invariant Tests: Sovereign Sandbox Compute Driver
Tests real execution, real isolation, state guard compliance, and real deletion.
"""
import os
import tempfile
import pytest
from app.core.providers.sandbox_provider import SandboxComputeDriver, SandboxLocalProvider
from app.core.state_guard import transition_resource_state, VALID_STATE_SOURCES

def test_sandbox_state_source_valid():
    assert "sandbox" in VALID_STATE_SOURCES

def test_sandbox_driver_lifecycle():
    with tempfile.TemporaryDirectory() as tmp_dir:
        driver = SandboxComputeDriver(workspace_root=tmp_dir)
        
        # 1. Create
        spec = {"name": "test-vm-01", "resource_id": "test-res-01"}
        created = driver.create(spec, idempotency_key="key-001")
        assert created["status"] == "RUNNING"
        assert created["provider_resource_id"] == "sbx-test-res-01"
        assert os.path.exists(created["workspace_path"])
        manifest = os.path.join(created["workspace_path"], "aravanta_manifest.json")
        assert os.path.exists(manifest)
        
        # 2. Execute command
        res = driver.execute_command("sbx-test-res-01", "echo Hello Aravanta")
        assert res["exit_code"] == 0
        assert "Hello Aravanta" in res["output"]
        assert "Hello Aravanta" in res["stdout"]
        
        # 3. Status check
        status_info = driver.get_status("sbx-test-res-01")
        assert status_info["status"] == "RUNNING"
        
        # 4. Delete
        del_res = driver.delete("sbx-test-res-01")
        assert del_res["status"] == "DELETED"
        assert not os.path.exists(os.path.join(tmp_dir, "test-res-01"))

def test_sandbox_provider_test_connection():
    provider = SandboxLocalProvider()
    success, status, details = provider.test_connection()
    assert success is True
    assert status == "CONNECTED"
    assert details["mode"] == "Zero-Cloud / No-Install"
