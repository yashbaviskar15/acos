"""
Aravanta CloudOS — ArvBilling Service Router
Billing analytics, service cost breakdown, budget alerts, payment orders, and affordable subscription pricing.
"""
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/billing", tags=["ArvBilling — Cost Analytics"])

class BudgetUpdate(BaseModel):
    monthly_budget_usd: float

class OrderRequest(BaseModel):
    amount: int  # in paise (₹ x 100)
    currency: str = "INR"
    description: str = "Cloud Infrastructure Subscription"

class PaymentVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str = ""
    amount_inr: float = 1499.0

_billing_state = {
    "monthly_budget_usd": 60.00,
    "mtd_spend_usd": 18.00,
    "projected_spend_usd": 25.00,
    "currency": "USD"
}

_service_costs = [
    {"service": "ArvCompute (EC2 Instances)", "cost_usd": 9.54, "percent": 53, "color": "bg-blue-500"},
    {"service": "ArvDB (PostgreSQL & Redis)", "cost_usd": 4.50, "percent": 25, "color": "bg-amber-500"},
    {"service": "ArvKube (EKS Worker Nodes)", "cost_usd": 2.52, "percent": 14, "color": "bg-purple-500"},
    {"service": "ArvStore (S3 Buckets)", "cost_usd": 1.44, "percent": 8, "color": "bg-emerald-500"},
]

_invoices = [
    {"invoice_id": "INV-2026-07", "period": "July 2026", "amount_usd": 18.06, "amount_inr": 1499, "status": "PAID", "date": "2026-08-01"},
    {"invoice_id": "INV-2026-06", "period": "June 2026", "amount_usd": 18.06, "amount_inr": 1499, "status": "PAID", "date": "2026-07-01"},
    {"invoice_id": "INV-2026-05", "period": "May 2026", "amount_usd": 6.01, "amount_inr": 499, "status": "PAID", "date": "2026-06-01"},
    {"invoice_id": "INV-2026-04", "period": "April 2026", "amount_usd": 6.01, "amount_inr": 499, "status": "PAID", "date": "2026-05-01"},
]

_plans = [
    {"id": "starter", "name": "Developer Starter", "price_inr": 499, "price_usd": 6.00, "period": "month", "vms": "2 VMs", "k8s": "1 Cluster", "storage": "50 GB S3", "popular": False},
    {"id": "pro", "name": "Pro Developer Tier", "price_inr": 1499, "price_usd": 18.00, "period": "month", "vms": "10 VMs", "k8s": "3 Clusters", "storage": "500 GB S3", "popular": True},
    {"id": "enterprise", "name": "Enterprise Team", "price_inr": 4999, "price_usd": 60.00, "period": "month", "vms": "Unlimited", "k8s": "10 Clusters", "storage": "2 TB S3", "popular": False},
]

_service_pricing = [
    {"service": "ArvCompute (VMs)", "description": "Virtual Machine Instances & Auto-Scaling", "price_inr": 299, "price_usd": 3.60, "unit": "per VM/month", "icon": "Server"},
    {"service": "ArvKube (K8s)", "description": "Managed Kubernetes Clusters", "price_inr": 499, "price_usd": 6.00, "unit": "per cluster/month", "icon": "Boxes"},
    {"service": "ArvStore (S3)", "description": "Object Storage Buckets", "price_inr": 99, "price_usd": 1.20, "unit": "per 50GB/month", "icon": "HardDrive"},
    {"service": "ArvDB (Databases)", "description": "Managed PostgreSQL & Redis", "price_inr": 399, "price_usd": 4.80, "unit": "per instance/month", "icon": "Database"},
    {"service": "CI/CD Pipelines", "description": "Automated Build & Deploy Runners", "price_inr": 199, "price_usd": 2.40, "unit": "per pipeline/month", "icon": "GitBranch"},
    {"service": "ArvWatch Monitoring", "description": "Metrics, Logs & Alerting Stack", "price_inr": 99, "price_usd": 1.20, "unit": "per dashboard/month", "icon": "Activity"},
]

@router.get("/summary")
def get_billing_summary():
    return {
        **_billing_state,
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/breakdown")
def get_cost_breakdown():
    return _service_costs

@router.get("/invoices")
def list_invoices():
    return _invoices

@router.get("/plans")
def get_plans():
    return _plans

@router.get("/service-pricing")
def get_service_pricing():
    return _service_pricing

@router.post("/budget")
def update_budget(b_in: BudgetUpdate):
    _billing_state["monthly_budget_usd"] = b_in.monthly_budget_usd
    return {
        "message": "Monthly budget updated successfully",
        "monthly_budget_usd": _billing_state["monthly_budget_usd"]
    }

@router.post("/create-order")
def create_order(data: OrderRequest):
    """Creates a payment order for Razorpay integration."""
    order_id = f"order_{uuid4().hex[:16]}"
    return {
        "order_id": order_id,
        "amount": data.amount,
        "currency": data.currency,
        "description": data.description,
        "status": "created",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/verify-payment")
def verify_payment(data: PaymentVerification):
    """Verifies payment from Razorpay (test mode - always succeeds)."""
    invoice_id = f"INV-2026-{datetime.now().strftime('%m')}-{uuid4().hex[:4].upper()}"
    amt_inr = data.amount_inr or 1499.0
    amt_usd = round(amt_inr / 83.0, 2)
    
    new_invoice = {
        "invoice_id": invoice_id,
        "period": f"{datetime.now().strftime('%B %Y')}",
        "amount_usd": amt_usd,
        "amount_inr": amt_inr,
        "status": "PAID",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "payment_id": data.razorpay_payment_id,
        "order_id": data.razorpay_order_id,
    }
    _invoices.insert(0, new_invoice)
    
    return {
        "verified": True,
        "payment_id": data.razorpay_payment_id,
        "order_id": data.razorpay_order_id,
        "invoice_id": invoice_id,
        "amount_inr": amt_inr,
        "message": "Payment verified successfully"
    }
