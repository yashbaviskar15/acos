# Backend

Aravanta CloudOS backend services live here. Each `arv*` folder is an independently runnable FastAPI microservice, while `shared/` contains common auth, observability, and service bootstrap utilities.

MVP focus:
- `arvgate/` is the primary identity service with JWT auth, TOTP MFA, RBAC, refresh tokens, and audit logging.
- `arvcompute/` and `arvkube/` expose the first scaffolded resource APIs.
- Remaining services are stubbed with health checks, metrics, JWT validation, and OpenAPI docs so the platform can grow service-by-service.
