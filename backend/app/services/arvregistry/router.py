"""
Aravanta CloudOS — ArvRegistry Service Router
Container image registry and vulnerability scan data.
Queries real local Docker images if engine is running, or application images without formula metrics.
Prohibits fabricated image sizes or synthesized vulnerability scores.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.core.cloud_models import ApplicationRecord

router = APIRouter(prefix="/api/v1/registry", tags=["ArvRegistry — Container Registry"])

class RepoResponse(BaseModel):
    name: str
    tag_count: int
    vulnerabilities: Dict[str, Any]
    size_mb: Optional[float] = None
    source: str = "registry-only"

@router.get("/repositories", response_model=List[RepoResponse])
def list_repositories(
    workspace_id: Optional[str] = Header(None, alias="x-workspace-id"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = current_user.workspace_id or workspace_id or "default"
    repos = []
    seen = set()

    # 1. Attempt to query real Docker images from host if daemon is online
    try:
        import docker
        client = docker.from_env()
        docker_images = client.images.list()
        for img in docker_images:
            tags = img.tags or []
            if not tags:
                continue
            repo_name = tags[0].split(":")[0]
            if repo_name not in seen and repo_name != "<none>":
                seen.add(repo_name)
                size_bytes = img.attrs.get("Size", 0)
                repos.append(
                    RepoResponse(
                        name=repo_name,
                        tag_count=len(tags),
                        vulnerabilities={"scan_status": "NO_SCAN_DATA"},
                        size_mb=round(size_bytes / (1024 * 1024), 1) if size_bytes else None,
                        source="docker-engine"
                    )
                )
    except Exception:
        pass

    # 2. Add registered application images from database metadata without fake size formulas
    apps = db.query(ApplicationRecord).filter(
        (ApplicationRecord.workspace_id == ws_id) | (ApplicationRecord.user_id == current_user.id)
    ).all()

    for a in apps:
        if not a.image:
            continue
        image_name = a.image.split(":")[0]
        if image_name not in seen:
            seen.add(image_name)
            repos.append(
                RepoResponse(
                    name=image_name,
                    tag_count=1,
                    vulnerabilities={"scan_status": "NO_SCAN_DATA"},
                    size_mb=None,
                    source="registry-only"
                )
            )

    return repos
