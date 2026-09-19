"""
Aravanta Cloud OS — Payment Gateway & Webhook Service
Handles sandbox/live payment execution, idempotent webhook verification, and immutable ledger recording.
"""
import uuid
import hmac
import hashlib
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.billing.models import (
    BillingAccount, Invoice, BillingLedgerEntry, PaymentTransaction, WebhookEventRecord
)
from app.core.cloud_models import emit_notification, InvoiceRecord

logger = logging.getLogger("aravanta.payment")

WEBHOOK_SECRET = "arv_whsec_sandbox_signature_token"


class PaymentService:
    @staticmethod
    def process_payment(
        db: Session,
        invoice_id: str,
        idempotency_key: Optional[str] = None,
        provider: str = "sandbox",
        payment_method: str = "SANDBOX_CHECKOUT"
    ) -> Dict[str, Any]:
        """
        Executes a payment for an invoice with idempotency and ledger recording.
        """
        key = idempotency_key or f"ik-{uuid.uuid4().hex[:16]}"

        # Check idempotency
        existing_tx = db.query(PaymentTransaction).filter(
            PaymentTransaction.idempotency_key == key
        ).first()
        if existing_tx:
            return {
                "transaction_id": existing_tx.id,
                "invoice_id": existing_tx.invoice_id,
                "status": existing_tx.status,
                "amount": existing_tx.amount,
                "currency": existing_tx.currency,
                "idempotent": True,
                "message": "Payment already processed for this idempotency key."
            }

        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found.")

        if invoice.status == "PAID":
            return {
                "invoice_id": invoice.id,
                "status": "ALREADY_PAID",
                "message": f"Invoice {invoice_id} is already paid."
            }

        account = db.query(BillingAccount).filter(
            BillingAccount.id == invoice.billing_account_id
        ).first()

        now = datetime.utcnow()
        tx_id = f"pay-{uuid.uuid4().hex[:12]}"
        amount = invoice.total

        # Create PaymentTransaction
        tx = PaymentTransaction(
            id=tx_id,
            billing_account_id=invoice.billing_account_id,
            invoice_id=invoice.id,
            provider=provider,
            amount=amount,
            currency=invoice.currency,
            status="SUCCEEDED",
            idempotency_key=key,
            provider_payment_id=f"prov_{uuid.uuid4().hex[:14]}",
            created_at=now
        )
        db.add(tx)

        # Mark Invoice as PAID
        invoice.status = "PAID"
        invoice.paid_at = now
        invoice.payment_method = payment_method

        legacy_inv = db.query(InvoiceRecord).filter(InvoiceRecord.id == invoice.id).first()
        if legacy_inv:
            legacy_inv.status = "PAID"
            legacy_inv.payment_method = payment_method

        # Update Account Balance & Ledger
        if account:
            account.balance = max(0.0, round(account.balance - amount, 2))
            account.updated_at = now
            bal_after = account.balance
        else:
            bal_after = 0.0

        ledger_entry = BillingLedgerEntry(
            id=f"led-{uuid.uuid4().hex[:12]}",
            billing_account_id=invoice.billing_account_id,
            invoice_id=invoice.id,
            entry_type="PAYMENT",
            amount=amount,
            currency=invoice.currency,
            balance_after=bal_after,
            description=f"Payment received for invoice {invoice.id} via {provider}",
            created_at=now
        )
        db.add(ledger_entry)

        db.commit()
        db.refresh(tx)
        db.refresh(invoice)

        try:
            emit_notification(
                db,
                title="Invoice Paid",
                message=f"Invoice {invoice.id} for ₹{amount} paid successfully.",
                type="success",
                workspace_id=invoice.organization_id
            )
        except Exception:
            pass

        return {
            "transaction_id": tx.id,
            "invoice_id": invoice.id,
            "status": "SUCCEEDED",
            "amount": amount,
            "currency": invoice.currency,
            "payment_method": payment_method,
            "paid_at": now.isoformat() + "Z",
            "idempotent": False
        }

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
        """Verifies webhook signature using HMAC-SHA256."""
        if not signature:
            return False
        expected = hmac.new(WEBHOOK_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    @staticmethod
    def handle_webhook(
        db: Session,
        provider: str,
        event_id: str,
        payload_bytes: bytes,
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Idempotently processes payment provider webhooks.
        """
        # Deduplication check
        existing = db.query(WebhookEventRecord).filter(
            WebhookEventRecord.event_id == event_id
        ).first()
        if existing:
            return {
                "event_id": event_id,
                "status": "ALREADY_PROCESSED",
                "idempotent": True
            }

        # In sandbox, signature can be optional or validated if provided
        if signature and not PaymentService.verify_webhook_signature(payload_bytes, signature):
            raise ValueError("Invalid webhook signature.")

        payload_dict = {}
        try:
            payload_dict = json.loads(payload_bytes.decode("utf-8"))
        except Exception:
            pass

        event_type = payload_dict.get("event") or payload_dict.get("type", "payment.succeeded")
        invoice_id = payload_dict.get("invoice_id")

        if invoice_id and event_type in ("payment.succeeded", "charge.success", "order.paid"):
            PaymentService.process_payment(
                db=db,
                invoice_id=invoice_id,
                idempotency_key=f"wh-{event_id}",
                provider=provider,
                payment_method=f"{provider.upper()}_WEBHOOK"
            )

        now = datetime.utcnow()
        wh_record = WebhookEventRecord(
            id=f"wh-{uuid.uuid4().hex[:12]}",
            event_id=event_id,
            provider=provider,
            payload=payload_bytes.decode("utf-8", errors="replace"),
            status="PROCESSED",
            created_at=now
        )
        db.add(wh_record)
        db.commit()

        return {
            "event_id": event_id,
            "status": "PROCESSED",
            "event_type": event_type,
            "idempotent": False
        }

    @staticmethod
    def get_ledger(db: Session, organization_id: str) -> List[Dict[str, Any]]:
        """Retrieves append-only ledger entries for tenant's billing account."""
        account = db.query(BillingAccount).filter(
            BillingAccount.organization_id == organization_id
        ).first()
        if not account:
            return []

        entries = db.query(BillingLedgerEntry).filter(
            BillingLedgerEntry.billing_account_id == account.id
        ).order_by(BillingLedgerEntry.created_at.desc()).all()

        return [e.to_dict() for e in entries]
