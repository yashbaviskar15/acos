# Deploying Aravanta CloudOS on a VPS (Docker Compose)

This runs the **entire** stack on one server, using your existing
`docker/docker-compose.yml` unchanged: PostgreSQL, Redis, the 10 FastAPI services
(arvgate + 9 others), the React frontend, the nginx gateway, and the full
observability suite (Prometheus, Grafana, Loki, Alertmanager, Jaeger, OpenTelemetry
Collector).

Everything is reached through **one** public entry point — the nginx **gateway**.
The gateway serves the frontend at `/` and proxies `/api/v1/*` to the right backend
service. No other container needs to be exposed to the internet.

> This stack is **not** for Vercel. Vercel only runs your `frontend/` and `backend/`
> folders (two projects). `docker/`, `docs/`, `monitoring/`, and `nginx/` are not
> standalone web apps — do not create Vercel projects for them.

---

## 1. What you need

- **A VPS with Docker.** The stack runs ~18 containers.
  - Minimum: **2 vCPU / 4 GB RAM** (works; tight once monitoring is running).
  - Comfortable: **4 vCPU / 8 GB RAM**.
  - Good providers: **Hetzner** (CX32, ~€8/mo — best value), DigitalOcean ($24–48/mo),
    Linode, Vultr, or AWS Lightsail.
- **A domain name** (only if you want HTTPS, which you should for a login app).

---

## 2. Create the server

Create an **Ubuntu 24.04 LTS** server and note its **public IP**.

---

## 3. Lock down the network (do this first)

The base compose file publishes many host ports (5432, 6379, 8001–8010, 9090, 3001,
3100, 9093, 16686, 4317, 4318). On a public server these must **not** be reachable
from the internet — only **22** (SSH), **80**, and **443**.

> ⚠️ Docker writes its own iptables rules and **bypasses `ufw`**. Publishing a port
> punches straight through ufw. So use your provider's **cloud firewall** (it filters
> at the network edge, which Docker cannot bypass):
>
> - **Hetzner:** Cloud Console → Firewalls → allow inbound TCP **22, 80, 443**, deny the rest.
> - **DigitalOcean:** Networking → Firewalls → same three ports.
> - **AWS Lightsail/EC2:** the instance's Security Group → inbound **22, 80, 443** only.

Attach the firewall to the server **before** bringing the stack up.

---

## 4. Install Docker

SSH into the server, then:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in (or run: newgrp docker) so the group change applies
```

Verify:

```bash
docker --version
docker compose version
```

---

## 5. Get the code

```bash
git clone https://github.com/yashbaviskar15/acos.git
cd acos
```

A fresh clone has **no** `node_modules` (it is git-ignored), so the frontend image
builds cleanly inside Docker.

---

## 6. Configure secrets

```bash
cd docker
cp .env.example .env
nano .env          # fill in strong values
```

Generate strong values on the server with:

```bash
openssl rand -hex 32     # for ARVGATE_JWT_SECRET_KEY
openssl rand -hex 24     # for POSTGRES_PASSWORD / Grafana password
```

---

## 7. First run — quick smoke test (HTTP, no domain)

From the `docker/` folder:

```bash
mkdir -p ../monitoring/grafana/dashboards   # avoids an empty bind-mount warning
docker compose up -d --build
```

The **first build is slow** (it builds 11 images — 10 Python services + the frontend).
Watch progress and health:

```bash
docker compose ps          # wait until postgres and redis show "healthy"
docker compose logs -f arvgate
```

Because port 8080 is blocked by your cloud firewall, test it over an **SSH tunnel**
from your laptop:

```bash
ssh -L 8080:localhost:8080 user@YOUR_SERVER_IP
# then open http://localhost:8080  → the app should load; register/login should work
```

---

## 8. Production run — domain + automatic HTTPS

1. Create a DNS **A record**: `cloudos.yourdomain.com → YOUR_SERVER_IP`. Wait until
   `ping cloudos.yourdomain.com` resolves to your IP.
2. Set `DOMAIN=cloudos.yourdomain.com` in `docker/.env`.
3. Bring the stack up **with the production override** (adds Caddy and wires secrets):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy automatically obtains a Let's Encrypt certificate on first request. Then open:

```
https://cloudos.yourdomain.com
```

> Always use the **same two `-f` flags** for every command from now on (up, logs, down),
> so Compose keeps both files in view.

---

## 9. Verify it works

- `https://cloudos.yourdomain.com/` → the app loads.
- Register a user, then log in → succeeds (arvgate is persisting to Postgres).
- On the server, health checks:

```bash
curl http://localhost:8001/health/ready     # arvgate
docker compose ps                            # every service shows "Up"
```

---

## 10. Day-to-day operations

```bash
# View logs
docker compose logs -f                 # everything
docker compose logs -f arvgate         # one service

# Restart / stop
docker compose restart arvgate
docker compose down                    # stop all (keeps the database volume)
docker compose down -v                 # stop all AND delete data volumes (destructive)

# Update after pulling new code
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 11. Back up the database

```bash
docker compose exec postgres pg_dump -U aravanta aravanta_identity > backup_$(date +%F).sql
```

---

## 12. Reach the monitoring tools (kept private)

Grafana, Prometheus, Jaeger, etc. are intentionally **not** exposed to the internet.
View them through an SSH tunnel:

```bash
ssh -L 3001:localhost:3001 user@YOUR_SERVER_IP    # Grafana → http://localhost:3001
ssh -L 9090:localhost:9090 user@YOUR_SERVER_IP    # Prometheus
ssh -L 16686:localhost:16686 user@YOUR_SERVER_IP  # Jaeger
```

Grafana login is the `GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD` from `.env`.

---

## 13. Troubleshooting

- **Frontend image fails at `tsc`/`vite build`:** make sure `frontend/.dockerignore`
  exists (it's in the repo) so a stray host `node_modules` can't leak into the build.
  A clean `git clone` won't have one, so this is normally a non-issue.
- **arvgate can't reach Postgres / login fails:** confirm `POSTGRES_PASSWORD` is set in
  `docker/.env`; the prod override builds arvgate's DB URL from it, so both must match.
  Check `docker compose logs postgres arvgate`.
- **Caddy won't get a certificate:** the DNS A record must already resolve to the server,
  and cloud-firewall ports **80 and 443** must be open. Check `docker compose logs caddy`.
- **Out of memory / builds killed:** use an 8 GB server, or bring up fewer services
  (e.g. omit the monitoring services) if you only need the app.

---

## 14. Architecture recap

```
                          Internet
                             │  (443, 80)
                        ┌────▼────┐
                        │  Caddy  │  automatic HTTPS
                        └────┬────┘
                             │ 80
                        ┌────▼─────┐
                        │ gateway  │  nginx
                        │ (nginx)  │
              ┌─────────┼──────────┴───────────────┐
              │ /                                   │ /api/v1/*
        ┌─────▼─────┐                    ┌──────────▼──────────┐
        │ frontend  │                    │ arvgate + 9 services│
        │ (React)   │                    └──────────┬──────────┘
        └───────────┘                          ┌────┴────┐
                                            Postgres    Redis
```

All 10 backend services share one JWT secret (`ARVGATE_JWT_SECRET_KEY`): arvgate
issues tokens, the others verify them.
