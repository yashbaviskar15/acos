from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User

router = APIRouter(prefix="/api/v1/registry", tags=["ArvRegistry — Container Registry"])

class RepoResponse(BaseModel):
    name: str
    tag_count: int
    vulnerabilities: dict
    size_mb: float

MOCK_REPOS = [
    {"name": "aravanta/frontend", "tag_count": 14, "vulnerabilities": {"critical": 0, "high": 1, "medium": 3}, "size_mb": 145.2},
    {"name": "aravanta/backend-api", "tag_count": 28, "vulnerabilities": {"critical": 0, "high": 0, "medium": 2}, "size_mb": 210.8}
]

@router.get("/repositories", response_model=List[RepoResponse])
def list_repositories(current_user: User = Depends(get_current_user)):
    return MOCK_REPOS
