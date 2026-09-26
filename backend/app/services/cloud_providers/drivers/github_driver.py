from .base import BaseCloudDriver
import httpx

class GitHubDriver(BaseCloudDriver):
    def test_connection(self, credentials: dict) -> tuple[bool, str, dict]:
        token = credentials.get("token")
        if not token:
            return False, "INVALID_CREDENTIALS", {"error": "Missing token"}
        try:
            r = httpx.get("https://api.github.com/user", headers={"Authorization": f"Bearer {token}"}, timeout=10)
            if r.status_code == 200:
                return True, "CONNECTED", {"login": r.json().get("login")}
            return False, "INVALID_CREDENTIALS", {"error": r.text}
        except Exception as e:
            return False, "NETWORK_ERROR", {"error": str(e)}
