# Aravanta Cloud OS CLI (`aravanta`)

The official command-line interface for **Aravanta Cloud OS**.

Operates directly against the Aravanta Control Plane REST API (`https://arv-backend.vercel.app`). Designed for DevOps engineers, platform teams, and automated CI/CD pipelines.

> **Zero Repository Dependency**: End users do NOT need to clone this repository, run `cd acos`, or install Node/Python workspace packages. The `aravanta` binary runs globally from any directory on Windows, macOS, and Linux.

---

## 1. Quick Installation (End Users)

### Windows (PowerShell)
```powershell
irm https://aravantacos.vercel.app/install.ps1 | iex
```

### macOS & Linux (Terminal)
```bash
curl -fsSL https://aravantacos.vercel.app/install.sh | bash
```

### Python / Pip
```bash
pip install "git+https://github.com/yashbaviskar15/acos.git#subdirectory=cli"
```

---

## 2. Verify Installation (Any Directory)

You can run `aravanta` anywhere (e.g. `C:\Users\Username`, `/home/user`, `/tmp`):

```bash
aravanta --version
# Output: aravanta-cli 1.0.0

aravanta status
# Output:
# +─────────────────────────────────────────────────────────────+
# |               ARAVANTA CLOUD OS — SYSTEM STATUS             |
# +─────────────────────────────────────────────────────────────+
#   Control Plane:   HEALTHY
#   Active Backend:  https://arv-backend.vercel.app
#   Primary Region:  arv-us-east-1 (N. Virginia Edge)
```

---

## 3. Authentication & Sessions

```bash
# Interactive login with email and password
aravanta auth login --email admin@aravanta.com

# Or quick token authentication from web console
aravanta auth token <PASTE_JWT_TOKEN>

# Verify active session identity & tenant
aravanta whoami

# Logout
aravanta auth logout
```

Configuration and credentials are automatically stored in standard user directory:
- Windows: `%USERPROFILE%\.aravanta\config.json`
- macOS / Linux: `~/.aravanta/config.json`

---

## 4. Core Cloud Operations

### Virtual Machines & Compute
```bash
# List all running compute instances
aravanta compute list

# Launch a new virtual machine instance
aravanta compute create --name api-worker-01 --cpu 2 --ram 4096

# Stop an instance
aravanta compute stop <instance-id>

# Start a stopped instance
aravanta compute start <instance-id>

# Reboot an instance
aravanta compute restart <instance-id>
```

### Organizations & Projects
```bash
# List cloud organizations
aravanta org list

# List cloud projects
aravanta project list

# Create a new project
aravanta project create --name staging-environment
```

### Automation & CI/CD Non-Interactive Mode
```bash
export ARAVANTA_TOKEN="your-api-token"
export ARAVANTA_API_URL="https://arv-backend.vercel.app"

# Output structured JSON for jq / pipelines
aravanta compute list --output json
aravanta project list --output json
```

---

## 5. Development & Contributing (Source Repo Only)

If you are a contributor working directly inside the private `acos` developer source repository:

```bash
cd acos
pip install -e cli
```

This installs the package in editable development mode so your local modifications to `cli/aravanta.py` are immediately reflected when running `aravanta`.
