"""
Aravanta Cloud OS — Pricing Engine
Defines versioned pricing rates and calculates consumption charges.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.billing.models import PriceRate

DEFAULT_PRICING: Dict[str, Dict[str, Any]] = {
    "compute.instance.hours": {
        "unit_price": 1.50,
        "currency": "INR",
        "unit": "hours",
        "description": "Compute Virtual Machine Runtime (per vCPU hour)",
    },
    "storage.gb.hours": {
        "unit_price": 0.0014,
        "currency": "INR",
        "unit": "gb-hours",
        "description": "NVMe Block & Object Storage (~₹1.00/GB-month)",
    },
    "database.instance.hours": {
        "unit_price": 3.00,
        "currency": "INR",
        "unit": "hours",
        "description": "Managed Database Instance Runtime",
    },
    "kubernetes.cluster.hours": {
        "unit_price": 4.00,
        "currency": "INR",
        "unit": "cluster-hours",
        "description": "Managed Kubernetes Control Plane & Node Pool Runtime",
    },
    "cicd.build.minutes": {
        "unit_price": 0.25,
        "currency": "INR",
        "unit": "minutes",
        "description": "CI/CD Pipeline Build Execution",
    },
    "container.instance.hours": {
        "unit_price": 1.00,
        "currency": "INR",
        "unit": "hours",
        "description": "Serverless Container / Deployment Runtime",
    },
    "network.bandwidth.gb": {
        "unit_price": 0.50,
        "currency": "INR",
        "unit": "gb",
        "description": "Egress Network Bandwidth",
    },
}


class PricingEngine:
    @staticmethod
    def get_rate(meter_name: str, db: Optional[Session] = None) -> float:
        """Retrieves active unit price for a meter."""
        if db:
            active_rate = db.query(PriceRate).filter(
                PriceRate.meter_name == meter_name
            ).order_by(PriceRate.effective_from.desc()).first()
            if active_rate:
                return active_rate.unit_price

        default_info = DEFAULT_PRICING.get(meter_name)
        if default_info:
            return default_info["unit_price"]
        return 1.00  # Default fallback rate

    @staticmethod
    def calculate_cost(meter_name: str, quantity: float, db: Optional[Session] = None) -> float:
        """Calculates total charge = quantity * unit_price with minimum 1 paise floor."""
        rate = PricingEngine.get_rate(meter_name, db)
        raw = quantity * rate
        if quantity > 0 and raw > 0:
            return max(0.01, round(raw, 2))
        return 0.0

    @staticmethod
    def get_all_rates(db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Returns all available price rates."""
        rates = []
        for meter_name, info in DEFAULT_PRICING.items():
            unit_price = PricingEngine.get_rate(meter_name, db)
            rates.append({
                "meter_name": meter_name,
                "unit_price": unit_price,
                "currency": info["currency"],
                "unit": info["unit"],
                "description": info["description"]
            })
        return rates
