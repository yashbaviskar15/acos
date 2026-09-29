"""
Aravanta Cloud OS — Cloudflare DNS Provider Driver
Manages real DNS records via Cloudflare API and verifies propagation with dnspython.
"""
from typing import Dict, Any, Tuple, Optional
import httpx
try:
    import dns.resolver
except ImportError:
    dns = None

from .base import (
    BaseCloudProvider,
    BaseDNSDriver
)

class CloudflareDNSDriver(BaseDNSDriver):
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.cloudflare.com/client/v4"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    def create_record(self, zone_id: str, name: str, record_type: str, value: str, ttl: int = 300) -> Dict[str, Any]:
        payload = {
            "type": record_type.upper(),
            "name": name,
            "content": value,
            "ttl": ttl
        }
        resp = httpx.post(
            f"{self.base_url}/zones/{zone_id}/dns_records",
            headers=self._headers(),
            json=payload,
            timeout=10.0
        )
        data = resp.json()
        if not data.get("success"):
            err_msg = "; ".join([e.get("message", "") for e in data.get("errors", [])])
            raise RuntimeError(f"Cloudflare DNS record creation failed: {err_msg}")

        result = data["result"]
        return {
            "provider_resource_id": result["id"],
            "name": result["name"],
            "type": result["type"],
            "value": result["content"],
            "ttl": result["ttl"],
            "status": "AVAILABLE"
        }

    def delete_record(self, zone_id: str, record_id: str) -> Dict[str, Any]:
        resp = httpx.delete(
            f"{self.base_url}/zones/{zone_id}/dns_records/{record_id}",
            headers=self._headers(),
            timeout=10.0
        )
        data = resp.json()
        if not data.get("success"):
            err_msg = "; ".join([e.get("message", "") for e in data.get("errors", [])])
            raise RuntimeError(f"Cloudflare DNS record deletion failed: {err_msg}")
        return {"provider_resource_id": record_id, "status": "DELETED"}

    def lookup(self, name: str, record_type: str = "A") -> Dict[str, Any]:
        """Performs real DNS query using dnspython or socket to verify active propagation."""
        if dns is not None:
            try:
                answers = dns.resolver.resolve(name, record_type.upper(), lifetime=5.0)
                resolved = [str(rdata) for rdata in answers]
                return {
                    "name": name,
                    "type": record_type.upper(),
                    "resolved_values": resolved,
                    "propagated": len(resolved) > 0,
                    "ttl": answers.rrset.ttl if answers.rrset else None,
                    "source": "dns-resolver"
                }
            except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.LifetimeTimeout) as e:
                return {
                    "name": name,
                    "type": record_type.upper(),
                    "resolved_values": [],
                    "propagated": False,
                    "error": str(e),
                    "source": "dns-resolver"
                }
            except Exception as e:
                return {
                    "name": name,
                    "type": record_type.upper(),
                    "resolved_values": [],
                    "propagated": False,
                    "error": str(e),
                    "source": "dns-resolver"
                }
        else:
            import socket
            try:
                addr = socket.gethostbyname(name)
                return {
                    "name": name,
                    "type": record_type.upper(),
                    "resolved_values": [addr],
                    "propagated": True,
                    "ttl": None,
                    "source": "socket-resolver"
                }
            except Exception as e:
                return {
                    "name": name,
                    "type": record_type.upper(),
                    "resolved_values": [],
                    "propagated": False,
                    "error": str(e),
                    "source": "socket-resolver"
                }


class CloudflareProvider(BaseCloudProvider):
    name = "Cloudflare"

    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        self.credentials = credentials or {}
        self.token = self.credentials.get("token") or self.credentials.get("api_token")

    @property
    def dns(self) -> CloudflareDNSDriver:
        if not self.token:
            raise ValueError("Cloudflare API token not configured")
        return CloudflareDNSDriver(self.token)

    def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        token = credentials.get("token") or credentials.get("api_token")
        if not token:
            return False, "INVALID_CREDENTIALS", {"error": "Missing Cloudflare API token."}

        try:
            r = httpx.get(
                "https://api.cloudflare.com/client/v4/user/tokens/verify",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            data = r.json()
            if r.status_code == 200 and data.get("success"):
                result = data.get("result", {})
                return True, "CONNECTED", {
                    "token_id": result.get("id"),
                    "status": result.get("status")
                }
            return False, "INVALID_CREDENTIALS", {"error": "Invalid or expired Cloudflare API token."}
        except httpx.RequestError as e:
            return False, "NETWORK_ERROR", {"error": f"Failed to connect to Cloudflare API: {str(e)}"}
        except Exception as e:
            return False, "INVALID_CREDENTIALS", {"error": str(e)}
