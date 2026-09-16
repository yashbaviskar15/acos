# Aravanta CloudOS — Terraform Infrastructure as Code (IaC)

> **REFERENCE ARCHITECTURE NOTICE:**
> The live Aravanta Cloud OS control plane currently runs serverless on Vercel with managed PostgreSQL. The Terraform modules in this directory represent a **target / reference architecture** for dedicated or self-hosted multi-region cloud deployments on AWS. They are not active in the current serverless production deployment.

Declarative infrastructure templates for provisioning multi-region cloud resources across AWS (or generic cloud SDKs).

## Module Architecture

- `modules/networking/` — VPC, subnets, route tables, Internet & NAT Gateways
- `modules/compute/` — Auto Scaling Groups, Launch Templates, Security Groups
- `modules/kubernetes/` — Managed EKS Cluster & worker node pools
- `modules/database/` — Managed PostgreSQL RDS instance with subnet groups

## Usage (Reference Target)

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan -var="environment=production"

# Apply infrastructure changes
terraform apply -var="environment=production" -auto-approve
```

