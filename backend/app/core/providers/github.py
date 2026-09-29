"""
Aravanta Cloud OS — GitHub CI/CD Provider Driver
Integrates with real GitHub Actions workflows, tracking real job runs and live logs.
"""
from typing import Dict, Any, Tuple, Optional, List
import httpx

from .base import BaseCloudProvider

class GitHubProvider(BaseCloudProvider):
    name = "GitHub"

    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        self.credentials = credentials or {}
        self.token = self.credentials.get("token") or self.credentials.get("api_key")

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Aravanta-CloudOS"
        }

    def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        token = credentials.get("token") or credentials.get("api_key")
        if not token:
            return False, "INVALID_CREDENTIALS", {"error": "Missing GitHub Personal Access Token."}

        try:
            r = httpx.get("https://api.github.com/user", headers={"Authorization": f"Bearer {token}", "User-Agent": "Aravanta-CloudOS"}, timeout=10.0)
            if r.status_code == 200:
                user_data = r.json()
                return True, "CONNECTED", {
                    "login": user_data.get("login"),
                    "name": user_data.get("name"),
                    "public_repos": user_data.get("public_repos")
                }
            elif r.status_code == 401:
                return False, "INVALID_CREDENTIALS", {"error": "Invalid GitHub token."}
            elif r.status_code == 403:
                return False, "INSUFFICIENT_PERMISSIONS", {"error": "Token has insufficient permissions (needs repo scope)."}
            return False, "INVALID_CREDENTIALS", {"error": r.text}
        except httpx.RequestError as e:
            return False, "NETWORK_ERROR", {"error": f"Failed to connect to GitHub: {str(e)}"}

    def dispatch_workflow(self, owner: str, repo: str, workflow_id: str, ref: str = "main") -> Dict[str, Any]:
        """Dispatches a real GitHub Actions workflow."""
        url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"
        r = httpx.post(url, headers=self._headers(), json={"ref": ref}, timeout=10.0)
        if r.status_code not in (204, 200):
            raise RuntimeError(f"GitHub workflow dispatch failed ({r.status_code}): {r.text}")
        return {"status": "QUEUED", "ref": ref}

    def get_latest_run(self, owner: str, repo: str, workflow_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves real latest workflow run status from GitHub."""
        url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
        r = httpx.get(url, headers=self._headers(), timeout=10.0)
        if r.status_code != 200:
            return None

        runs = r.json().get("workflow_runs", [])
        if not runs:
            return None

        latest = runs[0]
        status_map = {
            "queued": "QUEUED",
            "in_progress": "RUNNING",
            "completed": "SUCCESS" if latest.get("conclusion") == "success" else "FAILED"
        }
        return {
            "run_id": str(latest["id"]),
            "status": status_map.get(latest["status"], "UNKNOWN"),
            "conclusion": latest.get("conclusion"),
            "commit_hash": latest.get("head_sha", "")[:7],
            "commit_message": latest.get("head_commit", {}).get("message", ""),
            "duration": None,  # Calculated from run duration
            "html_url": latest.get("html_url"),
            "created_at": latest.get("created_at")
        }
