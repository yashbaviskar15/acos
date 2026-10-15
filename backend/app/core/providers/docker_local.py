"""
Aravanta Cloud OS — Local Container Driver (Docker)
Operates real local container instances labeled honestly as "Container instance" (NOT "VM").
If Docker daemon is offline or unavailable, explicitly signals AWAITING_PROVIDER_SETUP / NETWORK_ERROR.
"""
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime
try:
    import docker
    from docker.errors import DockerException, NotFound, APIError
    # Compatibility fix: requests >= 2.32 introduces get_connection_with_tls_context
    # which breaks docker-py's custom http+docker adapter unless overridden.
    try:
        from docker.transport import NpipeHTTPAdapter, UnixHTTPAdapter
        def _get_connection_with_tls_context(self, request, verify, **kwargs):
            return self.get_connection(request.url, kwargs.get("proxies"))

        if not hasattr(NpipeHTTPAdapter, 'get_connection_with_tls_context'):
            NpipeHTTPAdapter.get_connection_with_tls_context = _get_connection_with_tls_context
        if not hasattr(UnixHTTPAdapter, 'get_connection_with_tls_context'):
            UnixHTTPAdapter.get_connection_with_tls_context = _get_connection_with_tls_context
    except Exception:
        pass
except ImportError:
    docker = None
    class DockerException(Exception): pass  # type: ignore
    class NotFound(Exception): pass        # type: ignore
    class APIError(Exception): pass        # type: ignore

from .base import (
    BaseCloudProvider,
    BaseComputeDriver
)

class DockerComputeDriver(BaseComputeDriver):
    def __init__(self, client: Any = None):
        self.client = client

    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        """Runs a real container instance on local Docker daemon."""
        if docker is None or self.client is None:
            return {
                "status": "AWAITING_PROVIDER_SETUP",
                "message": "Docker SDK / daemon is not available on this host environment."
            }

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
        if docker is None or self.client is None:
            return {"provider_resource_id": provider_resource_id, "status": "FAILED", "error": "Docker client unavailable"}
        c = self.client.containers.get(provider_resource_id)
        c.start()
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "RUNNING" if c.status == "running" else "STARTING"}

    def stop(self, provider_resource_id: str) -> Dict[str, Any]:
        if docker is None or self.client is None:
            return {"provider_resource_id": provider_resource_id, "status": "FAILED", "error": "Docker client unavailable"}
        c = self.client.containers.get(provider_resource_id)
        c.stop(timeout=10)
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "STOPPED"}

    def restart(self, provider_resource_id: str) -> Dict[str, Any]:
        if docker is None or self.client is None:
            return {"provider_resource_id": provider_resource_id, "status": "FAILED", "error": "Docker client unavailable"}
        c = self.client.containers.get(provider_resource_id)
        c.restart()
        c.reload()
        return {"provider_resource_id": provider_resource_id, "status": "RUNNING"}

    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        if docker is None or self.client is None:
            return {"provider_resource_id": provider_resource_id, "status": "DELETED"}
        try:
            c = self.client.containers.get(provider_resource_id)
            c.remove(force=True)
        except NotFound:
            pass
        return {"provider_resource_id": provider_resource_id, "status": "DELETED"}

    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        if docker is None or self.client is None:
            return {"status": "UNKNOWN", "observed_at": datetime.utcnow().isoformat(), "error": "Docker client unavailable"}
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

    def _get_client(self):
        if docker is None:
            raise RuntimeError("The 'docker' Python package is not installed on this host environment.")
        if self._client:
            try:
                if self._client.ping():
                    return self._client
            except Exception:
                self._client = None

        import sys
        candidates = []
        if sys.platform == "win32":
            candidates.extend([
                "npipe:////./pipe/dockerDesktopLinuxEngine",
                "npipe:////./pipe/docker_engine",
                "tcp://127.0.0.1:2375"
            ])
        candidates.append(None)  # from_env()

        for base_url in candidates:
            try:
                if base_url:
                    client = docker.DockerClient(base_url=base_url)
                else:
                    client = docker.from_env()
                if client.ping():
                    self._client = client
                    return self._client
            except Exception:
                continue

        raise DockerException("Unable to connect to Docker daemon across standard endpoints.")

    @property
    def compute(self) -> DockerComputeDriver:
        client = None
        try:
            client = self._get_client()
        except Exception:
            pass
        return DockerComputeDriver(client)

    def test_connection(self, credentials: Dict[str, Any] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """Pings the local Docker daemon to verify it is responsive."""
        if docker is None:
            return False, "NOT_SUPPORTED_ON_HOST", {
                "error": "The 'docker' Python SDK is not installed on this host (e.g. serverless runtime). Real container operations require a local Docker host."
            }
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
        except Exception as e:
            err_msg = str(e)
            if "pipe" in err_msg.lower() or "connect" in err_msg.lower():
                err_msg = "Docker Desktop is installed, but the Docker Engine daemon is still starting or stopped. Please ensure the whale icon is green or restart Docker Desktop."
            return False, "NETWORK_ERROR", {"error": err_msg}
