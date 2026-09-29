"""
Aravanta Cloud OS — Invariant Test Suite: No-Fake-Data Guard
Enforces strict rules:
1. No state in {RUNNING, AVAILABLE, ACTIVE, SUCCESS} may be persisted without evidence.
2. Provider test_connection must reject fake or missing credentials.
3. Provenance and timestamps must accompany verified state transitions.
"""
import pytest
from datetime import datetime
from app.core.state_guard import (
    transition_resource_state,
    StateGuardViolation,
    EVIDENCE_GATED_STATES
)
from app.core.providers import get_provider

class MockResource:
    def __init__(self, name="test-res"):
        self.name = name
        self.status = "AWAITING_PROVIDER_SETUP"
        self.actual_state = "AWAITING_PROVIDER_SETUP"
        self.provider_resource_id = None
        self.state_source = None
        self.observed_at = None
        self.last_error = None
        self.updated_at = None

def test_evidence_guard_blocks_unverified_running():
    """StateGuard must reject setting RUNNING without provider_resource_id."""
    res = MockResource()
    with pytest.raises(StateGuardViolation, match="Cannot set state 'RUNNING' without a valid provider_resource_id"):
        transition_resource_state(
            resource=res,
            target_state="RUNNING",
            provider_resource_id=None,
            state_source="provider"
        )
    assert res.status == "AWAITING_PROVIDER_SETUP"

def test_evidence_guard_blocks_invalid_source():
    """StateGuard must reject setting AVAILABLE without a valid live source."""
    res = MockResource()
    with pytest.raises(StateGuardViolation, match="without valid state_source"):
        transition_resource_state(
            resource=res,
            target_state="AVAILABLE",
            provider_resource_id="db-real-12345",
            state_source="registry-only"
        )
    assert res.status == "AWAITING_PROVIDER_SETUP"

def test_evidence_guard_allows_verified_transition():
    """StateGuard allows transition when provider_resource_id and state_source are verified."""
    res = MockResource()
    now = datetime.utcnow()
    transition_resource_state(
        resource=res,
        target_state="RUNNING",
        provider_resource_id="i-0abcdef1234567890",
        state_source="provider",
        observed_at=now
    )
    assert res.status == "RUNNING"
    assert res.actual_state == "RUNNING"
    assert res.provider_resource_id == "i-0abcdef1234567890"
    assert res.state_source == "provider"
    assert res.observed_at == now

def test_evidence_guard_allows_honest_unprovisioned_states():
    """StateGuard allows AWAITING_PROVIDER_SETUP, FAILED, STOPPED without provider evidence."""
    res = MockResource()
    transition_resource_state(resource=res, target_state="AWAITING_PROVIDER_SETUP")
    assert res.status == "AWAITING_PROVIDER_SETUP"

    transition_resource_state(resource=res, target_state="FAILED", last_error="No provider available")
    assert res.status == "FAILED"
    assert res.last_error == "No provider available"

def test_aws_driver_rejects_fake_credentials():
    """AWS driver must NOT return CONNECTED for fake or invalid keys."""
    provider = get_provider("AWS")
    success, status, details = provider.test_connection({
        "aws_access_key_id": "AKIAFAKEFAKEFAKEFAKE",
        "aws_secret_access_key": "not-a-real-secret-key-123456789012345678",
        "region": "ap-south-1"
    })
    assert success is False
    assert status in ("INVALID_CREDENTIALS", "NETWORK_ERROR")

def test_docker_driver_reports_network_error_when_daemon_stopped():
    """Docker driver must report NETWORK_ERROR when docker daemon is not responding."""
    provider = get_provider("DOCKER")
    # If docker daemon is stopped on this host:
    success, status, details = provider.test_connection()
    if not success:
        assert status == "NETWORK_ERROR"
        assert "error" in details
    else:
        assert status == "CONNECTED"
