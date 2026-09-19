"""
Aravanta Cloud OS — Persistent Billing and Ledger Models
"""
import uuid
import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


class BillingAccount(Base):
    __tablename__ = "billing_accounts"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("ba"))
    organization_id = Column(String(50), unique=True, index=True, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    credits = Column(Float, default=0.0, nullable=False)
    billing_cycle = Column(String(20), default="monthly", nullable=False)
    status = Column(String(20), default="ACTIVE", index=True, nullable=False)  # ACTIVE, PAST_DUE, SUSPENDED
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "currency": self.currency,
            "balance": round(self.balance, 2),
            "credits": round(self.credits, 2),
            "billing_cycle": self.billing_cycle,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class UsageRecord(Base):
    """
    Persisted usage meter record emitted by resource lifecycle events.
    """
    __tablename__ = "billing_usage_records"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("usg"))
    organization_id = Column(String(50), index=True, nullable=False)
    project_id = Column(String(50), index=True, nullable=False)
    resource_id = Column(String(50), index=True, nullable=False)
    resource_type = Column(String(50), index=True, nullable=False)  # compute, storage, database, etc.
    meter_name = Column(String(100), index=True, nullable=False)  # compute.instance.hours, storage.gb.hours, etc.
    quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="hours", nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="OPEN", index=True, nullable=False)  # OPEN, CLOSED, BILLED
    invoice_id = Column(String(50), index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "project_id": self.project_id,
            "resource_id": self.resource_id,
            "resource_type": self.resource_type,
            "meter_name": self.meter_name,
            "quantity": round(self.quantity, 4),
            "unit": self.unit,
            "start_time": self.start_time.isoformat() + "Z" if self.start_time else None,
            "end_time": self.end_time.isoformat() + "Z" if self.end_time else None,
            "status": self.status,
            "invoice_id": self.invoice_id,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class PriceRate(Base):
    """
    Versioned pricing rate definitions.
    """
    __tablename__ = "billing_price_rates"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("pr"))
    meter_name = Column(String(100), index=True, nullable=False)
    unit_price = Column(Float, nullable=False)  # in currency unit (e.g. INR)
    currency = Column(String(10), default="INR", nullable=False)
    unit = Column(String(50), default="hours", nullable=False)
    effective_from = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    effective_until = Column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "meter_name": self.meter_name,
            "unit_price": self.unit_price,
            "currency": self.currency,
            "unit": self.unit,
            "effective_from": self.effective_from.isoformat() + "Z" if self.effective_from else None,
            "effective_until": self.effective_until.isoformat() + "Z" if self.effective_until else None,
        }


class Invoice(Base):
    __tablename__ = "billing_invoices"

    id = Column(String(50), primary_key=True)  # INV-YYYYMM-XXXX
    organization_id = Column(String(50), index=True, nullable=False)
    billing_account_id = Column(String(50), index=True, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_cgst = Column(Float, default=0.0, nullable=False)  # 9%
    tax_sgst = Column(Float, default=0.0, nullable=False)  # 9%
    credits_applied = Column(Float, default=0.0, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(20), default="OPEN", index=True, nullable=False)  # DRAFT, OPEN, PAID, VOID
    payment_method = Column(String(100), default="SANDBOX_GATEWAY", nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")

    def to_dict(self, include_items: bool = True) -> dict:
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "billing_account_id": self.billing_account_id,
            "period_start": self.period_start.isoformat() + "Z" if self.period_start else None,
            "period_end": self.period_end.isoformat() + "Z" if self.period_end else None,
            "subtotal": round(self.subtotal, 2),
            "tax_cgst": round(self.tax_cgst, 2),
            "tax_sgst": round(self.tax_sgst, 2),
            "credits_applied": round(self.credits_applied, 2),
            "total": round(self.total, 2),
            "currency": self.currency,
            "status": self.status,
            "payment_method": self.payment_method,
            "paid_at": self.paid_at.isoformat() + "Z" if self.paid_at else None,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }
        if include_items:
            data["line_items"] = [item.to_dict() for item in self.line_items] if self.line_items else []
        return data


class InvoiceLineItem(Base):
    __tablename__ = "billing_invoice_line_items"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("li"))
    invoice_id = Column(String(50), ForeignKey("billing_invoices.id"), index=True, nullable=False)
    resource_id = Column(String(50), index=True, nullable=True)
    meter_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "invoice_id": self.invoice_id,
            "resource_id": self.resource_id,
            "meter_name": self.meter_name,
            "description": self.description,
            "quantity": round(self.quantity, 4),
            "unit": self.unit,
            "unit_price": round(self.unit_price, 4),
            "amount": round(self.amount, 2),
        }


class BillingLedgerEntry(Base):
    """
    Append-only, immutable financial transaction ledger.
    """
    __tablename__ = "billing_ledger_entries"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("led"))
    billing_account_id = Column(String(50), index=True, nullable=False)
    invoice_id = Column(String(50), index=True, nullable=True)
    entry_type = Column(String(30), index=True, nullable=False)  # CHARGE, PAYMENT, CREDIT, REFUND, ADJUSTMENT
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    balance_after = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "billing_account_id": self.billing_account_id,
            "invoice_id": self.invoice_id,
            "entry_type": self.entry_type,
            "amount": round(self.amount, 2),
            "currency": self.currency,
            "balance_after": round(self.balance_after, 2),
            "description": self.description,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class PaymentTransaction(Base):
    __tablename__ = "billing_payment_transactions"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("pay"))
    billing_account_id = Column(String(50), index=True, nullable=False)
    invoice_id = Column(String(50), index=True, nullable=False)
    provider = Column(String(50), default="sandbox", nullable=False)  # sandbox, razorpay, stripe
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(30), default="SUCCEEDED", nullable=False)  # PENDING, SUCCEEDED, FAILED
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    provider_payment_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "billing_account_id": self.billing_account_id,
            "invoice_id": self.invoice_id,
            "provider": self.provider,
            "amount": round(self.amount, 2),
            "currency": self.currency,
            "status": self.status,
            "idempotency_key": self.idempotency_key,
            "provider_payment_id": self.provider_payment_id,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }


class WebhookEventRecord(Base):
    __tablename__ = "billing_webhook_events"

    id = Column(String(50), primary_key=True, default=lambda: _gen_id("wh"))
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    provider = Column(String(50), nullable=False)
    payload = Column(Text, nullable=False)
    status = Column(String(30), default="PROCESSED", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "event_id": self.event_id,
            "provider": self.provider,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }
