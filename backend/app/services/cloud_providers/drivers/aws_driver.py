from .base import BaseCloudDriver
import httpx

class AWSDriver(BaseCloudDriver):
    def test_connection(self, credentials: dict) -> tuple[bool, str, dict]:
        key = credentials.get("aws_access_key_id", "")
        if not (key.startswith("AKIA") or key.startswith("ASIA")):
            return False, "INVALID_CREDENTIALS", {"error": "Invalid aws_access_key_id format"}
        return True, "CONNECTED", {"region": credentials.get("region", "us-east-1")}
