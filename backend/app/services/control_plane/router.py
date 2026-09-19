"""
Aravanta Cloud OS — Control Plane Router
REST APIs for Organizations, Projects, Unified Resources, Jobs, and Events.
"""
import uuid
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.services.arvgate.models import User
from app.services.arvgate.dependencies import get_current_user
from app.control_plane.models import (
    Organization, Project, Membership, ResourceRecord, JobRecord, EventRecord
)
from app.control_plane.policy_engine import (
    verify_org_membership, verify_project_access, has_permission
)
from app.control_plane.resource_manager import ResourceManager
from app.control_plane.job_engine import JobEngine

router = APIRouter(prefix="/api/v1", tags=["Control Plane — Core Platform"])


def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[-\s]+", "-", s)[:50]


_tables_checked = False

def ensure_default_tenant(db: Session, user: User) -> tuple[Organization, Project]:
    """Ensures that a user always has at least one default organization and project."""
    global _tables_checked
    if not _tables_checked:
        try:
            from app.core.database import Base, engine
            Base.metadata.create_all(bind=engine, checkfirst=True)
            _tables_checked = True
        except Exception:
            pass

    # Check if user has an existing membership or owned org
    membership = db.query(Membership).filter(Membership.user_id == user.id).first()
    if membership:
        org = db.query(Organization).filter(Organization.id == membership.organization_id).first()
        if org:
            prj = db.query(Project).filter(Project.organization_id == org.id).first()
            if not prj:
                prj = Project(
                    organization_id=org.id,
                    name="Default Project",
                    slug="default",
                    region="arv-us-east-1",
                    description="Default working environment"
                )
                db.add(prj)
                db.commit()
                db.refresh(prj)
            return org, prj

    # Create default org and project
    org_name = getattr(user, "workspace_name", None) or f"{user.full_name or 'User'}'s Org"
    slug = _slugify(f"org-{user.id[:8]}")
    org = Organization(
        name=org_name,
        slug=slug,
        owner_id=user.id
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    mem = Membership(
        organization_id=org.id,
        user_id=user.id,
        role="Owner"
    )
    db.add(mem)

    prj = Project(
        organization_id=org.id,
        name="Production Project",
        slug="production",
        region="arv-us-east-1",
        description="Production cloud infrastructure"
    )
    db.add(prj)
    db.commit()
    db.refresh(prj)
    return org, prj


# ─── Schemas ─────────────────────────────────────────────────────────────────

class OrgCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None

class ProjectCreateRequest(BaseModel):
    organization_id: str
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    region: str = "arv-us-east-1"
    description: Optional[str] = ""

class MemberAddRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "Developer"

class ResourceCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., description="compute, storage, database, network, container")
    project_id: str
    organization_id: Optional[str] = None
    region: str = "arv-us-east-1"
    spec: Optional[Dict[str, Any]] = None
    tags: Optional[Dict[str, str]] = None

class ResourceActionRequest(BaseModel):
    action: str = Field(..., description="start, stop, terminate")


# ─── Organizations Endpoints ─────────────────────────────────────────────────

@router.post("/organizations", status_code=status.HTTP_201_CREATED)
def create_organization(
    req: OrgCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slug = req.slug or _slugify(req.name)
    existing = db.query(Organization).filter(Organization.slug == slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    org = Organization(
        name=req.name.strip(),
        slug=slug,
        owner_id=current_user.id
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # Add owner membership
    mem = Membership(
        organization_id=org.id,
        user_id=current_user.id,
        role="Owner"
    )
    db.add(mem)

    # Auto-create initial default project
    prj = Project(
        organization_id=org.id,
        name="Production Project",
        slug="production",
        region="arv-us-east-1",
        description="Production cloud project"
    )
    db.add(prj)
    db.commit()

    return org.to_dict()


@router.get("/organizations")
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure user has at least one default organization
    ensure_default_tenant(db, current_user)

    memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(
        or_(Organization.id.in_(org_ids), Organization.owner_id == current_user.id)
    ).all()
    return [o.to_dict() for o in orgs]


@router.get("/organizations/{org_id}")
def get_organization(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_org_membership(db, current_user.id, org_id)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org.to_dict()


@router.get("/organizations/{org_id}/members")
def list_organization_members(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_org_membership(db, current_user.id, org_id)
    members = db.query(Membership).filter(Membership.organization_id == org_id).all()
    res = []
    for m in members:
        u = db.query(User).filter(User.id == m.user_id).first()
        res.append({
            "membership_id": m.id,
            "user_id": m.user_id,
            "email": u.email if u else "unknown",
            "full_name": u.full_name if u else "Unknown User",
            "role": m.role,
            "created_at": m.created_at.isoformat() + "Z" if m.created_at else None
        })
    return res


@router.post("/organizations/{org_id}/members", status_code=status.HTTP_201_CREATED)
def add_organization_member(
    org_id: str,
    req: MemberAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_org_membership(db, current_user.id, org_id, required_roles=["Owner", "Admin"])
    target_user = None
    if req.user_id:
        target_user = db.query(User).filter(User.id == req.user_id).first()
    elif req.email:
        target_user = db.query(User).filter(User.email == req.email.strip().lower()).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    existing = db.query(Membership).filter(
        Membership.organization_id == org_id,
        Membership.user_id == target_user.id
    ).first()
    if existing:
        existing.role = req.role
        db.commit()
        db.refresh(existing)
        return existing.to_dict()

    new_mem = Membership(
        organization_id=org_id,
        user_id=target_user.id,
        role=req.role
    )
    db.add(new_mem)
    db.commit()
    db.refresh(new_mem)
    return new_mem.to_dict()


# ─── Projects Endpoints ──────────────────────────────────────────────────────

@router.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    req: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_org_membership(db, current_user.id, req.organization_id, required_roles=["Owner", "Admin", "Developer"])
    slug = req.slug or _slugify(req.name)
    prj = Project(
        organization_id=req.organization_id,
        name=req.name.strip(),
        slug=slug,
        region=req.region,
        description=req.description or ""
    )
    db.add(prj)
    db.commit()
    db.refresh(prj)
    return prj.to_dict()


@router.get("/projects")
def list_projects(
    organization_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org, _ = ensure_default_tenant(db, current_user)
    target_org_id = organization_id or org.id

    verify_org_membership(db, current_user.id, target_org_id)
    projects = db.query(Project).filter(Project.organization_id == target_org_id).all()
    return [p.to_dict() for p in projects]


@router.get("/projects/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = verify_project_access(db, current_user.id, project_id, "project:read")
    return project.to_dict()


# ─── Unified Cloud Resources Endpoints ────────────────────────────────────────

@router.post("/resources", status_code=status.HTTP_201_CREATED)
def create_resource(
    req: ResourceCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = verify_project_access(db, current_user.id, req.project_id, f"{req.type}:create")
    org_id = req.organization_id or project.organization_id

    resource = ResourceManager.create_resource(
        db=db,
        name=req.name,
        resource_type=req.type,
        organization_id=org_id,
        project_id=req.project_id,
        owner_id=current_user.id,
        region=req.region,
        spec=req.spec,
        tags=req.tags,
    )
    return resource.to_dict()


@router.get("/resources")
def list_resources(
    project_id: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None, alias="type"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org, prj = ensure_default_tenant(db, current_user)
    target_org_id = organization_id or org.id
    target_prj_id = project_id  # If None, returns all resources in org

    verify_org_membership(db, current_user.id, target_org_id)

    resources = ResourceManager.list_resources(
        db=db,
        organization_id=target_org_id,
        project_id=target_prj_id,
        resource_type=resource_type,
        status=status_filter
    )
    return [r.to_dict() for r in resources]


@router.get("/resources/{resource_id}")
def get_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = ResourceManager.get_resource(db, resource_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
    verify_project_access(db, current_user.id, res.project_id, f"{res.type}:read")
    return res.to_dict()


@router.post("/resources/{resource_id}/actions")
def execute_resource_action(
    resource_id: str,
    req: ResourceActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = ResourceManager.get_resource(db, resource_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
    verify_project_access(db, current_user.id, res.project_id, f"{res.type}:update")

    updated = ResourceManager.execute_action(db, res, req.action)
    return updated.to_dict()


@router.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = ResourceManager.get_resource(db, resource_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
    verify_project_access(db, current_user.id, res.project_id, f"{res.type}:delete")

    ResourceManager.delete_resource(db, res)
    return {"status": "SUCCESS", "message": f"Resource {resource_id} deleted successfully"}


# ─── Jobs & Events Endpoints ─────────────────────────────────────────────────

@router.get("/jobs/{job_id}")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(JobRecord).filter(JobRecord.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    verify_org_membership(db, current_user.id, job.organization_id)
    return job.to_dict()


@router.get("/events")
def list_events(
    organization_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    org, _ = ensure_default_tenant(db, current_user)
    target_org = organization_id or org.id
    verify_org_membership(db, current_user.id, target_org)

    query = db.query(EventRecord).filter(EventRecord.organization_id == target_org)
    if project_id:
        query = query.filter(EventRecord.project_id == project_id)
    if resource_id:
        query = query.filter(EventRecord.resource_id == resource_id)

    events = query.order_by(EventRecord.timestamp.desc()).limit(limit).all()
    return [e.to_dict() for e in events]
