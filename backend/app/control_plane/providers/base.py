"""
Aravanta Cloud OS — Infrastructure Provider Interfaces
Abstract interfaces isolating the control plane from specific cloud or hypervisor backends.
"""
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod


class BaseComputeProvider(ABC):
    @abstractmethod
    def provision(self, resource_id: str, spec: Dict[str, Any], region: str) -> Dict[str, Any]:
        """Provisions a compute instance and returns observed infrastructure metadata."""
        pass

    @abstractmethod
    def start(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def stop(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def terminate(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_observed_state(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        pass


class DefaultComputeProvider(BaseComputeProvider):
    """
    Default deterministic provider for Aravanta Cloud OS compute nodes.
    Assigns VPC private IP, allocated memory, and observed health.
    """
    def provision(self, resource_id: str, spec: Dict[str, Any], region: str) -> Dict[str, Any]:
        import hashlib
        h = hashlib.sha256(f"{resource_id}-{region}".encode()).hexdigest()
        ip_oct1 = int(h[0:2], 16) % 250 + 1
        ip_oct2 = int(h[2:4], 16) % 250 + 1
        return {
            "provider": "aravanta-native",
            "hypervisor": "kvm-qemu",
            "private_ip": f"10.240.{ip_oct1}.{ip_oct2}",
            "allocated_cores": spec.get("cpu", 2),
            "allocated_ram_mb": spec.get("ram_mb", 4096),
            "os_image": spec.get("os_image", "Ubuntu 22.04 LTS"),
            "region": region,
            "lifecycle_state": "RUNNING",
        }

    def start(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        metadata["lifecycle_state"] = "RUNNING"
        return metadata

    def stop(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        metadata["lifecycle_state"] = "STOPPED"
        return metadata

    def terminate(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        metadata["lifecycle_state"] = "TERMINATED"
        return metadata

    def get_observed_state(self, resource_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": metadata.get("lifecycle_state", "UNKNOWN"),
            "ip": metadata.get("private_ip"),
            "healthy": metadata.get("lifecycle_state") == "RUNNING",
        }
