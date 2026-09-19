"""
Aravanta Cloud OS — Usage Metering Service
Records and accumulates persistent usage records from resource lifecycle events.
"""
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from uuid import uuid4
from app.billing.models import UsageRecord, BillingAccount, BillingLedgerEntry
from app.billing.pricing_engine import PricingEngine
from app.control_plane.models import ResourceRecord

logger = logging.getLogger("aravanta.metering")


def get_meter_info(resource_type: str, spec: Optional[Dict[str, Any]] = None) -> tuple[str, str]:
    """Returns (meter_name, unit) for any cloud service resource type."""
    rtype = (resource_type or "compute").lower()
    if rtype in ("compute", "vm", "instance"):
        return "compute.instance.hours", "hours"
    elif rtype in ("storage", "s3", "bucket"):
        return "storage.gb.hours", "gb-hours"
    elif rtype in ("database", "db", "postgres", "mysql", "redis", "mongodb"):
        return "database.instance.hours", "hours"
    elif rtype in ("kubernetes", "k8s", "cluster"):
        return "kubernetes.cluster.hours", "cluster-hours"
    elif rtype in ("cicd", "pipeline", "build"):
        return "cicd.build.minutes", "minutes"
    elif rtype in ("container", "deployment", "app"):
        return "container.instance.hours", "hours"
    elif rtype in ("network", "bandwidth", "egress"):
        return "network.bandwidth.gb", "gb"
    return f"{rtype}.usage.hours", "hours"


class MeteringService:
    @staticmethod
    def start_usage(db: Session, resource: ResourceRecord) -> Optional[UsageRecord]:
        """
        Starts a new metered usage window when a resource is created or started.
        """
        try:
            spec = json.loads(resource.spec) if resource.spec else {}
        except Exception:
            spec = {}

        meter_name, unit = get_meter_info(resource.type, spec)

        # Check if an open meter already exists for this resource and meter
        existing = db.query(UsageRecord).filter(
            and_(
                UsageRecord.resource_id == resource.id,
                UsageRecord.meter_name == meter_name,
                UsageRecord.status == "OPEN"
            )
        ).first()

        if existing:
            return existing

        now = datetime.utcnow()
        record = UsageRecord(
            organization_id=resource.organization_id,
            project_id=resource.project_id,
            resource_id=resource.id,
            resource_type=resource.type.lower(),
            meter_name=meter_name,
            quantity=0.0,
            unit=unit,
            start_time=now,
            end_time=None,
            status="OPEN",
            created_at=now
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("Started usage metering for %s (%s, %s)", resource.id, resource.name, meter_name)
        return record

    @staticmethod
    def stop_usage(db: Session, resource: ResourceRecord, terminate: bool = False) -> List[UsageRecord]:
        """
        Closes any active usage windows when a resource is stopped or terminated.
        """
        open_records = db.query(UsageRecord).filter(
            and_(
                UsageRecord.resource_id == resource.id,
                UsageRecord.status == "OPEN"
            )
        ).all()

        now = datetime.utcnow()
        closed_records = []

        try:
            spec = json.loads(resource.spec) if resource.spec else {}
        except Exception:
            spec = {}

        for rec in open_records:
            elapsed_seconds = max(0.0, (now - rec.start_time).total_seconds())
            elapsed_hours = max(0.0001, elapsed_seconds / 3600.0)

            if rec.resource_type == "storage":
                disk_gb = float(spec.get("size_gb") or spec.get("capacity_gb") or 10.0)
                rec.quantity = round(disk_gb * elapsed_hours, 4)
            else:
                rec.quantity = round(elapsed_hours, 4)

            rec.end_time = now
            rec.status = "CLOSED"
            closed_records.append(rec)

        if closed_records:
            db.commit()
            for r in closed_records:
                db.refresh(r)
            logger.info("Closed %d usage meters for resource %s", len(closed_records), resource.id)

        return closed_records

    @staticmethod
    def debit_for_record(db: Session, rec: UsageRecord) -> float:
        """Calculates charge and debits from billing account credits/balance with ledger entry."""
        cost = PricingEngine.calculate_cost(rec.meter_name, rec.quantity, db)
        if cost <= 0:
            return 0.0

        account = db.query(BillingAccount).filter(
            BillingAccount.organization_id == rec.organization_id
        ).first()

        now = datetime.utcnow()
        if not account:
            account = BillingAccount(
                id=f"ba-{uuid4().hex[:10]}",
                organization_id=rec.organization_id,
                currency="INR",
                balance=0.0,
                credits=0.0,
                status="ACTIVE",
                billing_cycle="monthly",
                created_at=now,
                updated_at=now
            )
            db.add(account)
            db.flush()

        credit_deducted = min(account.credits, cost)
        account.credits = round(account.credits - credit_deducted, 2)
        remaining_charge = round(cost - credit_deducted, 2)
        account.balance = round(account.balance + remaining_charge, 2)
        account.updated_at = now

        ledger_entry = BillingLedgerEntry(
            id=f"led-{uuid4().hex[:12]}",
            billing_account_id=account.id,
            invoice_id=None,
            entry_type="CHARGE",
            amount=cost,
            currency=account.currency,
            balance_after=round(account.balance, 2),
            description=f"Service usage: {rec.resource_type} ({rec.resource_id[:12]}) - {rec.quantity} {rec.unit} @ ₹{PricingEngine.get_rate(rec.meter_name, db):.2f}/{rec.unit}",
            created_at=now
        )
        db.add(ledger_entry)
        db.commit()
        return cost

    @staticmethod
    def start_resource_meter(
        db: Session,
        resource_id: str,
        resource_type: str,
        organization_id: str,
        project_id: str = "default",
        meter_name: Optional[str] = None,
        unit: Optional[str] = None,
        spec: Optional[Dict[str, Any]] = None,
        initial_debit: bool = True,
        resource_name: Optional[str] = None
    ) -> Optional[UsageRecord]:
        """Starts a metered usage window directly for any service resource, charging initial activation fee."""
        m_name, m_unit = get_meter_info(resource_type, spec)
        meter_name = meter_name or m_name
        unit = unit or m_unit

        existing = db.query(UsageRecord).filter(
            and_(
                UsageRecord.resource_id == resource_id,
                UsageRecord.meter_name == meter_name,
                UsageRecord.status == "OPEN"
            )
        ).first()
        if existing:
            return existing

        now = datetime.utcnow()

        if initial_debit:
            rates = {
                "compute": 1.50,
                "database": 3.00,
                "kubernetes": 4.00,
                "storage": 1.00,
                "container": 1.00,
                "cicd": 0.38,
            }
            fee = rates.get(resource_type.lower(), 1.00)
            try:
                from app.billing.invoice_service import InvoiceService
                account = InvoiceService.get_or_create_billing_account(db, organization_id)
                if account.credits > 0:
                    credit_used = min(account.credits, fee)
                    account.credits = round(account.credits - credit_used, 2)
                    rem = round(fee - credit_used, 2)
                    account.balance = round(account.balance + rem, 2)
                else:
                    account.balance = round(account.balance + fee, 2)
                account.updated_at = now

                disp_name = resource_name or resource_id
                ledger_entry = BillingLedgerEntry(
                    id=f"led-{uuid4().hex[:12]}",
                    billing_account_id=account.id,
                    invoice_id=None,
                    entry_type="CHARGE",
                    amount=fee,
                    currency=account.currency,
                    balance_after=round(account.balance, 2),
                    description=f"Provisioning & service activation: {resource_type} ({disp_name})",
                    created_at=now
                )
                db.add(ledger_entry)
            except Exception as fee_err:
                logger.warning("Failed to record provisioning fee: %s", fee_err)

        record = UsageRecord(
            organization_id=organization_id,
            project_id=project_id,
            resource_id=resource_id,
            resource_type=resource_type.lower(),
            meter_name=meter_name,
            quantity=1.0,
            unit=unit,
            start_time=now,
            end_time=None,
            status="OPEN",
            created_at=now
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info("Started usage metering for %s (%s)", resource_id, meter_name)
        return record

    @staticmethod
    def stop_resource_meter(
        db: Session,
        resource_id: str,
        debit_from_account: bool = True
    ) -> List[UsageRecord]:
        """Closes all open usage windows for resource_id and automatically debits charges."""
        open_records = db.query(UsageRecord).filter(
            and_(
                UsageRecord.resource_id == resource_id,
                UsageRecord.status == "OPEN"
            )
        ).all()

        now = datetime.utcnow()
        closed = []
        for rec in open_records:
            elapsed_seconds = max(0.0, (now - rec.start_time).total_seconds())
            elapsed_hours = max(0.0001, elapsed_seconds / 3600.0)
            rec.quantity = round(elapsed_hours, 4)
            rec.end_time = now
            rec.status = "CLOSED"
            closed.append(rec)

        if closed:
            db.commit()
            if debit_from_account:
                for r in closed:
                    try:
                        MeteringService.debit_for_record(db, r)
                    except Exception as err:
                        logger.warning("Debit failed for %s: %s", r.id, err)
        return closed

    @staticmethod
    def record_instant_charge(
        db: Session,
        organization_id: str,
        resource_type: str,
        resource_id: str,
        meter_name: str,
        quantity: float,
        unit: str,
        description: str = ""
    ) -> UsageRecord:
        """Records a point-in-time metered charge (e.g. CI/CD build run) and immediately debits the account."""
        now = datetime.utcnow()
        rec = UsageRecord(
            organization_id=organization_id,
            project_id="default",
            resource_id=resource_id,
            resource_type=resource_type.lower(),
            meter_name=meter_name,
            quantity=round(quantity, 4),
            unit=unit,
            start_time=now,
            end_time=now,
            status="BILLED",
            created_at=now
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)

        MeteringService.debit_for_record(db, rec)
        return rec

    @staticmethod
    def close_all_for_resource(db: Session, resource_id: str) -> None:
        """Closes all open records when a resource is deleted."""
        open_records = db.query(UsageRecord).filter(
            and_(
                UsageRecord.resource_id == resource_id,
                UsageRecord.status == "OPEN"
            )
        ).all()
        now = datetime.utcnow()
        for rec in open_records:
            elapsed_seconds = max(0.0, (now - rec.start_time).total_seconds())
            rec.quantity = round(max(0.0001, elapsed_seconds / 3600.0), 4)
            rec.end_time = now
            rec.status = "CLOSED"
        if open_records:
            db.commit()

    @staticmethod
    def list_usage(
        db: Session,
        organization_id: str,
        project_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Lists usage records, dynamically calculating current accrued quantities for OPEN records.
        """
        query = db.query(UsageRecord).filter(UsageRecord.organization_id == organization_id)
        if project_id:
            query = query.filter(UsageRecord.project_id == project_id)
        if resource_id:
            query = query.filter(UsageRecord.resource_id == resource_id)
        if status:
            query = query.filter(UsageRecord.status == status.upper())

        records = query.order_by(UsageRecord.created_at.desc()).limit(limit).all()
        now = datetime.utcnow()
        results = []

        for rec in records:
            data = rec.to_dict()
            if rec.status == "OPEN" and rec.start_time:
                elapsed_hours = max(0.0001, (now - rec.start_time).total_seconds() / 3600.0)
                data["quantity"] = round(elapsed_hours, 4)
            results.append(data)

        return results
