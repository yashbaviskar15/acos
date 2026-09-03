# Troubleshooting Guide

A comprehensive troubleshooting reference for engineers operating and debugging the Aravanta CloudOS platform.

---

## 1. Common Operational Issues

### 1.1 CORS (Cross-Origin Resource Sharing) Failures

**Symptoms:**
- Browser console reports: `Access to fetch at 'https://arv-backend.vercel.app/...' from origin 'https://aravantacos.vercel.app' has been blocked by CORS policy`.
- API calls return status `(failed) net::ERR_FAILED`.

**Root Cause:**
FastAPI CORSMiddleware does not include the requesting origin or credentials mode mismatch.

**Resolution:**
1. Check `backend/app/main.py` CORSMiddleware configuration:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://aravantacos.vercel.app", "https://arv-frontend.vercel.app", "http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
2. Verify that the client sends `credentials: 'include'` if cookies are utilized.

---

### 1.2 MongoDB Atlas Connection Timeout

**Symptoms:**
- Backend returns HTTP 500 on login/register endpoints with `ServerSelectionTimeoutError`.
- Backend logs show `connection closed` or `SSL handshake failed`.

**Root Cause:**
IP access list on MongoDB Atlas cluster does not allow Vercel serverless IP ranges.

**Resolution:**
1. Log in to MongoDB Atlas Console.
2. Navigate to **Network Access** > **IP Access List**.
3. Ensure `0.0.0.0/0` (Allow Access from Anywhere) is active.
4. Verify `MONGODB_URL` connection string includes `retryWrites=true&w=majority`.

---

### 1.3 JWT Token Expiration and Session Drift

**Symptoms:**
- API requests suddenly return HTTP 401 Unauthorized (`Could not validate credentials`).
- User is automatically redirected or receives permission errors.

**Root Cause:**
JWT tokens have a 24-hour expiration window.

**Resolution:**
1. Clear invalid tokens from localStorage:
   ```javascript
   localStorage.removeItem('aravanta_token');
   localStorage.removeItem('aravanta_user');
   ```
2. Re-authenticate via the Sign In portal.
3. For automated workloads, utilize IAM API service tokens instead of user sessions.

---

### 1.4 Email Verification Code Not Received

**Symptoms:**
- Registration succeeds but verification code email does not arrive in user inbox.

**Root Cause:**
SMTP relay authentication failed, or Gmail App Password was revoked or blocked.

**Resolution:**
1. Ensure `SMTP_EMAIL` and `SMTP_PASSWORD` environment variables are populated.
2. Verify Gmail 2-Step Verification is active and the password is an **App Password**, not your primary Google account password.
3. Check backend logs via Log Explorer for SMTP transport errors.

---

## 2. Health & Diagnostic Endpoints

Verify operational status of backend services using synthetic HTTP health probes:

| Target Endpoint | Expected Status | Purpose |
|-----------------|-----------------|---------|
| `GET /api/v1/health` | 200 OK | FastAPI root health check probe |
| `GET /api/v1/monitoring/health` | 200 OK | Microservices dependency matrix check |
| `GET /api/v1/monitoring/metrics` | 200 OK | Live SRE telemetry gauge snapshot |
| `GET /metrics` | 200 OK | Prometheus metric scrape target |
| `GET /docs` | 200 OK | Interactive OpenAPI Swagger UI |

---

## 3. Log Inspection Procedures

To isolate runtime faults:
1. Open the **Log Explorer** (`/logs`) from the navigation sidebar.
2. Set the severity filter to `ERROR` or `WARN`.
3. Filter by the affected microservice (e.g., `api-gateway`, `auth-service`, `telemetry-engine`).
4. Copy relevant error traces or export JSON logs for post-mortem analysis.
