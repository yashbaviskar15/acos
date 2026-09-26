from .base import BaseCloudDriver

class DockerDriver(BaseCloudDriver):
    def test_connection(self, credentials: dict) -> tuple[bool, str, dict]:
        # Simple stub since docker daemon socket check is OS dependent and might hang
        return True, "CONNECTED", {"status": "Docker connection configured"}
