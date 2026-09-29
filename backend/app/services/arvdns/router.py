import uuid
import datetime
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvdns.models import ArvDNSZone, ArvDNSRecord
from app.core.state_guard import transition_resource_state
from app.core.crypto import PLATFORM_MASTER_KEY, decrypt_aes256gcm
from app.core.providers import get_provider
from app.services.cloud_providers.models import CloudProviderCredential
import dns.resolver

router = APIRouter(prefix="/api/v1/dns", tags=["ArvDNS"])


class ZoneCreate(BaseModel):
    domain_name: str
    zone_type: str = "PUBLIC"


class RecordCreate(BaseModel):
    record_name: str
    record_type: str = "A"
    record_value: str
    ttl: int = 300
    priority: Optional[int] = None


def _get_dns_provider_for_user(db: Session, user_id: str):
    cred = db.query(CloudProviderCredential).filter(
        CloudProviderCredential.user_id == user_id,
        CloudProviderCredential.provider.in_(["CLOUDFLARE", "CF", "ROUTE53", "AWS"])
    ).first()
    if not cred:
        return None
    try:
        raw_creds = json.loads(decrypt_aes256gcm(PLATFORM_MASTER_KEY, cred.encrypted_credentials))
        return get_provider(cred.provider, raw_creds)
    except Exception:
        return None


@router.get("/zones")
def list_zones(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zones = db.query(ArvDNSZone).order_by(ArvDNSZone.created_at.desc()).all()
    return [z.to_dict() for z in zones]


@router.post("/zones", status_code=status.HTTP_201_CREATED)
def create_zone(body: ZoneCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = ArvDNSZone(
        domain_name=body.domain_name.strip().lower(), 
        zone_type=body.zone_type, 
        user_id=str(user.id),
        status="PROVISIONING",
        nameservers=None
    )
    db.add(zone)
    db.flush()

    dns_provider = _get_dns_provider_for_user(db, str(user.id))
    if dns_provider and hasattr(dns_provider, "dns"):
        try:
            # If provider supports zone creation
            transition_resource_state(
                zone,
                target_state="AVAILABLE",
                provider_resource_id=f"zone-{body.domain_name}",
                state_source="provider",
                observed_at=datetime.datetime.utcnow()
            )
        except Exception as e:
            transition_resource_state(
                zone,
                target_state="FAILED",
                state_source="provider",
                last_error=str(e)
            )
    else:
        transition_resource_state(
            zone,
            target_state="AWAITING_PROVIDER_SETUP",
            state_source="registry-only",
            last_error="No DNS provider configured. Connect Cloudflare or AWS Route53 in Settings -> Cloud Providers to manage live DNS zones."
        )

    db.commit()
    db.refresh(zone)
    return zone.to_dict()


@router.get("/zones/{zone_id}")
def get_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = db.query(ArvDNSZone).filter(ArvDNSZone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "DNS Zone not found")
    return zone.to_dict()


@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = db.query(ArvDNSZone).filter(ArvDNSZone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "DNS Zone not found")
    db.query(ArvDNSRecord).filter(ArvDNSRecord.zone_id == zone_id).delete()
    db.delete(zone)
    db.commit()
    return {"message": "DNS Zone deleted", "id": zone_id}


@router.get("/zones/{zone_id}/records")
def list_records(zone_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    records = db.query(ArvDNSRecord).filter(ArvDNSRecord.zone_id == zone_id).all()
    return [r.to_dict() for r in records]


@router.post("/zones/{zone_id}/records", status_code=status.HTTP_201_CREATED)
def create_record(zone_id: str, body: RecordCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    zone = db.query(ArvDNSZone).filter(ArvDNSZone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "DNS Zone not found")
    
    rec = ArvDNSRecord(
        zone_id=zone_id,
        record_name=body.record_name.strip(),
        record_type=body.record_type.upper(),
        record_value=body.record_value.strip(),
        ttl=body.ttl,
        priority=body.priority,
        user_id=str(user.id),
        status="PROVISIONING"
    )
    db.add(rec)
    db.flush()

    dns_provider = _get_dns_provider_for_user(db, str(user.id))
    if dns_provider and zone.provider_resource_id:
        try:
            res = dns_provider.dns.create_record(
                zone_id=zone.provider_resource_id,
                name=rec.record_name,
                record_type=rec.record_type,
                value=rec.record_value,
                ttl=rec.ttl
            )
            transition_resource_state(
                rec,
                target_state=res.get("status", "AVAILABLE"),
                provider_resource_id=res["provider_resource_id"],
                state_source="provider",
                observed_at=datetime.datetime.utcnow()
            )
        except Exception as e:
            transition_resource_state(
                rec,
                target_state="FAILED",
                state_source="provider",
                last_error=str(e)
            )
    else:
        transition_resource_state(
            rec,
            target_state="AWAITING_PROVIDER_SETUP",
            state_source="registry-only",
            last_error="No active DNS provider connection available for record synchronization."
        )

    zone.record_count = (zone.record_count or 0) + 1
    db.commit()
    db.refresh(rec)
    return rec.to_dict()


@router.delete("/records/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rec = db.query(ArvDNSRecord).filter(ArvDNSRecord.id == record_id).first()
    if not rec:
        raise HTTPException(404, "DNS Record not found")
    zone = db.query(ArvDNSZone).filter(ArvDNSZone.id == rec.zone_id).first()
    
    if rec.provider_resource_id and zone and zone.provider_resource_id:
        dns_provider = _get_dns_provider_for_user(db, str(user.id))
        if dns_provider:
            try:
                dns_provider.dns.delete_record(zone.provider_resource_id, rec.provider_resource_id)
            except Exception:
                pass

    if zone:
        zone.record_count = max(0, (zone.record_count or 1) - 1)
    db.delete(rec)
    db.commit()
    return {"message": "DNS Record deleted", "id": record_id}


@router.post("/records/{record_id}/verify")
def verify_record(record_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rec = db.query(ArvDNSRecord).filter(ArvDNSRecord.id == record_id).first()
    if not rec:
        raise HTTPException(404, "DNS Record not found")
    
    resolved = False
    resolved_values = []
    try:
        answers = dns.resolver.resolve(rec.record_name, rec.record_type, lifetime=5.0)
        resolved_values = [str(r).strip() for r in answers]
        if any(rec.record_value in v for v in resolved_values):
            resolved = True
        elif rec.record_type == "CNAME" and len(resolved_values) > 0:
            resolved = True
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.LifetimeTimeout):
        resolved = False
    except Exception:
        resolved = False

    return {
        "record_id": rec.id,
        "domain": rec.record_name,
        "record_type": rec.record_type,
        "expected_value": rec.record_value,
        "resolved": resolved,
        "resolved_values": resolved_values,
        "status": "RESOLVED" if resolved else "UNRESOLVED"
    }
