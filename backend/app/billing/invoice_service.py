"""
Aravanta Cloud OS — Invoice & Live Estimation Service
Generates live estimates from unbilled usage and finalizes invoices with immutable ledger charges.
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.billing.models import (
    BillingAccount, UsageRecord, Invoice, InvoiceLineItem, BillingLedgerEntry
)
from app.billing.pricing_engine import PricingEngine
from app.control_plane.models import ResourceRecord
from app.core.cloud_models import InvoiceRecord


class InvoiceService:
    @staticmethod
    def get_or_create_billing_account(db: Session, organization_id: str) -> BillingAccount:
        """Retrieves or provisions the tenant's primary BillingAccount."""
        account = db.query(BillingAccount).filter(
            BillingAccount.organization_id == organization_id
        ).first()

        if not account:
            account = BillingAccount(
                id=f"ba-{uuid.uuid4().hex[:12]}",
                organization_id=organization_id,
                currency="INR",
                balance=0.0,
                credits=0.0,
                billing_cycle="monthly",
                status="ACTIVE",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(account)
            db.commit()
            db.refresh(account)

        return account

    @staticmethod
    def get_live_estimate(db: Session, organization_id: str) -> Dict[str, Any]:
        """
        Calculates live unbilled charges from active and closed usage records.
        """
        account = InvoiceService.get_or_create_billing_account(db, organization_id)
        now = datetime.utcnow()

        unbilled = db.query(UsageRecord).filter(
            and_(
                UsageRecord.organization_id == organization_id,
                UsageRecord.invoice_id.is_(None),
                UsageRecord.status.in_(["OPEN", "CLOSED"])
            )
        ).all()

        line_items = []
        subtotal = 0.0

        for rec in unbilled:
            qty = rec.quantity
            if rec.status == "OPEN" and rec.start_time:
                elapsed_hours = max(0.25, (now - rec.start_time).total_seconds() / 3600.0)
                qty = max(rec.quantity or 1.0, elapsed_hours)

            unit_price = PricingEngine.get_rate(rec.meter_name, db)
            cost = PricingEngine.calculate_cost(rec.meter_name, qty, db)
            subtotal += cost

            # Look up resource name across all service tables
            res_name = rec.resource_id
            try:
                if rec.resource_type == "compute":
                    from app.core.cloud_models import ComputeInstance
                    ci = db.query(ComputeInstance).filter(ComputeInstance.id == rec.resource_id).first()
                    if ci: res_name = ci.name
                elif rec.resource_type == "database":
                    from app.core.cloud_models import DatabaseInstance
                    di = db.query(DatabaseInstance).filter(DatabaseInstance.id == rec.resource_id).first()
                    if di: res_name = di.name
                elif rec.resource_type == "kubernetes":
                    from app.core.cloud_models import KubeCluster
                    kc = db.query(KubeCluster).filter(KubeCluster.id == rec.resource_id).first()
                    if kc: res_name = kc.name
                elif rec.resource_type == "storage":
                    from app.core.cloud_models import StorageBucket
                    sb = db.query(StorageBucket).filter(StorageBucket.id == rec.resource_id).first()
                    if sb: res_name = sb.name
                elif rec.resource_type == "cicd":
                    from app.core.cloud_models import WorkflowRecord
                    wf = db.query(WorkflowRecord).filter(WorkflowRecord.id == rec.resource_id).first()
                    if wf: res_name = wf.name
                else:
                    res = db.query(ResourceRecord).filter(ResourceRecord.id == rec.resource_id).first()
                    if res: res_name = res.name
            except Exception:
                pass

            line_items.append({
                "resource_id": rec.resource_id,
                "resource_name": res_name,
                "resource_type": rec.resource_type,
                "meter_name": rec.meter_name,
                "quantity": round(qty, 4),
                "unit": rec.unit,
                "unit_price": unit_price,
                "amount": cost,
                "status": rec.status,
            })

        subtotal = round(subtotal, 2)
        cgst = round(subtotal * 0.09, 2)
        sgst = round(subtotal * 0.09, 2)
        total = round(subtotal + cgst + sgst, 2)

        return {
            "organization_id": organization_id,
            "currency": account.currency,
            "billing_account_id": account.id,
            "account_balance": account.balance,
            "credits_available": account.credits,
            "active_unbilled_meters": len(unbilled),
            "subtotal": subtotal,
            "tax_cgst": cgst,
            "tax_sgst": sgst,
            "total_estimated": total,
            "line_items": line_items,
            "as_of": now.isoformat() + "Z"
        }

    @staticmethod
    def close_billing_period(
        db: Session,
        organization_id: str,
        payment_method: str = "SANDBOX_AUTOPAY"
    ) -> Optional[Invoice]:
        """
        Closes current billing period:
        1. Closes any open usage records.
        2. Aggregates unbilled usage.
        3. Generates finalized Invoice & InvoiceLineItems.
        4. Writes CHARGE entry to BillingLedgerEntry.
        5. Updates BillingAccount balance.
        """
        account = InvoiceService.get_or_create_billing_account(db, organization_id)
        now = datetime.utcnow()

        # Step 1: Close all open usage records up to now
        open_records = db.query(UsageRecord).filter(
            and_(
                UsageRecord.organization_id == organization_id,
                UsageRecord.status == "OPEN"
            )
        ).all()

        for rec in open_records:
            elapsed = max(0.0001, (now - rec.start_time).total_seconds() / 3600.0)
            rec.quantity = round(elapsed, 4)
            rec.end_time = now
            rec.status = "CLOSED"
        if open_records:
            db.commit()

        # Step 2: Fetch all unbilled closed records
        unbilled = db.query(UsageRecord).filter(
            and_(
                UsageRecord.organization_id == organization_id,
                UsageRecord.invoice_id.is_(None),
                UsageRecord.status == "CLOSED"
            )
        ).all()

        if not unbilled:
            return None

        # Step 3: Compute totals & generate invoice
        inv_id = f"INV-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        period_start = min(r.start_time for r in unbilled)
        period_end = now

        subtotal = 0.0
        line_items = []

        for rec in unbilled:
            rate = PricingEngine.get_rate(rec.meter_name, db)
            cost = PricingEngine.calculate_cost(rec.meter_name, rec.quantity, db)
            subtotal += cost

            res = db.query(ResourceRecord).filter(ResourceRecord.id == rec.resource_id).first()
            res_name = res.name if res else rec.resource_id

            li = InvoiceLineItem(
                id=f"li-{uuid.uuid4().hex[:12]}",
                invoice_id=inv_id,
                resource_id=rec.resource_id,
                meter_name=rec.meter_name,
                description=f"{rec.resource_type.capitalize()}: {res_name} ({rec.quantity} {rec.unit})",
                quantity=rec.quantity,
                unit=rec.unit,
                unit_price=rate,
                amount=cost
            )
            line_items.append(li)

        subtotal = round(subtotal, 2)
        cgst = round(subtotal * 0.09, 2)
        sgst = round(subtotal * 0.09, 2)
        gross_total = round(subtotal + cgst + sgst, 2)

        # Apply credits if available
        credits_applied = min(account.credits, gross_total)
        net_total = round(gross_total - credits_applied, 2)
        account.credits = round(account.credits - credits_applied, 2)
        inv_status = "PAID" if net_total == 0 else "OPEN"

        invoice = Invoice(
            id=inv_id,
            organization_id=organization_id,
            billing_account_id=account.id,
            period_start=period_start,
            period_end=period_end,
            subtotal=subtotal,
            tax_cgst=cgst,
            tax_sgst=sgst,
            credits_applied=credits_applied,
            total=net_total,
            currency=account.currency,
            status=inv_status,
            payment_method=payment_method,
            created_at=now
        )
        db.add(invoice)

        legacy_inv = InvoiceRecord(
            id=inv_id,
            user_id=organization_id,
            workspace_id=organization_id,
            period=f"{period_start.strftime('%B %d')} - {period_end.strftime('%B %d, %Y')}",
            amount_inr=float(net_total),
            amount_usd=round(net_total / 83.0, 2),
            status=inv_status,
            payment_method=payment_method,
            date=now.strftime("%Y-%m-%d"),
            download_url=f"/api/v1/billing/invoices/{inv_id}/pdf",
            created_at=now
        )
        db.add(legacy_inv)

        for li in line_items:
            db.add(li)

        for rec in unbilled:
            rec.status = "BILLED"
            rec.invoice_id = inv_id

        # Update account balance & append to ledger
        if credits_applied > 0:
            credit_ledger = BillingLedgerEntry(
                id=f"led-{uuid.uuid4().hex[:12]}",
                billing_account_id=account.id,
                invoice_id=inv_id,
                entry_type="PAYMENT",
                amount=credits_applied,
                currency=account.currency,
                balance_after=account.balance,
                description=f"Prepaid credits applied to Invoice {inv_id}",
                created_at=now
            )
            db.add(credit_ledger)

        if net_total > 0:
            account.balance = round(account.balance + net_total, 2)
            charge_ledger = BillingLedgerEntry(
                id=f"led-{uuid.uuid4().hex[:12]}",
                billing_account_id=account.id,
                invoice_id=inv_id,
                entry_type="CHARGE",
                amount=net_total,
                currency=account.currency,
                balance_after=account.balance,
                description=f"Metered usage charge for invoice {inv_id}",
                created_at=now
            )
            db.add(charge_ledger)

        account.updated_at = now

        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def list_invoices(db: Session, organization_id: str) -> List[Invoice]:
        """Lists all invoices for an organization."""
        return db.query(Invoice).filter(
            Invoice.organization_id == organization_id
        ).order_by(Invoice.created_at.desc()).all()

    @staticmethod
    def get_invoice(db: Session, invoice_id: str, organization_id: Optional[str] = None) -> Optional[Invoice]:
        """Retrieves a single invoice by ID."""
        query = db.query(Invoice).filter(Invoice.id == invoice_id)
        if organization_id:
            query = query.filter(Invoice.organization_id == organization_id)
        return query.first()
