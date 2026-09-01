# Architecture Overview

## System Architecture

Aravanta CloudOS follows a standard three-tier web architecture deployed as a serverless application on Vercel.

```mermaid
graph TB
    subgraph Client Layer
        Browser["Browser (Chrome/Firefox/Safari)"]
    end

    subgraph Edge Layer
        CDN["Vercel CDN + Edge Network"]
    end

    subgraph Frontend
        SPA["React 18 SPA"]
        Vite["Vite Build System"]
        TW["TailwindCSS"]
        TS["TypeScript"]
        RC["Recharts (Data Viz)"]
    end

    subgraph Backend
        API["FastAPI (Python 3.11)"]
        Auth["ArvAuth (JWT + MFA)"]
        Watch["ArvWatch (Monitoring)"]
        Ops["ArvOperations (Infra/Deploy/Incidents)"]
        Compute["ArvCompute (VMs)"]
        Kube["ArvKube (Kubernetes)"]
        Store["ArvStore (Object Storage)"]
        DB_SVC["ArvDB (Databases)"]
    end

    subgraph Data Layer
        MongoDB["MongoDB Atlas"]
        Supabase["Supabase Storage"]
        SMTP["SMTP Relay"]
    end

    Browser --> CDN --> SPA
    SPA --> API
    API --> Auth
    API --> Watch
    API --> Ops
    API --> Compute
    API --> Kube
    API --> Store
    API --> DB_SVC
    Auth --> MongoDB
    Auth --> SMTP
    Store --> Supabase
    Ops --> MongoDB
```

## Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend SPA | React 18 + TypeScript + Vite + TailwindCSS | Interactive cloud operations console |
| Backend API | FastAPI + Pydantic + Motor | RESTful API with auto-generated OpenAPI docs |
| Database | MongoDB Atlas | User accounts, audit logs, platform state |
| Object Storage | Supabase Storage | File uploads (S3-compatible) |
| Authentication | JWT (HS256) + bcrypt + TOTP | Stateless auth with multi-factor support |
| Deployment | Vercel (Serverless) | Zero-config CI/CD from Git |

## API Layer Architecture

The backend is organized by service domain, each with its own FastAPI router:

| Router Prefix | Module | Responsibility |
|--------------|--------|---------------|
| /api/v1/auth | arvauth | Registration, login, JWT, MFA, audit logs |
| /api/v1/monitoring | arvwatch | Metrics, time-series, alerts, health checks |
| /api/v1/operations | arvoperations | Infrastructure, deployments, containers, incidents, automation, backups |
| /api/v1/compute | arvcompute | Virtual machine lifecycle |
| /api/v1/kubernetes | arvkube | Kubernetes cluster management |
| /api/v1/storage | arvstore | Object storage bucket operations |
| /api/v1/databases | arvdb | Managed database engines |

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant MongoDB

    User->>Frontend: Enter email + password
    Frontend->>API: POST /api/v1/auth/login
    API->>MongoDB: Query user by email
    MongoDB-->>API: Return user document
    API->>API: Verify bcrypt hash
    API->>API: Check MFA status
    alt MFA Enabled
        API-->>Frontend: Return mfa_required=true
        User->>Frontend: Enter TOTP code
        Frontend->>API: POST /api/v1/auth/verify-mfa
        API->>API: Validate TOTP (RFC 6238)
    end
    API->>API: Generate JWT (HS256)
    API-->>Frontend: Return token + user data
    Frontend->>Frontend: Store token in localStorage
    Note over Frontend,API: All subsequent requests include Authorization: Bearer token
```
