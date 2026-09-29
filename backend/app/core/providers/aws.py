"""
Aravanta Cloud OS — AWS Cloud Provider Driver
Calls real AWS APIs via boto3 with mandatory tagging, idempotency, and error handling.
"""
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime
import boto3
from botocore.exceptions import ClientError, EndpointConnectionError, NoCredentialsError
import dns.resolver

from .base import (
    BaseCloudProvider,
    BaseComputeDriver,
    BaseNetworkDriver,
    BaseDNSDriver
)

class AWSComputeDriver(BaseComputeDriver):
    def __init__(self, ec2_client):
        self.ec2 = ec2_client

    def create(self, spec: Dict[str, Any], idempotency_key: str) -> Dict[str, Any]:
        """Runs a real EC2 instance with Aravanta tags and idempotency token."""
        image_id = spec.get("ami_id") or "ami-0c7217cdde317cfec"  # Ubuntu 22.04 LTS ap-south-1 / us-east-1 fallback
        instance_type = spec.get("instance_type") or "t3.micro"
        resource_id = spec.get("resource_id", "inst-unknown")

        tags = [
            {"Key": "managed-by", "Value": "aravanta"},
            {"Key": "aravanta-resource-id", "Value": str(resource_id)},
            {"Key": "Name", "Value": spec.get("name", "aravanta-vm")}
        ]
        if spec.get("is_test"):
            tags.append({"Key": "aravanta-test", "Value": "true"})

        kwargs = {
            "ImageId": image_id,
            "InstanceType": instance_type,
            "MinCount": 1,
            "MaxCount": 1,
            "ClientToken": str(idempotency_key)[:64],
            "TagSpecifications": [
                {"ResourceType": "instance", "Tags": tags}
            ]
        }
        if spec.get("key_name"):
            kwargs["KeyName"] = spec["key_name"]
        if spec.get("subnet_id"):
            kwargs["SubnetId"] = spec["subnet_id"]

        resp = self.ec2.run_instances(**kwargs)
        instance = resp["Instances"][0]
        return {
            "provider_resource_id": instance["InstanceId"],
            "status": "PROVISIONING",
            "private_ip": instance.get("PrivateIpAddress"),
            "public_ip": instance.get("PublicIpAddress"),
            "raw_state": instance["State"]["Name"]
        }

    def start(self, provider_resource_id: str) -> Dict[str, Any]:
        resp = self.ec2.start_instances(InstanceIds=[provider_resource_id])
        state = resp["StartingInstances"][0]["CurrentState"]["Name"]
        return {"provider_resource_id": provider_resource_id, "raw_state": state, "status": "STARTING"}

    def stop(self, provider_resource_id: str) -> Dict[str, Any]:
        resp = self.ec2.stop_instances(InstanceIds=[provider_resource_id])
        state = resp["StoppingInstances"][0]["CurrentState"]["Name"]
        return {"provider_resource_id": provider_resource_id, "raw_state": state, "status": "STOPPING"}

    def restart(self, provider_resource_id: str) -> Dict[str, Any]:
        self.ec2.reboot_instances(InstanceIds=[provider_resource_id])
        return {"provider_resource_id": provider_resource_id, "status": "STARTING"}

    def delete(self, provider_resource_id: str) -> Dict[str, Any]:
        resp = self.ec2.terminate_instances(InstanceIds=[provider_resource_id])
        state = resp["TerminatingInstances"][0]["CurrentState"]["Name"]
        return {"provider_resource_id": provider_resource_id, "raw_state": state, "status": "DELETING"}

    def get_status(self, provider_resource_id: str) -> Dict[str, Any]:
        try:
            resp = self.ec2.describe_instances(InstanceIds=[provider_resource_id])
            reservations = resp.get("Reservations", [])
            if not reservations or not reservations[0].get("Instances"):
                return {"status": "MISSING_AT_PROVIDER", "observed_at": datetime.utcnow().isoformat()}

            inst = reservations[0]["Instances"][0]
            raw_state = inst["State"]["Name"].lower()
            state_map = {
                "running": "RUNNING",
                "stopped": "STOPPED",
                "stopping": "STOPPING",
                "pending": "PROVISIONING",
                "shutting-down": "DELETING",
                "terminated": "DELETED"
            }
            return {
                "status": state_map.get(raw_state, "UNKNOWN"),
                "raw_state": raw_state,
                "private_ip": inst.get("PrivateIpAddress"),
                "public_ip": inst.get("PublicIpAddress"),
                "observed_at": datetime.utcnow().isoformat()
            }
        except ClientError as e:
            if "InvalidInstanceID.NotFound" in str(e):
                return {"status": "MISSING_AT_PROVIDER", "observed_at": datetime.utcnow().isoformat()}
            raise


class AWSNetworkDriver(BaseNetworkDriver):
    def __init__(self, ec2_client):
        self.ec2 = ec2_client

    def create_vpc(self, cidr: str, name: str, idempotency_key: str) -> Dict[str, Any]:
        resp = self.ec2.create_vpc(
            CidrBlock=cidr,
            TagSpecifications=[{
                "ResourceType": "vpc",
                "Tags": [
                    {"Key": "managed-by", "Value": "aravanta"},
                    {"Key": "Name", "Value": name}
                ]
            }]
        )
        vpc = resp["Vpc"]
        return {
            "provider_resource_id": vpc["VpcId"],
            "cidr_block": vpc["CidrBlock"],
            "status": "AVAILABLE" if vpc["State"] == "available" else "PROVISIONING"
        }

    def create_subnet(self, vpc_id: str, cidr: str, name: str) -> Dict[str, Any]:
        resp = self.ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock=cidr,
            TagSpecifications=[{
                "ResourceType": "subnet",
                "Tags": [
                    {"Key": "managed-by", "Value": "aravanta"},
                    {"Key": "Name", "Value": name}
                ]
            }]
        )
        sub = resp["Subnet"]
        return {
            "provider_resource_id": sub["SubnetId"],
            "cidr_block": sub["CidrBlock"],
            "status": "AVAILABLE" if sub["State"] == "available" else "PROVISIONING"
        }

    def delete_vpc(self, provider_vpc_id: str) -> Dict[str, Any]:
        self.ec2.delete_vpc(VpcId=provider_vpc_id)
        return {"provider_resource_id": provider_vpc_id, "status": "DELETED"}


class AWSCloudProvider(BaseCloudProvider):
    name = "AWS"

    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        self.credentials = credentials or {}
        self.region = self.credentials.get("region") or self.credentials.get("aws_region") or "ap-south-1"
        self._sts_client = None
        self._ec2_client = None

    def _get_client(self, service: str):
        kwargs = {"region_name": self.region}
        key_id = self.credentials.get("aws_access_key_id") or self.credentials.get("access_key_id")
        sec_key = self.credentials.get("aws_secret_access_key") or self.credentials.get("secret_access_key")
        session_token = self.credentials.get("aws_session_token")
        if key_id and sec_key:
            kwargs["aws_access_key_id"] = key_id
            kwargs["aws_secret_access_key"] = sec_key
            if session_token:
                kwargs["aws_session_token"] = session_token
        return boto3.client(service, **kwargs)

    @property
    def compute(self) -> AWSComputeDriver:
        if not self._ec2_client:
            self._ec2_client = self._get_client("ec2")
        return AWSComputeDriver(self._ec2_client)

    @property
    def network(self) -> AWSNetworkDriver:
        if not self._ec2_client:
            self._ec2_client = self._get_client("ec2")
        return AWSNetworkDriver(self._ec2_client)

    def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """Makes real authenticated AWS STS API call to verify credentials."""
        self.credentials = credentials
        self.region = credentials.get("region") or credentials.get("aws_region") or "ap-south-1"
        try:
            sts = self._get_client("sts")
            identity = sts.get_caller_identity()
            return True, "CONNECTED", {
                "account_id": identity.get("Account"),
                "arn": identity.get("Arn"),
                "user_id": identity.get("UserId"),
                "region": self.region
            }
        except (ClientError, NoCredentialsError) as e:
            code = getattr(e, "response", {}).get("Error", {}).get("Code", "")
            if "InvalidClientTokenId" in str(e) or "SignatureDoesNotMatch" in str(e) or "AuthFailure" in code:
                return False, "INVALID_CREDENTIALS", {"error": "Invalid AWS Access Key or Secret Key."}
            elif "AccessDenied" in code:
                return False, "INSUFFICIENT_PERMISSIONS", {"error": str(e)}
            return False, "INVALID_CREDENTIALS", {"error": str(e)}
        except EndpointConnectionError as e:
            return False, "NETWORK_ERROR", {"error": f"Cannot reach AWS endpoint in region {self.region}: {e}"}
        except Exception as e:
            return False, "INVALID_CREDENTIALS", {"error": str(e)}
