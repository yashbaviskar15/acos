"""
Aravanta Cloud OS — Cloud Provider Factory
"""
from typing import Dict, Any, Optional
from .base import BaseCloudProvider
from .aws import AWSCloudProvider
from .docker_local import DockerLocalProvider
from .cloudflare import CloudflareProvider
from .github import GitHubProvider
from .kubernetes import KubernetesProvider

def get_provider(provider_name: str, credentials: Optional[Dict[str, Any]] = None) -> BaseCloudProvider:
    p_name = provider_name.upper().strip()
    if p_name in ("AWS", "EC2", "ROUTE53"):
        return AWSCloudProvider(credentials)
    elif p_name in ("DOCKER", "LOCAL"):
        return DockerLocalProvider()
    elif p_name in ("CLOUDFLARE", "CF"):
        return CloudflareProvider(credentials)
    elif p_name in ("GITHUB", "GH"):
        return GitHubProvider(credentials)
    elif p_name in ("KUBERNETES", "K8S"):
        return KubernetesProvider(credentials)
    else:
        raise ValueError(f"Unknown or unsupported cloud provider '{provider_name}'.")
