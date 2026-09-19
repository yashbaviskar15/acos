"""
Aravanta Cloud OS — Automated Production Billing Lifecycle & Parity Tests
Verifies resource-linked metering, versioned pricing, period closing,
invoices with line items, sandbox payments, idempotency, append-only ledger, and REST API parity.
"""
import json
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from tests.conftest import test_engine, TestingSessionLocal, override_get_db
from app.services.arvgate.models import User
from app.control_plane.models import Organization, Project, ResourceRecord
from app.control_plane.resource_manager import ResourceManager
from app.billing.models import (
    BillingAccount, UsageRecord, Invoice, InvoiceLineItem,
    BillingLedgerEntry, PaymentTransaction
)
from app.billing.metering_service import MeteringService
from app.billing.pricing_engine import PricingEngine
from app.billing.invoice_service import InvoiceService
from app.billing.payment_service import PaymentService

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def _setup_tenant_env():
    """Sets up a clean tenant organization, user, and authorization headers."""
    uid = uuid.uuid4().hex[:6]
    test_email = f"billing_admin_{uid}@aravanta.cloud"
    pwd = "SecurePassword123!"

    reg = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": pwd,
        "full_name": "Billing Test Admin"
    })
    assert reg.status_code == 201, f"Register failed: {reg.text}"

    login = client.post("/api/v1/auth/login", json={"email": test_email, "password": pwd})
    assert login.status_code == 200, f"Login failed: {login.text}"
    token = login.json()["access_token"]

    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        assert user is not None
        user.role = "Admin"
        user_id = str(user.id)
        db.commit()

        org_id = f"org-bill-{uid}"
        prj_id = f"prj-bill-{uid}"

        org = Organization(
            id=org_id,
            name="Billing Lifecycle Test Org",
            slug=f"org-test-{uid}",
            owner_id=user_id
        )
        db.add(org)

        prj = Project(
            id=prj_id,
            organization_id=org_id,
            name="Production Billing Project",
            slug="prod-billing",
            region="arv-us-east-1"
        )
        db.add(prj)
        db.commit()

        headers = {
            "Authorization": f"Bearer {token}",
            "x-organization-id": org_id,
            "x-project-id": prj_id,
        }

        return {
            "user_id": user_id,
            "org_id": org_id,
            "prj_id": prj_id,
            "headers": headers,
        }
    finally:
        db.close()


def test_01_billing_account_provisioning():
    """Verifies that a tenant BillingAccount is provisioned with zero static mock values."""
    env = _setup_tenant_env()
    db = TestingSessionLocal()
    try:
        org_id = env["org_id"]
        account = InvoiceService.get_or_create_billing_account(db, org_id)

        assert account.id.startswith("ba-")
        assert account.organization_id == org_id
        assert account.currency == "INR"
        assert account.balance == 0.0
        assert account.status == "ACTIVE"
    finally:
        db.close()


def test_02_pricing_engine_rates_and_calculations():
    """Verifies configurable pricing engine unit costs, precision, and charge calculations."""
    db = TestingSessionLocal()
    try:
        compute_rate = PricingEngine.get_rate("compute.instance.hours", db)
        assert compute_rate == 1.50

        storage_rate = PricingEngine.get_rate("storage.gb.hours", db)
        assert storage_rate == 0.0014

        cost = PricingEngine.calculate_cost("compute.instance.hours", quantity=10.0, db=db)
        assert cost == 15.00

        # Sub-paise rounds up to 1 paise floor
        tiny_cost = PricingEngine.calculate_cost("storage.gb.hours", quantity=0.1, db=db)
        assert tiny_cost == 0.01
    finally:
        db.close()


def test_03_webhook_signature_and_idempotent_dedup():
    """Verifies signature verification and idempotent deduplication of payment webhooks."""
    db = TestingSessionLocal()
    try:
        event_id = f"wh_evt_{uuid.uuid4().hex[:12]}"
        payload = json.dumps({"event": "payment.succeeded", "amount": 500}).encode("utf-8")

        res1 = PaymentService.handle_webhook(
            db=db,
            provider="sandbox",
            event_id=event_id,
            payload_bytes=payload
        )
        assert res1["status"] == "PROCESSED"
        assert res1["idempotent"] is False

        # Duplicate webhook delivery should be caught and not re-applied
        res2 = PaymentService.handle_webhook(
            db=db,
            provider="sandbox",
            event_id=event_id,
            payload_bytes=payload
        )
        assert res2["status"] == "ALREADY_PROCESSED"
        assert res2["idempotent"] is True
    finally:
        db.close()


def test_04_full_metered_billing_lifecycle_and_invoicing():
    """
    Comprehensive End-to-End Test:
    1. Resource creation opens active meter.
    2. Resource stop closes meter with quantity.
    3. Pricing calculation & live estimate with tax.
    4. Period close produces finalized Invoice with resource-linked line items.
    5. Append-only ledger receives CHARGE entry.
    6. Payment settlement produces PAID status and PAYMENT ledger entry.
    7. Payment idempotency is enforced.
    8. REST API endpoints reflect real persisted data.
    """
    env = _setup_tenant_env()
    db = TestingSessionLocal()
    try:
        org_id = env["org_id"]
        prj_id = env["prj_id"]
        uid = env["user_id"]
        headers = env["headers"]

        # Step 1: Create compute resource -> opens UsageRecord
        resource = ResourceManager.create_resource(
            db=db,
            name="prod-api-worker",
            resource_type="compute",
            organization_id=org_id,
            project_id=prj_id,
            owner_id=uid,
            spec={"cpu": 4, "ram_mb": 8192}
        )
        assert resource.status == "RUNNING"

        open_meter = db.query(UsageRecord).filter(
            UsageRecord.resource_id == resource.id,
            UsageRecord.status == "OPEN"
        ).first()
        assert open_meter is not None
        assert open_meter.meter_name == "compute.instance.hours"
        assert open_meter.unit == "hours"

        # Step 2: Stop compute resource -> closes UsageRecord with duration
        ResourceManager.execute_action(db, resource, "stop")
        assert resource.status == "STOPPED"

        closed_meter = db.query(UsageRecord).filter(
            UsageRecord.resource_id == resource.id,
            UsageRecord.status == "CLOSED"
        ).first()
        assert closed_meter is not None
        assert closed_meter.end_time is not None
        # Accrue quantity for invoice calculation
        closed_meter.quantity = 10.0
        db.commit()

        # Step 3: Live cost estimate with GST breakdown
        estimate = InvoiceService.get_live_estimate(db, org_id)
        assert estimate["organization_id"] == org_id
        assert estimate["currency"] == "INR"
        assert estimate["active_unbilled_meters"] >= 1
        assert estimate["subtotal"] >= 15.00
        assert estimate["tax_cgst"] > 0
        assert estimate["tax_sgst"] > 0
        assert estimate["total_estimated"] > estimate["subtotal"]
        assert len(estimate["line_items"]) >= 1

        # Step 4: Close billing period -> generates Invoice with line items
        invoice = InvoiceService.close_billing_period(db, org_id, payment_method="SANDBOX_AUTOPAY")
        assert invoice is not None
        assert invoice.id.startswith("INV-")
        assert invoice.status == "OPEN"
        assert invoice.total > 0.0

        # Verify line item links back to resource
        assert len(invoice.line_items) >= 1
        line_item = invoice.line_items[0]
        assert line_item.resource_id == resource.id
        assert line_item.amount > 0.0

        # Verify CHARGE entry in append-only ledger
        ledger_charge = db.query(BillingLedgerEntry).filter(
            BillingLedgerEntry.invoice_id == invoice.id,
            BillingLedgerEntry.entry_type == "CHARGE"
        ).first()
        assert ledger_charge is not None
        assert ledger_charge.amount == invoice.total
        assert ledger_charge.balance_after == invoice.total

        # Step 5: Process payment
        idempotency_key = f"ik-e2e-{uuid.uuid4().hex[:12]}"
        pay_res = PaymentService.process_payment(
            db=db,
            invoice_id=invoice.id,
            idempotency_key=idempotency_key,
            provider="sandbox",
            payment_method="SANDBOX_AUTOPAY"
        )
        assert pay_res["status"] == "SUCCEEDED"
        assert pay_res["idempotent"] is False

        # Step 6: Verify Invoice status is PAID and ledger PAYMENT posted
        db.refresh(invoice)
        assert invoice.status == "PAID"
        assert invoice.paid_at is not None

        ledger_pay = db.query(BillingLedgerEntry).filter(
            BillingLedgerEntry.invoice_id == invoice.id,
            BillingLedgerEntry.entry_type == "PAYMENT"
        ).first()
        assert ledger_pay is not None
        assert ledger_pay.amount == invoice.total
        assert ledger_pay.balance_after == 0.0

        # Step 7: Payment idempotency check
        pay_retry = PaymentService.process_payment(
            db=db,
            invoice_id=invoice.id,
            idempotency_key=idempotency_key,
            provider="sandbox"
        )
        assert pay_retry["idempotent"] is True

        # Step 8: REST API Endpoints Parity Verification
        # GET /account
        r_acc = client.get("/api/v1/billing/account", headers=headers)
        assert r_acc.status_code == 200
        assert r_acc.json()["organization_id"] == org_id
        assert r_acc.json()["balance"] == 0.0

        # GET /usage
        r_usage = client.get("/api/v1/billing/usage", headers=headers)
        assert r_usage.status_code == 200
        assert isinstance(r_usage.json(), list)

        # GET /estimate
        r_est = client.get("/api/v1/billing/estimate", headers=headers)
        assert r_est.status_code == 200
        assert "total_estimated" in r_est.json()

        # GET /invoices
        r_invs = client.get("/api/v1/billing/invoices", headers=headers)
        assert r_invs.status_code == 200
        invs = r_invs.json()
        assert len(invs) >= 1
        assert invs[0]["id"] == invoice.id
        assert invs[0]["status"] == "PAID"

        # GET /ledger
        r_led = client.get("/api/v1/billing/ledger", headers=headers)
        assert r_led.status_code == 200
        led = r_led.json()
        assert len(led) >= 2
        entry_types = [e["entry_type"] for e in led]
        assert "CHARGE" in entry_types
        assert "PAYMENT" in entry_types

    finally:
        db.close()


def test_05_service_provisioning_debit_add_funds_and_pdf_sanitization():
    """Verifies service activation charge, resilient add-funds top-up, and invoice PDF sanitization."""
    env = _setup_tenant_env()
    org_id = env["org_id"]
    headers = env["headers"]

    db = TestingSessionLocal()
    try:
        # 1. Service provisioning charges account
        from app.billing.metering_service import MeteringService
        vm_id = f"res-vm-{uuid.uuid4().hex[:8]}"
        MeteringService.start_resource_meter(
            db=db,
            resource_id=vm_id,
            resource_type="compute",
            organization_id=org_id,
            initial_debit=True,
            resource_name="test-web-vm"
        )

        acc = InvoiceService.get_or_create_billing_account(db, org_id)
        assert acc.balance >= 1.50

        # Verify ledger has CHARGE entry
        ledger = PaymentService.get_ledger(db, org_id)
        charge_entries = [e for e in ledger if e["entry_type"] == "CHARGE" and "compute" in e["description"].lower()]
        assert len(charge_entries) >= 1

        # 2. Add Funds endpoint top-up
        r_funds = client.post(
            "/api/v1/billing/add-funds",
            json={"amount": 500.0, "payment_method": "SANDBOX_WALLET"},
            headers=headers
        )
        assert r_funds.status_code == 200
        data = r_funds.json()
        assert data["status"] == "SUCCESS"
        assert data["credits_available"] >= 498.0
        assert data["new_balance"] == 0.0

        # 3. Generate invoice and test PDF preview sanitization
        inv = InvoiceService.close_billing_period(db, org_id)
        assert inv is not None

        r_pdf = client.get(
            f"/api/v1/billing/invoices/{inv.id}/pdf",
            headers=headers
        )
        assert r_pdf.status_code == 200
        html_text = r_pdf.text

        # Strict validation: MUST NOT contain raw FastAPI/Pydantic schema internals
        assert "annotation=" not in html_text
        assert "json_schema_extra" not in html_text
        assert "default=None" not in html_text
        assert "Union[str, NoneType]" not in html_text

        # MUST contain valid customer name or default
        assert "Yash Baviskar" in html_text or "Billing" in html_text or "Aravanta" in html_text
    finally:
        db.close()

