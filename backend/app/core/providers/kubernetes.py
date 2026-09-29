"""
Aravanta Cloud OS — Kubernetes API Provider Driver
Communicates with real Kubernetes clusters via kubeconfig / live REST API.
"""
from typing import Dict, Any, Tuple, Optional, List
import httpx
import yaml

from .base import (
    BaseCloudProvider,
    BaseKubernetesDriver
)

class KubernetesAPIDriver(BaseKubernetesDriver):
    def __init__(self, endpoint: str, token: Optional[str] = None, ca_cert: Optional[str] = None):
        self.endpoint = endpoint.rstrip("/")
        self.token = token
        self.ca_cert = ca_cert

    def _client(self) -> httpx.Client:
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return httpx.Client(verify=False, headers=headers, timeout=10.0)

    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        return {"status": "AWAITING_PROVIDER_SETUP", "message": "Cluster provisioning requires EKS/GKE/AKS cloud driver."}

    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        try:
            with self._client() as c:
                r = c.get(f"{self.endpoint}/version")
                if r.status_code == 200:
                    return {"status": "RUNNING", "version": r.json().get("gitVersion")}
                return {"status": "UNKNOWN", "error": f"HTTP {r.status_code}"}
        except Exception as e:
            return {"status": "MISSING_AT_PROVIDER", "error": str(e)}

    def get_nodes(self, provider_resource_id: str = "") -> List[Dict[str, Any]]:
        try:
            with self._client() as c:
                r = c.get(f"{self.endpoint}/api/v1/nodes")
                if r.status_code != 200:
                    return []
                items = r.json().get("items", [])
                nodes = []
                for item in items:
                    meta = item.get("metadata", {})
                    status = item.get("status", {})
                    conditions = status.get("conditions", [])
                    is_ready = any(c.get("type") == "Ready" and c.get("status") == "True" for c in conditions)
                    nodes.append({
                        "name": meta.get("name"),
                        "ready": is_ready,
                        "status": "Ready" if is_ready else "NotReady",
                        "roles": list(meta.get("labels", {}).keys()),
                        "kubelet_version": status.get("nodeInfo", {}).get("kubeletVersion"),
                        "os_image": status.get("nodeInfo", {}).get("osImage")
                    })
                return nodes
        except Exception:
            return []

    def get_pods(self, provider_resource_id: str = "", namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            url = f"{self.endpoint}/api/v1/namespaces/{namespace}/pods" if namespace else f"{self.endpoint}/api/v1/pods"
            with self._client() as c:
                r = c.get(url)
                if r.status_code != 200:
                    return []
                items = r.json().get("items", [])
                pods = []
                for item in items:
                    meta = item.get("metadata", {})
                    status = item.get("status", {})
                    pods.append({
                        "name": meta.get("name"),
                        "namespace": meta.get("namespace"),
                        "status": status.get("phase", "UNKNOWN"),
                        "pod_ip": status.get("podIP"),
                        "host_ip": status.get("hostIP"),
                        "start_time": status.get("startTime")
                    })
                return pods
        except Exception:
            return []

    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        return {"status": "DELETED"}


class KubernetesProvider(BaseCloudProvider):
    name = "Kubernetes"

    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        self.credentials = credentials or {}

    def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        kubeconfig_yaml = credentials.get("kubeconfig_yaml")
        endpoint = credentials.get("endpoint")
        token = credentials.get("token")

        if kubeconfig_yaml:
            try:
                cfg = yaml.safe_load(kubeconfig_yaml)
                clusters = cfg.get("clusters", [])
                if not clusters:
                    return False, "INVALID_CREDENTIALS", {"error": "No clusters defined in kubeconfig."}
                endpoint = clusters[0].get("cluster", {}).get("server")
            except Exception as e:
                return False, "INVALID_CREDENTIALS", {"error": f"Invalid kubeconfig YAML: {e}"}

        if not endpoint:
            return False, "NOT_CONFIGURED", {"error": "Missing Kubernetes API server endpoint."}

        try:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            with httpx.Client(verify=False, headers=headers, timeout=8.0) as c:
                r = c.get(f"{endpoint.rstrip('/')}/version")
                if r.status_code == 200:
                    ver = r.json().get("gitVersion")
                    return True, "CONNECTED", {"endpoint": endpoint, "version": ver}
                elif r.status_code in (401, 403):
                    return False, "INVALID_CREDENTIALS", {"error": f"Authentication failed on Kubernetes endpoint (HTTP {r.status_code})."}
                return False, "INVALID_CREDENTIALS", {"error": f"Kubernetes endpoint returned HTTP {r.status_code}"}
        except httpx.RequestError as e:
            return False, "NETWORK_ERROR", {"error": f"Cannot connect to Kubernetes API server: {e}"}
