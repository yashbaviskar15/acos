from .base import BaseCloudDriver
import httpx

class CloudflareDriver(BaseCloudDriver):
    def test_connection(self, credentials: dict) -> tuple[bool, str, dict]:
        token = credentials.get("token")
        if not token:
            return False, "INVALID_CREDENTIALS", {"error": "Missing token"}
        try:
            r = httpx.get("https://api.cloudflare.com/client/v4/user/tokens/verify", headers={"Authorization": f"Bearer {token}"}, timeout=10)
            if r.status_code == 200 and r.json().get("success"):
                return True, "CONNECTED", r.json().get("result", {})
            return False, "INVALID_CREDENTIALS", {"error": r.text}
        except Exception as e:
            return False, "NETWORK_ERROR", {"error": str(e)}
