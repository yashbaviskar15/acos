"""
Aravanta Cloud OS — Local Container Driver (Docker)
Operates real local container instances labeled honestly as "Container instance" (NOT "VM").
If Docker daemon is offline or unavailable, explicitly signals AWAITING_PROVIDER_SETUP / NETWORK_ERROR.
"""
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime
import docker
from docker.errors import DockerException, NotFound, APIError

from .base import (
    BaseCloudProvider,
    BaseComputeDriver
)

class DockerComputeDriver(BaseComputeDriver):
    def __init__(self, client: docker.DockerClient):
        self.client = client

    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        """Runs a real container instance on local Docker daemon."""
        image = spec.get("os_image_name") or "ubuntu:22.04"
        name = spec.get("name", f"aravanta-c-{idempotency_key[:8]}")
        resource_id = spec.get("resource_id", "container-unknown")

        labels = {
            "managed-by": "aravanta",
            "aravanta-resource-id": str(resource_id),
            "aravanta-name": name,
            "aravanta-type": "container-instance"
        }

        # Pull image if needed
        try:
            self.client.images.get(image)
        except NotFound:
            self.client.images.pull(image)

        container = self.client.containers.run(
            image=image,
            command="tail -f /dev/null",  # Keep container running like a persistent VM
            name=name,
            detach=True,
            labels=labels
        )
        container.reload()
        ip_addr = container.attrs.get("NetworkSettings", {}).get("IPAddress")

        return {
            "provider_resource_id": container.id,
            "status": "RUNNING" if container.status == "running" else "PROVISIONING",
            "private_ip": ip_addr,
            "public_ip": None,  # Local containers don't have public IPs unless port-forwarded
            "raw_state": container.status
        }

    def start(self, provider_resource_id: str) -> Dict[str, Any]:
        c = self.client.containers.get(provider_resource_id)
        c.start()
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "RUNNING" if c.status == "running" else "STARTING"}

    def stop(self, provider_resource_id: str) -> Dict[str, Any]:
        c = self.client.containers.get(provider_resource_id)
        c.stop(timeout=10)
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "STOPPED"}

    def restart(self, provider_resource_id: str) -> Dict[str, Any]:
        c = self.client.containers.get(provider_resource_id)
        c.restart()
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "RUNNING"}

    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        try:
            c = self.client.containers.get(provider_resource_id)
            c.remove(force=True)
        except NotFound:
            pass
        return {"provider_resource_id": provider_resource_id, "status": "DELETED"}

    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        try:
            c = self.client.containers.get(provider_resource_id)
            c.reload()
            raw_state = c.status
            state_map = {
                "running": "RUNNING",
                "exited": "STOPPED",
                "paused": "STOPPED",
                "restarting": "STARTING",
                "dead": "FAILED"
            }
            ip_addr = c.attrs.get("NetworkSettings", {}).get("IPAddress")
            return {
                "status": state_map.get(raw_state, "UNKNOWN"),
                "raw_state": raw_state,
                "private_ip": ip_addr,
                "public_ip": None,
                "observed_at": datetime.utcnow().isoformat()
            }
        except NotFound:
            return {"status": "MISSING_AT_PROVIDER", "observed_at": datetime.utcnow().isoformat()}


class DockerLocalProvider(BaseCloudProvider):
    name = "Docker"

    def __init__(self):
        self._client = None

    def _get_client(self) -> docker.DockerClient:
        if not self._client:
            self._client = docker.from_env()
        return self._client

    @property
    def compute(self) -> DockerComputeDriver:
        client = self._get_client()
        return DockerComputeDriver(client)

    def test_connection(self, credentials: Dict[str, Any] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """Pings the local Docker daemon to verify it is responsive."""
        try:
            client = self._get_client()
            if client.ping():
                version_info = client.version()
                return True, "CONNECTED", {
                    "version": version_info.get("Version"),
                    "api_version": version_info.get("ApiVersion"),
                    "os": version_info.get("Os")
                }
            return False, "NETWORK_ERROR", {"error": "Docker daemon did not reply to ping."}
        except DockerException as e:
            return False, "NETWORK_ERROR", {
                "error": f"Docker daemon is not running or accessible on host: {str(e)}"
            }
        except Exception as e:
            return False, "NETWORK_ERROR", {"error": str(e)}
