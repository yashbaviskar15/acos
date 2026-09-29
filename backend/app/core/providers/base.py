"""
Aravanta Cloud OS — Cloud Provider Base Interface
Defines consistent contract for all cloud infrastructure providers.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional, List

class BaseComputeDriver(ABC):
    @abstractmethod
    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        """Create a real compute instance. Returns provider_resource_id, status, IPs."""
        pass

    @abstractmethod
    def start(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def stop(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def restart(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        """Returns {status, public_ip, private_ip, observed_at, raw_state}."""
        pass


class BaseNetworkDriver(ABC):
    @abstractmethod
    def create_vpc(self, cidr: str, name: str, idempotency_key: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def create_subnet(self, vpc_id: str, cidr: str, name: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete_vpc(self, provider_vpc_id: str) -> Dict[str, Any]:
        pass


class BaseDatabaseDriver(ABC):
    @abstractmethod
    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        pass


class BaseKubernetesDriver(ABC):
    @abstractmethod
    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_nodes(self, provider_resource_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_pods(self, provider_resource_id: str, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        pass


class BaseDNSDriver(ABC):
    @abstractmethod
    def create_record(self, zone_id: str, name: str, record_type: str, value: str, ttl: int) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete_record(self, zone_id: str, record_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def lookup(self, name: str, record_type: str) -> Dict[str, Any]:
        pass


class BaseCloudProvider(ABC):
    name: str

    @abstractmethod
    def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Must perform real authenticated call.
        Returns: (success: bool, status: str, details: dict)
        Status must be one of:
          CONNECTED
          INVALID_CREDENTIALS
          INSUFFICIENT_PERMISSIONS
          NETWORK_ERROR
          NOT_CONFIGURED
        """
        pass
