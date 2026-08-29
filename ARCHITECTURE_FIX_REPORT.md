# ACOS / Aravanta CloudOS — Production Architecture Fix Report

_Browser → `arv-frontend.vercel.app/api/v1/*` → Vercel rewrite → `arv-backend.vercel.app/api/v1/*` → FastAPI. The browser no longer calls the backend domain directly._

---

## 1. Files changed

### Frontend
| File | Change |
|------|--------|
| `frontend/vercel.json` | Collapsed to **one** valid JSON object. First rewrite proxies `/api/:path*` → backend; second is the SPA fallback. |
| `frontend/vercel.json` (root `vercel.json`) | Same proxy + SPA fallback, kept consistent for whichever Root Directory Vercel uses. |
| `frontend/src/config/api.ts` | Canonical `apiFetch` client. `API_BASE_URL = "/api"`, token key `aravanta_token`, throws real backend errors. |
| `frontend/src/lib/api.ts` | Reduced to a re-export shim of `config/api.ts` (removes the second, divergent client). |
| `frontend/src/pages/Login.tsx` | Login / register / MFA-verify via `apiFetch`; surfaces backend `detail`; MFA flow preserved. |
| `frontend/src/pages/Dashboard.tsx` | 6 metrics/compute/billing calls + VM deploy via `apiFetch` with `Bearer` token; graceful nulls. |
| `frontend/src/pages/Profile.tsx` | `auth/me`, `role/update`, `mfa/setup`, `mfa/enable`, `mfa/disable`, `password-reset/confirm` via `apiFetch`. |
| `frontend/src/pages/Security.tsx`, `Monitoring.tsx`, `Compute.tsx`, `Database.tsx`, `Kubernetes.tsx`, `Storage.tsx`, `Billing.tsx`, `CICD.tsx` | All API calls routed through `apiFetch`; manual `authHeaders` removed. |
| `frontend/src/components/Header.tsx` | Notifications/alerts fetch via `apiFetch`. |

### Backend
| File | Change |
|------|--------|
| `backend/app/main.py` | `create_all` wrapped in a guarded try/except (never crashes the app at import); CORS switched from `["*"]` to an explicit origin list. |
| `backend/app/core/database.py` | Serverless-safe DB URL resolution — SQLite relocated to `/tmp` on Vercel so `create_all` can succeed. |
| `backend/app/core/config.py` | Added `BACKEND_CORS_ORIGINS` setting + `cors_origins_list` property. |
| `backend/requirements.txt` | Added `psycopg2-binary` (sync Postgres driver required by the sync SQLAlchemy engine). |
| `backend/vercel.json` | **New file** — catch-all rewrite routing every path to the `api/index.py` ASGI function. |

_Auth, MFA, models, schemas, and the security module were left functionally intact. No fake auth, no disabled MFA._

---

## 2. Exact cause of the CORS error

**Symptom, not the root cause.** `backend/app/main.py` executed `Base.metadata.create_all(bind=engine)` at **import time**. On Vercel's read-only serverless filesystem, opening/creating the default SQLite file `./aravanta_dev.db` fails, so the exception was raised while the module was still loading. The ASGI `app` therefore never finished initializing, which means **`CORSMiddleware` was never applied** — no response (not even the 500) carried an `Access-Control-Allow-Origin` header, and the browser reported a CORS failure.

Secondary issue: the configuration `allow_origins=["*"]` **with** `allow_credentials=True` is an invalid combination that browsers reject even when the app is healthy.

**Fix:** the app now always initializes (guarded `create_all`), and CORS uses an explicit origin list (`https://arv-frontend.vercel.app` + localhost) that is valid alongside credentials.

---

## 3. Exact cause of the 500 error

Same root cause: **`Base.metadata.create_all(bind=engine)` at import** against a SQLite path that cannot be opened on a read-only filesystem → unhandled exception → Vercel returns `500 FUNCTION_INVOCATION_FAILED` for **every** request, including `/api/v1/auth/login`.

**Fix (two layers):**
1. `database.py` now detects serverless (`VERCEL` / `AWS_LAMBDA_FUNCTION_NAME`) and rewrites a SQLite URL to `sqlite:////tmp/aravanta_dev.db` (the only writable location), so `create_all` succeeds.
2. `main.py` wraps `create_all` in try/except and logs a **clear configuration error** instead of crashing — so even a genuine DB misconfiguration produces a legible message and keeps CORS working, rather than an unexplained 500.

Note: `/tmp` SQLite is **ephemeral** per cold start. For durable data set `DATABASE_URL` to managed Postgres (see §6). `psycopg2-binary` was added so the sync engine can actually connect to `postgresql://` (the repo previously shipped only `asyncpg`, which the sync engine cannot use).

---

## 4. Exact cause of the 405 registration error

The failing request was `POST https://arv-frontend.vercel.app/api/v1/auth/register` — it hit the **frontend** deployment, not the backend. `frontend/vercel.json` was invalid (two root JSON objects) so its `/api` proxy rewrite was not reliably applied; the SPA catch-all rewrite `"/(.*)" → "/index.html"` then captured the POST and served the static `index.html`. A static asset only answers GET, so Vercel returned **405 Method Not Allowed**.

**Fix:** `frontend/vercel.json` is now a single valid JSON object whose **first** rewrite is `"/api/:path*" → "https://arv-backend.vercel.app/api/:path*"`, evaluated before the SPA fallback. The backend route itself was already correct: `POST /api/v1/auth/register` (201) in `arvgate/router.py`, schema `UserRegister{email, password, full_name, role="Developer"}` — matching the frontend payload. No new route was invented.

---

## 5. Frontend API architecture now in use

- **One client:** `frontend/src/config/api.ts` exporting `apiFetch(path, options)` and `API_BASE_URL = "/api"`. `lib/api.ts` re-exports it.
- **Call style:** components call `apiFetch("/v1/…")`; the helper normalizes to `/api/v1/…` (same-origin). Example: `apiFetch("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })` → `POST /api/v1/auth/login`.
- **Proxy:** Vercel rewrite sends `/api/*` to `https://arv-backend.vercel.app/api/*`. The browser never addresses the backend domain.
- **Auth:** injects `Authorization: Bearer <token>` from `options.token` or `localStorage['aravanta_token']`; never emits `Bearer undefined` / `Bearer null`.
- **Headers/body:** sets `Content-Type: application/json` only when a non-`FormData` body is present and not already set (FormData uploads keep the browser boundary).
- **Errors:** returns parsed JSON on 2xx; on non-2xx **throws** an `Error` whose message is the backend `detail`/`message`/`error` (falls back to status text / raw text). `error.status` and `error.payload` are attached. Errors are not swallowed.

---

## 6. Backend environment variables required

| Variable | Required? | Notes |
|----------|-----------|-------|
| `DATABASE_URL` | **Yes for production** | Default is ephemeral SQLite (now `/tmp` on serverless, wiped per cold start). Set to managed Postgres, e.g. `postgresql://user:pass@host:5432/dbname`. `psycopg2-binary` is now bundled to support it. |
| `SECRET_KEY` | **Yes for production** | JWT (HS256) signing key. Ships with an insecure dev default — override it. |
| `BACKEND_CORS_ORIGINS` | Optional | Comma-separated allowed origins. Defaults to `https://arv-frontend.vercel.app` + localhost. |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `ALGORITHM` | Optional | Sensible defaults present. |
| `REDIS_URL` | Optional | Only if Redis-backed features are enabled. |
| `VERCEL` | Auto | Set by Vercel; used to trigger the `/tmp` SQLite fallback. |

All names match what already exists in the project — none were invented except the standard `BACKEND_CORS_ORIGINS`, which had no prior equivalent.

---

## 7. Commands to validate the project

```bash
# Frontend build + type-check
cd frontend
npm install
npm run build

# JSON validity of all three configs
python3 -c "import json; json.load(open('frontend/vercel.json'))"
python3 -c "import json; json.load(open('vercel.json'))"
python3 -c "import json; json.load(open('backend/vercel.json'))"

# Confirm no backend domain leaks / no stray clients in frontend source
grep -rn "arv-backend.vercel.app" frontend/src   # expect: no matches
grep -rn "fetch(" frontend/src                     # expect: only config/api.ts
grep -rn "axios\|XMLHttpRequest" frontend/src      # expect: no matches
```

---

## 8. Does `npm run build` succeed?

**Not verified by execution.** The sandboxed Linux workspace in this session could not start (`VM_DISK_SPACE_INSUFFICIENT`), so `npm install` / `npm run build` / `tsc` could not be run. I am **not** claiming the build passes.

What I verified **statically** instead (relevant because `tsconfig` uses `noUnusedLocals` + `noUnusedParameters`, which fail the build on dead code):
- Every refactored file imports and uses `apiFetch`; no leftover `fetch(`, `authHeaders`, or `safeParseJson`.
- No unused locals/imports introduced by the refactors; all `try/catch` blocks balanced.
- `apiFetch<T>` is generically typed and call sites read the returned value or `.catch(() => null)` as appropriate.

**Action for you:** run `cd frontend && npm install && npm run build` locally to confirm a clean compile before deploying.

---

## 9. Any `arv-backend.vercel.app` references left in frontend source?

**None in `frontend/src`** (verified by grep). The domain appears only where it must — as the `destination` of the `/api` proxy rewrite in `frontend/vercel.json` and the root `vercel.json`. That is correct and required.

Other absolute URLs remaining in `frontend/src` are all legitimate, non-API resources and were intentionally left alone: Google Fonts (`index.css`), the Razorpay checkout SDK (`Billing.tsx`), the QR-code image generator (`Profile.tsx`), Unsplash avatars (`Testimonials.tsx`), marketing display strings (`ServicesTabs.tsx`), and `curl` documentation examples (`GettingStarted.tsx`).

---

## 10. Remaining items that require Vercel Dashboard settings

1. **Backend env vars** — set `DATABASE_URL` (managed Postgres) and a strong `SECRET_KEY` on the backend project. Without a persistent DB, register→login only works within a single warm invocation.
2. **Backend Root Directory** — confirm it is `backend`, so the new `backend/vercel.json` and `api/index.py` are detected. The catch-all rewrite targets `/api/index`, which assumes this.
3. **Frontend Root Directory** — ensure exactly one of `frontend/vercel.json` (Root = `frontend`) or the root `vercel.json` (Root = repo root) is authoritative. Both are configured identically to avoid divergence.
4. **Redeploy** both projects after setting env vars.

---

### One intentional behavior change to flag
`Profile.tsx` password-reset previously showed **"success" even on a network failure** (an error-hiding fallback). Per STEP 14 ("Do not hide errors"), it now surfaces the real error message. The happy-path success message is unchanged.
