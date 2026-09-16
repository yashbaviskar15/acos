# Kubernetes — Reference Architecture

> **REFERENCE ARCHITECTURE NOTICE:**
> The live Aravanta Cloud OS control plane currently runs serverless on Vercel with managed PostgreSQL. The Helm charts and manifests in this directory represent a **target / reference architecture** for deploying the complete containerized stack on managed Kubernetes (EKS / GKE / AKS). They are not active in the current serverless production deployment.

This folder contains Kubernetes deployment assets for Aravanta CloudOS. The starter Helm chart under `charts/aravanta-cloudos/` provides a reusable skeleton for shipping the gateway, frontend, and microservices into a cluster.
