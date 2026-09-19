"""
Aravanta Cloud OS — Policy & RBAC Engine
Enforces tenant isolation, role-based authorization, and project resource quotas.
"""
from typing import List, Dict, Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.control_plane.models import Membership, Organization, Project


# Granular RBAC Permissions
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "Owner": {"*"},
    "Admin": {
        "org:read", "org:update", "org:members",
        "project:create", "project:read", "project:update", "project:delete",
        "compute:create", "compute:read", "compute:update", "compute:delete", "compute:action",
        "storage:create", "storage:read", "storage:update", "storage:delete",
        "network:create", "network:read", "network:update", "network:delete",
        "database:create", "database:read", "database:update", "database:delete",
        "container:create", "container:read", "container:update", "container:delete",
        "billing:read", "billing:update"
    },
    "Developer": {
        "org:read",
        "project:read",
        "compute:create", "compute:read", "compute:update", "compute:delete", "compute:action",
        "storage:create", "storage:read", "storage:update", "storage:delete",
        "network:read",
        "database:create", "database:read", "database:update",
        "container:create", "container:read", "container:update", "container:delete",
        "billing:read"
    },
    "Viewer": {
        "org:read",
        "project:read",
        "compute:read",
        "storage:read",
        "network:read",
        "database:read",
        "container:read",
        "billing:read"
    },
    "Billing": {
        "org:read",
        "project:read",
        "billing:read",
        "billing:update"
    }
}

DEFAULT_QUOTAS: Dict[str, int] = {
    "max_compute_instances": 50,
    "max_storage_buckets": 20,
    "max_databases": 10,
    "max_projects": 15,
}


def has_permission(role: str, action: str) -> bool:
    """Evaluate whether a role possesses a requested action permission."""
    perms = ROLE_PERMISSIONS.get(role, set())
    if "*" in perms:
        return True
    if action in perms:
        return True
    
    # Check wildcard namespace e.g. "compute:*"
    category = action.split(":")[0] if ":" in action else action
    if f"{category}:*" in perms:
        return True

    return False


def verify_org_membership(db: Session, user_id: str, org_id: str, required_roles: List[str] = None) -> Membership:
    """Verifies that a user belongs to an organization and satisfies role requirements."""
    # Check if user is the direct owner
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Organization {org_id} not found")
    
    if org.owner_id == user_id:
        # User is organization creator/owner
        return Membership(id="owner-perm", organization_id=org_id, user_id=user_id, role="Owner")

    membership = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization"
        )

    if required_roles and membership.role not in required_roles and membership.role != "Owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action requires one of roles: {required_roles}, but your role is {membership.role}"
        )

    return membership


def verify_project_access(db: Session, user_id: str, project_id: str, action: str = "project:read") -> Project:
    """Ensures user has tenant access to the given project and permission for the action."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project {project_id} not found")

    membership = verify_org_membership(db, user_id, project.organization_id)
    if not has_permission(membership.role, action):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {action} is not granted for role {membership.role}"
        )

    return project
