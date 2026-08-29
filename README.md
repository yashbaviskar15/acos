# Aravanta CloudOS (ACOS)

<div align="center">

![Aravanta CloudOS](https://img.shields.io/badge/Aravanta-CloudOS_1.0-0066FF?style=for-the-badge&logo=cloud&logoColor=white)
![React](https://img.shields.io/badge/React_18-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**An Enterprise-Grade, Self-Service Multicloud Operating Platform & Control Plane**

[Live Web Console](https://arv-frontend.vercel.app/) • [Backend API](https://arv-backend.vercel.app/) • [API Interactive Docs (Swagger)](https://arv-backend.vercel.app/docs) • [GitHub Repository](https://github.com/yashbaviskar15/acos)

</div>

---

##  Overview

**Aravanta CloudOS** provides a single unified control plane for cloud resources — one login, one visual dashboard, and one cohesive API surface with granular Role-Based Access Control (RBAC), multi-factor authentication (MFA), live resource telemetry, and automated multicloud orchestration.

###  Live Deployments

| Component | URL | Status |
| :--- | :--- | :--- |
| **Frontend Web Console** | [`https://arv-frontend.vercel.app/`](https://arv-frontend.vercel.app/) |  Operational |
| **Backend REST API** | [`https://arv-backend.vercel.app/`](https://arv-backend.vercel.app/) |  Operational |
| **OpenAPI Docs (Swagger UI)** | [`https://arv-backend.vercel.app/docs`](https://arv-backend.vercel.app/docs) |  Operational |
| **Health Check Endpoint** | [`https://arv-backend.vercel.app/api/v1/health`](https://arv-backend.vercel.app/api/v1/health) |  200 OK |

---

>  **Role Switching**: Users can switch dynamically between **SuperAdmin**, **Developer**, **Admin**, and **Viewer** during sign-in, via the top header badge, or inside `User Profile > IAM Settings`.

---

## ️ Core Microservices Architecture

```
                               ┌─────────────────────────────────────────┐
                               │   Aravanta CloudOS Web Console (React)  │
                               └────────────────────┬────────────────────┘
                                                    │ HTTPS / JWT Bearer
                               ┌────────────────────▼────────────────────┐
                               │      FastAPI Central API Gateway        │
                               └────────────────────┬────────────────────┘
                                                    │
        ┌──────────────┬──────────────┬─────────────┼─────────────┬──────────────┬──────────────┐
        │              │              │             │             │              │              │
 ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐
 │  ArvGate   │ │ ArvCompute │ │  ArvKube   │ │  ArvStore  │ │  ArvDB   │ │   CI/CD    │ │  ArvWatch   │
 │ Identity,  │ │ Elastic VM │ │ Managed    │ │ S3 Object  │ │ Postgres,│ │ Pipelines, │ │ Telemetry,  │
 │ JWT & RBAC │ │ Instances  │ │ Kubernetes │ │  Storage   │ │ MySQL,   │ │ Automated  │ │ Metrics &   │
 │            │ │            │ │  Clusters  │ │  Buckets   │ │ Redis,DB │ │ Builds     │ │ Alerts      │
 └────────────┘ └────────────┘ └────────────┘ └────────────┘ └──────────┘ └────────────┘ └────────────┘
```

| Service | Route Prefix | Capabilities |
| :--- | :--- | :--- |
| **ArvGate** | `/api/v1/auth` | JWT tokens, TOTP Authenticator MFA, password recovery, dynamic RBAC role assignment (`SuperAdmin`, `Admin`, `Developer`, `Viewer`) |
| **ArvCompute** | `/api/v1/compute` | Elastic virtual machines across 4 regions, live lifecycle actions (`start`, `stop`, `reboot`, `terminate`), vCPU & RAM allocation |
| **ArvKube** | `/api/v1/kubernetes` | High-availability Kubernetes clusters, live workload pod telemetry, pod restart tracking, Kubeconfig connection helper, integrated Web Terminal |
| **ArvStore** | `/api/v1/storage` | S3-compatible bucket storage, multipart file uploads, direct file download attachments, file preview modal, S3 URI copying (`s3://...`) |
| **ArvDB** | `/api/v1/databases` | Managed PostgreSQL 16/15, MySQL 8.0, Redis 7.2, MongoDB 7.0, connection limits, latency/IOPS monitoring, SQL/CLI connection strings |
| **CI/CD** | `/api/v1/cicd` | Automated build runners, git push / pull-request triggers, live pipeline execution, build duration and status tracking |
| **ArvWatch** | `/api/v1/monitoring` | 24-hour timeseries telemetry (CPU, memory, network), microservice health matrix, alert acknowledgment & resolution |
| **ArvBilling** | `/api/v1/billing` | Real-time Indian Rupee (INR ₹) / USD cost analytics, budget cap limits, service cost breakdown, and dynamic PDF invoice generation |

---

##  File Storage: How to Access & Retrieve Uploaded Files

When files are uploaded to **ArvStore**, they can be accessed through three methods:

1. **Web Console Direct Download**:
   - In **ArvStore**, click the bucket name to browse objects.
   - Click the ** Download** button on any file row to download it directly to your machine.
   - Click the **️ Preview** button to view file metadata, size, and inline text.
2. **S3 Protocol URI (AWS SDK / CLI)**:
   - Click the ** Copy** button on any file to copy its S3 URI: `s3://[bucket-name]/[folder]/[filename]`.
   - Download via AWS CLI:
     ```bash
     aws s3 cp s3://aravanta-assets-prod/uploads/dataset.csv ./local/
     ```
3. **REST API Endpoint**:
   - Programmatically download files via HTTP:
     ```bash
     curl -O -H "Authorization: Bearer <TOKEN>" https://arv-backend.vercel.app/api/v1/storage/buckets/<BUCKET_ID>/objects/<OBJECT_KEY>/download
     ```

---

##  Local Development Setup

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.11+
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/yashbaviskar15/acos.git
cd acos
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r ../requirements.txt
uvicorn app.main:app --reload --port 8000
```
API will be live at `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

##  Security & Compliance

- **Authentication**: Stateless cryptographic JWT tokens signed with SHA-256 HMAC.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `SuperAdmin`, `Admin`, `Developer`, and `Viewer`.
- **Two-Factor Authentication (MFA)**: TOTP time-based one-time password standard compatible with Google Authenticator and Authy.
- **Transport Security**: TLS 1.3 encryption across all public and internal microservice communications.

---

##  License & Attribution

Copyright © 2026 **Aravanta CloudOS**. Developed by [Yash Baviskar](https://github.com/yashbaviskar15). All rights reserved.
 
