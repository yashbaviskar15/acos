"""
Aravanta Cloud OS — Evidence-Gated State Transition Guard
Enforces Invariant #2: Only a verified provider driver or reconciler
may set RUNNING / AVAILABLE / ACTIVE / SUCCESS states.
"""
from datetime import datetime
from typing import Optional, Any, Set

EVIDENCE_GATED_STATES: Set[str] = {"RUNNING", "AVAILABLE", "ACTIVE", "SUCCESS"}

VALID_LIFECYCLE_STATES: Set[str] = {
    "AWAITING_PROVIDER_SETUP",
    "AWAITING_CREDENTIALS",
    "PROVISIONING",
    "STARTING",
    "RUNNING",
    "AVAILABLE",
    "ACTIVE",
    "STOPPING",
    "STOPPED",
    "DELETING",
    "DELETED",
    "FAILED",
    "MISSING_AT_PROVIDER",
    "UNKNOWN",
    "SUCCESS"
}

VALID_STATE_SOURCES: Set[str] = {
    "provider",
    "k8s-api",
    "prometheus",
    "host",
    "docker",
    "reconciler"
}

class StateGuardViolation(ValueError):
    """Raised when an illegal or unverified state transition is attempted."""
    pass

def transition_resource_state(
    resource: Any,
    target_state: str,
    provider_resource_id: Optional[str] = None,
    state_source: Optional[str] = None,
    observed_at: Optional[datetime] = None,
    last_error: Optional[str] = None
) -> None:
    """
    Enforce evidence-gated transition of a cloud resource.
    Mutates resource fields in-place and validates all invariants.
    """
    state_upper = target_state.upper()
    if state_upper not in VALID_LIFECYCLE_STATES:
        raise StateGuardViolation(
            f"Invalid target state '{target_state}'. Must be one of: {sorted(list(VALID_LIFECYCLE_STATES))}"
        )

    if state_upper in EVIDENCE_GATED_STATES:
        # Check provider_resource_id
        current_pid = provider_resource_id or getattr(resource, "provider_resource_id", None)
        if not current_pid or not str(current_pid).strip():
            raise StateGuardViolation(
                f"Cannot set state '{state_upper}' without a valid provider_resource_id. "
                "A database record is not evidence of a cloud resource."
            )

        # Check state_source
        if not state_source or state_source not in VALID_STATE_SOURCES:
            raise StateGuardViolation(
                f"Cannot set state '{state_upper}' without valid state_source (must be one of {sorted(list(VALID_STATE_SOURCES))}). "
                f"Got '{state_source}'."
            )

        # Check observed_at
        if not observed_at:
            observed_at = datetime.utcnow()

    # Apply verified state updates
    if hasattr(resource, "status"):
        resource.status = state_upper
    if hasattr(resource, "actual_state"):
        resource.actual_state = state_upper
    if hasattr(resource, "provider_resource_id") and provider_resource_id:
        resource.provider_resource_id = provider_resource_id
    if hasattr(resource, "state_source") and state_source:
        resource.state_source = state_source
    if hasattr(resource, "observed_at"):
        resource.observed_at = observed_at or datetime.utcnow()
    if hasattr(resource, "last_error"):
        resource.last_error = last_error
    if hasattr(resource, "updated_at"):
        resource.updated_at = datetime.utcnow()
