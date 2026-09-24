#!/usr/bin/env python3
"""
Aravanta Cloud OS CLI (`aravanta`)
First-class, API-first command-line interface for managing Aravanta Cloud infrastructure.
Communicates strictly via REST API; never connects to the database directly.
Supports Windows (CMD, PowerShell), macOS, and Linux out of the box.
"""
import sys
import os
import time
import json
import argparse
import urllib.request
import urllib.error
import re
from pathlib import Path
from typing import Dict, Any, Optional, List

VERSION = "2.0.0"
CONFIG_DIR = Path.home() / ".aravanta"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_API_URL = "https://arv-backend.vercel.app"

# ─── Color & Formatting Helpers ──────────────────────────────────────────────

def _supports_color():
    if os.environ.get('NO_COLOR'): return False
    if sys.platform == 'win32':
        os.system('')  # Enable ANSI on Windows
        return True
    return hasattr(sys.stdout, 'isatty') and sys.stdout.isatty()

_USE_COLOR = _supports_color()

def _c(text, code):
    return f'\033[{code}m{text}\033[0m' if _USE_COLOR else str(text)

def green(t): return _c(t, '32')
def red(t): return _c(t, '31')
def yellow(t): return _c(t, '33')
def cyan(t): return _c(t, '36')
def bold(t): return _c(t, '1')
def dim(t): return _c(t, '2')

def strip_ansi(s):
    return re.sub(r'\033\[[0-9;]*m', '', str(s))

def colorize_status(status):
    s = str(status).upper()
    if s in ("RUNNING", "ACTIVE", "HEALTHY", "SUCCESS", "BILLED"):
        return green(status)
    elif s in ("STOPPED", "DISABLED", "ERROR", "FAILED"):
        return red(status)
    elif s in ("PENDING", "DEPLOYING", "SCALING", "OPEN"):
        return yellow(status)
    return str(status)

def print_table(headers, rows):
    if not rows:
        print('No records found.')
        return
    col_widths = [max(len(str(h)), max((len(strip_ansi(str(r[i]))) for r in rows), default=0)) for i, h in enumerate(headers)]
    
    header_str = '  '.join(f'{str(h):<{col_widths[i]}}' for i, h in enumerate(headers))
    print(header_str)
    print('-' * len(strip_ansi(header_str)))
    
    for row in rows:
        formatted_row = []
        for i in range(len(headers)):
            val = str(row[i])
            visible_len = len(strip_ansi(val))
            padding = " " * (col_widths[i] - visible_len)
            formatted_row.append(val + padding)
        print('  '.join(formatted_row))

# ─── Config & API ────────────────────────────────────────────────────────────

def load_config() -> Dict[str, Any]:
    default_url = os.environ.get("ARAVANTA_API_URL", DEFAULT_API_URL)
    cfg: Dict[str, Any] = {
        "api_url": default_url,
        "token": None,
        "active_org_id": None,
        "active_project_id": None,
        "user_email": None
    }
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if isinstance(saved, dict):
                    cfg.update(saved)
                if not cfg.get("api_url") or "localhost" in cfg.get("api_url", ""):
                    cfg["api_url"] = default_url
        except Exception:
            pass

    # Environment variables take precedence over config file
    if os.environ.get("ARAVANTA_TOKEN"):
        cfg["token"] = os.environ["ARAVANTA_TOKEN"]
    if os.environ.get("ARAVANTA_ORG_ID"):
        cfg["active_org_id"] = os.environ["ARAVANTA_ORG_ID"]
    if os.environ.get("ARAVANTA_PROJECT_ID"):
        cfg["active_project_id"] = os.environ["ARAVANTA_PROJECT_ID"]
    return cfg


def save_config(cfg: Dict[str, Any]) -> None:
    try:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print(red(f"Warning: Could not persist config to {CONFIG_FILE}: {e}"), file=sys.stderr)


def api_request(
    method: str,
    path: str,
    body: Optional[Dict[str, Any]] = None,
    api_url: Optional[str] = None,
    token: Optional[str] = None
) -> Any:
    cfg = load_config()
    base_url = (api_url or cfg.get("api_url") or DEFAULT_API_URL).rstrip("/")
    auth_token = token or cfg.get("token")

    url = f"{base_url}{path}"
    headers = {
        "Accept": "application/json",
        "User-Agent": f"aravanta-cli/{VERSION}"
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    if cfg.get("active_org_id"):
        headers["x-organization-id"] = cfg["active_org_id"]
    if cfg.get("active_project_id"):
        headers["x-project-id"] = cfg["active_project_id"]

    data_bytes = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode("utf-8")
                if not content:
                    return {}
                return json.loads(content)
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8")
            try:
                parsed = json.loads(err_body)
                detail = parsed.get("detail") or parsed.get("message") or err_body
            except Exception:
                detail = err_body
            print(red(f"Error ({err.code}): {detail}"), file=sys.stderr)
            if err.code == 401:
                print(yellow("Tip: Run 'aravanta auth login' or 'aravanta auth token <jwt>' to authenticate."), file=sys.stderr)
            sys.exit(1)
        except urllib.error.URLError as err:
            if attempt < max_attempts - 1:
                time.sleep(1.0)
                continue
            print(red(f"Connection Error: Unable to reach Aravanta API at {base_url}."), file=sys.stderr)
            print(f"Details: {err.reason}", file=sys.stderr)
            print("\nTroubleshooting Tips:", file=sys.stderr)
            print("  1. Verify your internet connection and DNS settings.", file=sys.stderr)
            print("  2. If behind a proxy, configure HTTP_PROXY or HTTPS_PROXY.", file=sys.stderr)
            sys.exit(1)
        except Exception as ex:
            if attempt < max_attempts - 1:
                time.sleep(1.0)
                continue
            print(red(f"Unexpected Request Error: {ex}"), file=sys.stderr)
            sys.exit(1)


def format_output(data: Any, format_type: str = "table") -> None:
    if format_type == "json":
        print(json.dumps(data, indent=2))
        return

    if format_type == "yaml":
        def _to_yaml(obj, indent=0):
            prefix = "  " * indent
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if isinstance(v, (dict, list)):
                        print(f"{prefix}{k}:")
                        _to_yaml(v, indent + 1)
                    else:
                        print(f"{prefix}{k}: {v}")
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, (dict, list)):
                        print(f"{prefix}-")
                        _to_yaml(item, indent + 1)
                    else:
                        print(f"{prefix}- {item}")
            else:
                print(f"{prefix}{obj}")
        _to_yaml(data)
        return

    # Table format
    if isinstance(data, list):
        if not data:
            print("No records found.")
            return
        if isinstance(data[0], dict):
            keys = [k for k in data[0].keys() if k not in ("spec", "metadata", "tags", "env_vars", "result")]
            
            # calculate widths
            col_widths = {}
            for k in keys:
                max_w = len(k)
                for row in data:
                    v = str(row.get(k, ""))
                    if k.lower() == 'status': v = colorize_status(v)
                    max_w = max(max_w, len(strip_ansi(v)))
                col_widths[k] = max_w
                
            header_str = "  ".join(f"{bold(k.upper()):<{col_widths[k] + (len(bold(k.upper())) - len(strip_ansi(bold(k.upper()))))}}" for k in keys)
            print(header_str)
            print("-" * len(strip_ansi(header_str)))
            for row in data:
                row_str_parts = []
                for k in keys:
                    v = str(row.get(k, ''))
                    if k.lower() == 'status': v = colorize_status(v)
                    pad = " " * (col_widths[k] - len(strip_ansi(v)))
                    row_str_parts.append(v + pad)
                print("  ".join(row_str_parts))
        else:
            for item in data:
                print(f"- {item}")
    elif isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                print(f"{bold(k)}: {json.dumps(v)}")
            else:
                disp_v = colorize_status(v) if k.lower() == 'status' else v
                print(f"{bold(k):<25}: {disp_v}")
    else:
        print(data)


# ─── Command Handlers ────────────────────────────────────────────────────────

def cmd_init(args, cfg):
    print(bold(cyan("Welcome to Aravanta Cloud OS!")))
    print("Let's set up your CLI environment.\n")
    
    url = input(f"API URL [{DEFAULT_API_URL}]: ").strip()
    cfg["api_url"] = url if url else DEFAULT_API_URL
        
    print("\n" + bold("Authentication"))
    token = input("Paste your Aravanta JWT token (leave empty to login via email/password): ").strip()
    if token:
        args.auth_action = "token"
        args.token = token
        cmd_auth(args, cfg)
    else:
        args.auth_action = "login"
        args.email = None
        args.password = None
        cmd_auth(args, cfg)
        
    print(green("\nInitialization complete! Run 'aravanta help' to see available commands."))


def cmd_doctor(args, cfg):
    print(bold("Aravanta Cloud OS Diagnostics\n"))
    checks = []
    
    checks.append(("Configuration File", "OK" if CONFIG_FILE.exists() else "MISSING"))
    
    import urllib.parse
    import socket
    url = cfg.get("api_url", DEFAULT_API_URL)
    parsed = urllib.parse.urlparse(url)
    try:
        host = parsed.hostname or url
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        t0 = time.time()
        socket.create_connection((host, port), timeout=5)
        lat = int((time.time() - t0) * 1000)
        checks.append(("DNS & Connectivity", f"OK ({lat}ms)"))
    except Exception as e:
        checks.append(("DNS & Connectivity", f"FAILED ({e})"))

    if cfg.get("token"):
        try:
            api_request("GET", "/api/v1/auth/me", api_url=url, token=cfg["token"])
            checks.append(("Authentication", "OK (Token Valid)"))
        except Exception:
            checks.append(("Authentication", "FAILED (Invalid Token)"))
    else:
        checks.append(("Authentication", "FAILED (No Token)"))
        
    for name, status in checks:
        if "FAILED" in status or "MISSING" in status:
            print(f"{name:<25}: {red(status)}")
        else:
            print(f"{name:<25}: {green(status)}")


def cmd_logs(args, cfg):
    query = f"resource_id={args.resource_id}"
    if args.level:
        query += f"&level={args.level}"
    if args.lines:
        query += f"&lines={args.lines}"
    res = api_request("GET", f"/api/v1/operations/logs?{query}", api_url=args.api_url)
    if args.output == "json":
        print(json.dumps(res, indent=2))
    else:
        logs = res.get("logs", []) if isinstance(res, dict) else res
        if not logs:
            print("No logs found.")
            return
        for log in logs:
            ts = log.get("timestamp", "")
            lvl = log.get("level", "INFO")
            msg = log.get("message", "")
            color_lvl = red(lvl) if lvl == "ERROR" else yellow(lvl) if lvl == "WARN" else cyan(lvl)
            print(f"[{dim(ts)}] {color_lvl}: {msg}")


def cmd_completion(args, cfg):
    shell = args.shell
    if shell == "bash":
        print("# Bash completion script for aravanta")
        print("complete -C 'aravanta completion-helper' aravanta")
    elif shell == "zsh":
        print("# Zsh completion script for aravanta")
        print("compdef _aravanta aravanta")
    elif shell == "powershell":
        print("# PowerShell completion script for aravanta")
        print("Register-ArgumentCompleter -Native -CommandName aravanta -ScriptBlock { ... }")
    else:
        print(f"Shell {shell} not fully supported yet.")


def cmd_auth(args, cfg):
    action = getattr(args, "auth_action", None)
    if action == "login":
        email = args.email or input("Email: ")
        import getpass
        password = args.password or getpass.getpass("Password: ")
        resp = api_request("POST", "/api/v1/auth/login", {"email": email, "password": password}, api_url=args.api_url)
        token = resp.get("access_token")
        cfg["token"] = token
        cfg["user_email"] = email

        try:
            orgs = api_request("GET", "/api/v1/organizations", token=token, api_url=args.api_url)
            if orgs:
                cfg["active_org_id"] = orgs[0]["id"]
                prjs = api_request("GET", f"/api/v1/projects?organization_id={orgs[0]['id']}", token=token, api_url=args.api_url)
                if prjs:
                    cfg["active_project_id"] = prjs[0]["id"]
        except Exception:
            pass

        save_config(cfg)
        print(green(f"[SUCCESS] Authenticated as {email}"))
        if cfg.get("active_org_id"):
            print(f"Active Org: {cfg['active_org_id']}, Project: {cfg.get('active_project_id')}")

    elif action == "token":
        token = getattr(args, "token", None) or input("Paste Aravanta JWT Token: ").strip()
        if not token:
            print(red("Token cannot be empty."), file=sys.stderr)
            sys.exit(1)
        cfg["token"] = token
        resp = api_request("GET", "/api/v1/auth/me", token=token, api_url=args.api_url)
        cfg["user_email"] = resp.get("email")
        try:
            orgs = api_request("GET", "/api/v1/organizations", token=token, api_url=args.api_url)
            if orgs:
                cfg["active_org_id"] = orgs[0]["id"]
                prjs = api_request("GET", f"/api/v1/projects?organization_id={orgs[0]['id']}", token=token, api_url=args.api_url)
                if prjs:
                    cfg["active_project_id"] = prjs[0]["id"]
        except Exception:
            pass
        save_config(cfg)
        print(green(f"[SUCCESS] Token validated. Authenticated as {resp.get('email')} ({resp.get('role')})"))

    elif action == "logout":
        cfg["token"] = None
        cfg["user_email"] = None
        save_config(cfg)
        print(green("Logged out successfully."))


def cmd_whoami(args, cfg):
    if not cfg.get("token"):
        print(red("Not logged in. Run 'aravanta auth login' or 'aravanta auth token <jwt>'."), file=sys.stderr)
        sys.exit(1)
    resp = api_request("GET", "/api/v1/auth/me", api_url=getattr(args, "api_url", None))
    resp["active_org_id"] = cfg.get("active_org_id")
    resp["active_project_id"] = cfg.get("active_project_id")
    format_output(resp, getattr(args, "output", "table"))


def cmd_status(args, cfg):
    base_url = (getattr(args, "api_url", None) or cfg.get("api_url") or DEFAULT_API_URL).rstrip("/")
    t0 = time.time()
    try:
        health = api_request("GET", "/health", api_url=base_url)
        lat = int((time.time() - t0) * 1000)
        status_info = {
            "platform": "Aravanta Cloud OS",
            "backend_url": base_url,
            "status": health.get("status", "HEALTHY"),
            "latency_ms": lat,
            "authenticated": bool(cfg.get("token")),
            "active_user": cfg.get("user_email") or "None",
            "active_org": cfg.get("active_org_id") or "None",
            "active_project": cfg.get("active_project_id") or "None",
        }
        format_output(status_info, getattr(args, "output", "table"))
    except Exception as e:
        print(red(f"Status check failed: {e}"), file=sys.stderr)
        sys.exit(1)


def cmd_org(args, cfg):
    action = args.org_action
    if action in ("list", "ls"):
        orgs = api_request("GET", "/api/v1/organizations", api_url=args.api_url)
        for o in orgs:
            if o.get("id") == cfg.get("active_org_id"):
                o["active"] = "*"
        format_output(orgs, args.output)
    elif action == "create":
        org = api_request("POST", "/api/v1/organizations", {"name": args.name, "slug": args.slug}, api_url=args.api_url)
        print(green(f"Created organization {org['name']} ({org['id']})"))
        if not cfg.get("active_org_id"):
            cfg["active_org_id"] = org["id"]
            save_config(cfg)
    elif action == "switch":
        cfg["active_org_id"] = args.org_id
        save_config(cfg)
        print(green(f"Switched active organization to {args.org_id}"))


def cmd_project(args, cfg):
    action = args.project_action
    if action in ("list", "ls"):
        org_id = args.org_id or cfg.get("active_org_id")
        path = f"/api/v1/projects?organization_id={org_id}" if org_id else "/api/v1/projects"
        prjs = api_request("GET", path, api_url=args.api_url)
        for p in prjs:
            if p.get("id") == cfg.get("active_project_id"):
                p["active"] = "*"
        format_output(prjs, args.output)
    elif action == "create":
        org_id = args.org_id or cfg.get("active_org_id")
        if not org_id:
            print(red("Error: Missing --org-id and no active organization set."), file=sys.stderr)
            sys.exit(1)
        prj = api_request(
            "POST",
            "/api/v1/projects",
            {
                "organization_id": org_id,
                "name": args.name,
                "description": args.description or ""
            },
            api_url=args.api_url
        )
        print(green(f"Created project {prj['name']} ({prj['id']})"))
        if not cfg.get("active_project_id"):
            cfg["active_project_id"] = prj["id"]
            save_config(cfg)
    elif action == "switch":
        cfg["active_project_id"] = args.project_id
        save_config(cfg)
        print(green(f"Switched active project to {args.project_id}"))


def cmd_resource(args, cfg):
    action = args.res_action
    if action in ("list", "ls"):
        query = []
        prj_id = args.project or cfg.get("active_project_id")
        if prj_id:
            query.append(f"project_id={prj_id}")
        if args.type:
            query.append(f"type={args.type}")
        if args.status:
            query.append(f"status={args.status}")
        path = f"/api/v1/resources?{'&'.join(query)}" if query else "/api/v1/resources"
        res = api_request("GET", path, api_url=args.api_url)
        format_output(res, args.output)
    elif action == "get":
        res = api_request("GET", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "create":
        prj_id = args.project or cfg.get("active_project_id")
        if not prj_id:
            print(red("Error: Specify --project or switch to an active project first."), file=sys.stderr)
            sys.exit(1)
        spec = json.loads(args.spec) if args.spec else {}
        body = {
            "project_id": prj_id,
            "name": args.name,
            "type": args.type,
            "region": args.region or "arv-us-east-1",
            "spec": spec
        }
        res = api_request("POST", "/api/v1/resources", body, api_url=args.api_url)
        print(green(f"Created resource {res['name']} ({res['id']}) — Status: {res['status']}"))
    elif action == "action":
        res = api_request("POST", f"/api/v1/resources/{args.resource_id}/actions", {"action": args.action_name}, api_url=args.api_url)
        print(green(f"Action '{args.action_name}' submitted for {args.resource_id}. Job ID: {res.get('job_id')}"))
    elif action == "delete":
        api_request("DELETE", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        print(green(f"Deleted resource {args.resource_id}"))


def cmd_compute(args, cfg):
    action = args.compute_action
    if action in ("list", "ls"):
        args.type = "compute"
        args.status = None
        args.res_action = "list"
        cmd_resource(args, cfg)
    elif action == "get":
        args.res_action = "get"
        cmd_resource(args, cfg)
    elif action == "create":
        prj_id = args.project or cfg.get("active_project_id")
        if not prj_id:
            try:
                prjs = api_request("GET", "/api/v1/projects", api_url=args.api_url)
                if prjs:
                    prj_id = prjs[0]["id"]
            except Exception:
                prj_id = "default"
        body = {
            "project_id": prj_id,
            "name": args.name,
            "type": "compute",
            "region": args.region or "arv-us-east-1",
            "spec": {
                "cpu": args.cpu,
                "ram_mb": args.ram,
                "os_image": args.image
            }
        }
        res = api_request("POST", "/api/v1/resources", body, api_url=args.api_url)
        print(green(f"Provisioned compute instance {res['name']} ({res['id']})"))
        print(f"Status: {colorize_status(res['status'])}, Spec: {args.cpu} vCPU / {args.ram} MB RAM / {args.image}")
    elif action in ("start", "stop", "restart", "delete"):
        if action == "delete":
            args.res_action = "delete"
            cmd_resource(args, cfg)
        else:
            args.res_action = "action"
            args.action_name = action
            cmd_resource(args, cfg)


def cmd_functions(args, cfg):
    action = args.func_action
    if action == "list":
        res = api_request("GET", "/api/v1/functions", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "create":
        body = {
            "name": args.name, "runtime": args.runtime, "handler": args.handler,
            "memory": args.memory, "timeout": args.timeout
        }
        res = api_request("POST", "/api/v1/functions", body, api_url=args.api_url)
        print(green(f"Created function {res.get('name')} ({res.get('id')})"))
    elif action == "get":
        res = api_request("GET", f"/api/v1/functions/{args.function_id}", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "invoke":
        body = json.loads(args.payload) if getattr(args, "payload", None) else {}
        res = api_request("POST", f"/api/v1/functions/{args.function_id}/invoke", body, api_url=args.api_url)
        format_output(res, args.output)
    elif action == "delete":
        api_request("DELETE", f"/api/v1/functions/{args.function_id}", api_url=args.api_url)
        print(green(f"Deleted function {args.function_id}"))
    elif action == "logs":
        res = api_request("GET", f"/api/v1/functions/{args.function_id}/invocations", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "metrics":
        res = api_request("GET", f"/api/v1/functions/{args.function_id}/metrics", api_url=args.api_url)
        format_output(res, args.output)


def cmd_vault(args, cfg):
    action = args.vault_action
    if action == "secrets list":
        res = api_request("GET", "/api/v1/vault/secrets", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "secrets create":
        body = {"name": args.name, "value": args.value}
        res = api_request("POST", "/api/v1/vault/secrets", body, api_url=args.api_url)
        print(green(f"Created secret {res.get('name')} ({res.get('id')})"))
    elif action == "secrets get":
        res = api_request("POST", f"/api/v1/vault/secrets/{args.secret_id}/access", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "secrets rotate":
        res = api_request("POST", f"/api/v1/vault/secrets/{args.secret_id}/rotate", api_url=args.api_url)
        print(green(f"Rotated secret {args.secret_id}"))
    elif action == "secrets delete":
        api_request("DELETE", f"/api/v1/vault/secrets/{args.secret_id}", api_url=args.api_url)
        print(green(f"Deleted secret {args.secret_id}"))
    elif action == "keys list":
        res = api_request("GET", "/api/v1/vault/keys", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "keys create":
        body = {"name": args.name, "algorithm": args.algorithm}
        res = api_request("POST", "/api/v1/vault/keys", body, api_url=args.api_url)
        print(green(f"Created key {res.get('name')} ({res.get('id')})"))
    elif action == "keys encrypt":
        body = {"plaintext": args.plaintext}
        res = api_request("POST", f"/api/v1/vault/keys/{args.key_id}/encrypt", body, api_url=args.api_url)
        format_output(res, args.output)
    elif action == "keys decrypt":
        body = {"ciphertext": args.ciphertext}
        res = api_request("POST", f"/api/v1/vault/keys/{args.key_id}/decrypt", body, api_url=args.api_url)
        format_output(res, args.output)
    elif action == "audit-log":
        res = api_request("GET", "/api/v1/vault/audit-log", api_url=args.api_url)
        format_output(res, args.output)


def cmd_events(args, cfg):
    action = args.events_action
    if action == "queues list":
        res = api_request("GET", "/api/v1/events/queues", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "queues create":
        body = {"name": args.name, "type": getattr(args, "type", "STANDARD")}
        res = api_request("POST", "/api/v1/events/queues", body, api_url=args.api_url)
        print(green(f"Created queue {res.get('name')} ({res.get('id')})"))
    elif action == "queues send":
        body = json.loads(args.body)
        res = api_request("POST", f"/api/v1/events/queues/{args.queue_id}/messages", body, api_url=args.api_url)
        print(green(f"Message sent. ID: {res.get('message_id')}"))
    elif action == "queues receive":
        res = api_request("GET", f"/api/v1/events/queues/{args.queue_id}/messages", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "queues purge":
        api_request("POST", f"/api/v1/events/queues/{args.queue_id}/purge", api_url=args.api_url)
        print(green(f"Purged queue {args.queue_id}"))
    elif action == "queues delete":
        api_request("DELETE", f"/api/v1/events/queues/{args.queue_id}", api_url=args.api_url)
        print(green(f"Deleted queue {args.queue_id}"))
    elif action == "topics list":
        res = api_request("GET", "/api/v1/events/topics", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "topics create":
        res = api_request("POST", "/api/v1/events/topics", {"name": args.name}, api_url=args.api_url)
        print(green(f"Created topic {res.get('name')} ({res.get('id')})"))
    elif action == "topics publish":
        body = json.loads(args.message)
        res = api_request("POST", f"/api/v1/events/topics/{args.topic_id}/publish", body, api_url=args.api_url)
        print(green(f"Published to topic. ID: {res.get('message_id')}"))


def cmd_dns(args, cfg):
    action = args.dns_action
    if action == "zones list":
        res = api_request("GET", "/api/v1/dns/zones", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "zones create":
        res = api_request("POST", "/api/v1/dns/zones", {"domain": args.domain}, api_url=args.api_url)
        print(green(f"Created zone {res.get('domain')} ({res.get('id')})"))
    elif action == "records list":
        res = api_request("GET", f"/api/v1/dns/zones/{args.zone_id}/records", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "records create":
        body = {"type": args.type, "name": args.name, "value": args.value, "ttl": getattr(args, "ttl", 300)}
        res = api_request("POST", f"/api/v1/dns/zones/{args.zone_id}/records", body, api_url=args.api_url)
        print(green(f"Created record {res.get('name')} ({res.get('id')})"))
    elif action == "records delete":
        api_request("DELETE", f"/api/v1/dns/zones/{args.zone_id}/records/{args.record_id}", api_url=args.api_url)
        print(green(f"Deleted record {args.record_id} from zone {args.zone_id}"))


def cmd_lb(args, cfg):
    action = args.lb_action
    if action == "list":
        res = api_request("GET", "/api/v1/loadbalancers", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "create":
        body = {"name": args.name, "type": getattr(args, "type", "L7")}
        res = api_request("POST", "/api/v1/loadbalancers", body, api_url=args.api_url)
        print(green(f"Created loadbalancer {res.get('name')} ({res.get('id')})"))
    elif action == "get":
        res = api_request("GET", f"/api/v1/loadbalancers/{args.lb_id}", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "delete":
        api_request("DELETE", f"/api/v1/loadbalancers/{args.lb_id}", api_url=args.api_url)
        print(green(f"Deleted loadbalancer {args.lb_id}"))


def cmd_workflows(args, cfg):
    action = args.wf_action
    if action == "list":
        res = api_request("GET", "/api/v1/workflows", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "create":
        body = {"name": args.name, "definition": json.loads(args.definition)}
        res = api_request("POST", "/api/v1/workflows", body, api_url=args.api_url)
        print(green(f"Created workflow {res.get('name')} ({res.get('id')})"))
    elif action == "run":
        body = json.loads(args.input) if getattr(args, "input", None) else {}
        res = api_request("POST", f"/api/v1/workflows/{args.workflow_id}/execute", body, api_url=args.api_url)
        print(green(f"Workflow execution started. ID: {res.get('execution_id')}"))
    elif action == "trace":
        res = api_request("GET", f"/api/v1/workflows/executions/{args.execution_id}", api_url=args.api_url)
        format_output(res, args.output)


def cmd_stream(args, cfg):
    action = args.stream_action
    if action == "clusters list":
        res = api_request("GET", "/api/v1/streams/clusters", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "clusters create":
        res = api_request("POST", "/api/v1/streams/clusters", {"name": args.name}, api_url=args.api_url)
        print(green(f"Created cluster {res.get('name')} ({res.get('id')})"))
    elif action == "topics list":
        res = api_request("GET", f"/api/v1/streams/clusters/{args.cluster_id}/topics", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "topics create":
        body = {"name": args.name, "partitions": args.partitions}
        res = api_request("POST", f"/api/v1/streams/clusters/{args.cluster_id}/topics", body, api_url=args.api_url)
        print(green(f"Created topic {res.get('name')} with {args.partitions} partitions"))


def cmd_billing(args, cfg):
    action = args.billing_action
    if action == "account":
        res = api_request("GET", "/api/v1/billing/account", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            print(bold("=== Aravanta Billing Account ==="))
            print(f"{'Account ID:':<18} {res.get('id')}")
            print(f"{'Organization ID:':<18} {res.get('organization_id')}")
            print(f"{'Status:':<18} {colorize_status(res.get('status'))}")
            print(f"{'Currency:':<18} {res.get('currency')}")
            print(f"{'Current Balance:':<18} ₹{res.get('balance', 0):,.2f}")
            print(f"{'Credits:':<18} ₹{res.get('credits', 0):,.2f}")
            print(f"{'Billing Cycle:':<18} {res.get('billing_cycle')}")
    elif action == "usage":
        params = []
        if args.project:
            params.append(f"project_id={args.project}")
        if getattr(args, "status", None):
            params.append(f"status={args.status}")
        query_str = f"?{'&'.join(params)}" if params else ""
        res = api_request("GET", f"/api/v1/billing/usage{query_str}", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            headers = ["ID", "RESOURCE ID", "TYPE", "METER", "QTY", "UNIT", "STATUS"]
            rows = []
            for r in res:
                rows.append([
                    r.get("id", "")[:14],
                    r.get("resource_id", "")[:16],
                    r.get("resource_type", ""),
                    r.get("meter_name", ""),
                    str(r.get("quantity", 0)),
                    r.get("unit", ""),
                    colorize_status(r.get("status", ""))
                ])
            print_table(headers, rows)
    elif action == "estimate":
        res = api_request("GET", "/api/v1/billing/estimate", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            print(bold("=== Live Metered Billing Estimate ==="))
            print(f"{'Subtotal:':<16} ₹{res.get('subtotal', 0):,.2f}")
            print(f"{'CGST (9%):':<16} ₹{res.get('tax_cgst', 0):,.2f}")
            print(f"{'SGST (9%):':<16} ₹{res.get('tax_sgst', 0):,.2f}")
            print(f"{'Total Estimate:':<16} ₹{res.get('total_estimated', 0):,.2f} ({res.get('currency', 'INR')})")
            print(f"{'Active Meters:':<16} {res.get('active_unbilled_meters', 0)}")
            items = res.get("line_items", [])
            if items:
                print("\nItemized Breakdown:")
                headers = ["RESOURCE", "TYPE", "METER", "QTY", "RATE", "AMOUNT"]
                rows = []
                for item in items:
                    rows.append([
                        item.get("resource_name", "")[:20],
                        item.get("resource_type", ""),
                        item.get("meter_name", ""),
                        f"{item.get('quantity', 0)} {item.get('unit', '')}",
                        f"₹{item.get('unit_price', 0):,.2f}",
                        f"₹{item.get('amount', 0):,.2f}"
                    ])
                print_table(headers, rows)
    elif action in ("invoices", "list"):
        res = api_request("GET", "/api/v1/billing/invoices", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            headers = ["INVOICE ID", "PERIOD START", "PERIOD END", "TOTAL", "STATUS", "PAYMENT METHOD"]
            rows = []
            for inv in res:
                rows.append([
                    inv.get("id", ""),
                    (inv.get("period_start") or "")[:10],
                    (inv.get("period_end") or "")[:10],
                    f"₹{inv.get('total', 0):,.2f}",
                    colorize_status(inv.get("status", "")),
                    inv.get("payment_method", "")
                ])
            print_table(headers, rows)
    elif action == "pay":
        body = {
            "invoice_id": args.invoice_id,
            "provider": args.provider or "sandbox",
            "payment_method": args.method or "CLI_CHECKOUT"
        }
        res = api_request("POST", "/api/v1/billing/pay", body, api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            print(f"Payment {colorize_status(res.get('status'))}: Invoice {res.get('invoice_id')} settled for ₹{res.get('amount', 0):,.2f}")
    elif action == "close-period":
        res = api_request("POST", "/api/v1/billing/invoices/generate", {"payment_method": "CLI_AUTOPAY"}, api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            inv = res.get("invoice")
            if inv:
                print(green(f"Closed billing period. Finalized Invoice: {inv.get('id')} — Total: ₹{inv.get('total', 0):,.2f}"))
            else:
                print(res.get("message", "No unbilled usage found."))


# ─── Parser Setup ────────────────────────────────────────────────────────────

class AravantaArgumentParser(argparse.ArgumentParser):
    def print_help(self, file=None):
        print(bold(cyan("Aravanta Cloud OS CLI (v2.0.0)")))
        print("First-class, API-first command-line interface for managing Aravanta Cloud.\n")
        print(bold("Core Commands:"))
        print(f"  {cyan('init'):<15} Initialize CLI and workspace")
        print(f"  {cyan('auth'):<15} Manage authentication")
        print(f"  {cyan('whoami'):<15} Show active authenticated user")
        print(f"  {cyan('status'):<15} Inspect platform API connectivity")
        print(f"  {cyan('doctor'):<15} Connectivity diagnostics")
        print(f"  {cyan('completion'):<15} Generate shell completion scripts\n")
        
        print(bold("Infrastructure & Services:"))
        print(f"  {cyan('org'):<15} Manage organizations")
        print(f"  {cyan('project'):<15} Manage projects")
        print(f"  {cyan('resource'):<15} Unified resource management")
        print(f"  {cyan('compute'):<15} Virtual machines and compute")
        print(f"  {cyan('functions'):<15} Serverless functions")
        print(f"  {cyan('lb'):<15} Load balancers")
        print(f"  {cyan('dns'):<15} DNS management\n")
        
        print(bold("Data & Messaging:"))
        print(f"  {cyan('events'):<15} Event bus, queues, and topics")
        print(f"  {cyan('stream'):<15} Stream processing (Kafka)")
        print(f"  {cyan('vault'):<15} Secrets and key management")
        print(f"  {cyan('workflows'):<15} Orchestrate multi-step processes\n")
        
        print(bold("Operations:"))
        print(f"  {cyan('logs'):<15} View resource logs")
        print(f"  {cyan('billing'):<15} Invoices, usage, and payments\n")
        
        print(dim("Run 'aravanta <command> --help' for details on a specific command."))

def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--api-url", default=None, help="Override Aravanta API endpoint")
    common.add_argument("--output", choices=["table", "json", "yaml"], default="table", help="Output format")
    common.add_argument("--json", action="store_true", help="Shortcut for --output json")
    common.add_argument("--project", default=None, help="Target project ID")
    common.add_argument("--region", default=None, help="Target region")

    parser = AravantaArgumentParser(
        prog="aravanta",
        description="Aravanta Cloud OS — First-Class Cloud Computing CLI",
        parents=[common]
    )
    parser.add_argument("--version", action="version", version=f"aravanta-cli {VERSION}")

    subparsers = parser.add_subparsers(dest="command")

    # Core
    subparsers.add_parser("init", help="Initialize CLI and workspace", parents=[common])
    subparsers.add_parser("doctor", help="Connectivity diagnostics", parents=[common])
    p_comp = subparsers.add_parser("completion", help="Generate shell completion scripts", parents=[common])
    p_comp.add_argument("shell", choices=["bash", "zsh", "powershell"], help="Target shell")

    p_logs = subparsers.add_parser("logs", help="View resource logs", parents=[common])
    p_logs.add_argument("resource_id", help="Resource ID")
    p_logs.add_argument("--level", choices=["ERROR", "WARN", "INFO", "DEBUG"], help="Filter by level")
    p_logs.add_argument("--lines", type=int, default=50, help="Number of lines to tail")

    # Auth
    p_auth = subparsers.add_parser("auth", help="Manage authentication and sessions", parents=[common])
    p_auth_sub = p_auth.add_subparsers(dest="auth_action", required=True)
    p_login = p_auth_sub.add_parser("login", help="Log in with email and password", parents=[common])
    p_login.add_argument("--email", help="Account email")
    p_login.add_argument("--password", help="Account password")
    p_tok = p_auth_sub.add_parser("token", help="Authenticate directly with a JWT token", parents=[common])
    p_tok.add_argument("token", nargs="?", help="JWT access token from web console")
    p_auth_sub.add_parser("logout", help="Log out of the current session", parents=[common])
    p_auth_sub.add_parser("whoami", help="Show the current authenticated identity", parents=[common])

    subparsers.add_parser("whoami", help="Display active authenticated user and session", parents=[common])
    subparsers.add_parser("status", help="Inspect platform API connectivity and health", parents=[common])

    # Org
    p_org = subparsers.add_parser("org", help="Manage organizations", parents=[common])
    p_org_sub = p_org.add_subparsers(dest="org_action", required=True)
    p_org_sub.add_parser("list", help="List organizations", parents=[common])
    p_org_sub.add_parser("ls", help="List organizations (alias)", parents=[common])
    p_org_create = p_org_sub.add_parser("create", help="Create an organization", parents=[common])
    p_org_create.add_argument("--name", required=True, help="Organization name")
    p_org_create.add_argument("--slug", help="Organization slug")
    p_org_sw = p_org_sub.add_parser("switch", help="Switch active organization", parents=[common])
    p_org_sw.add_argument("--org-id", required=True, help="Organization ID")

    # Project
    p_prj = subparsers.add_parser("project", help="Manage projects", parents=[common])
    p_prj_sub = p_prj.add_subparsers(dest="project_action", required=True)
    p_prj_list = p_prj_sub.add_parser("list", help="List projects", parents=[common])
    p_prj_list.add_argument("--org-id", help="Organization ID")
    p_prj_sub.add_parser("ls", help="List projects (alias)", parents=[common])
    p_prj_create = p_prj_sub.add_parser("create", help="Create a project", parents=[common])
    p_prj_create.add_argument("--name", required=True, help="Project name")
    p_prj_create.add_argument("--org-id", help="Parent organization ID")
    p_prj_create.add_argument("--description", help="Project description")
    p_prj_sw = p_prj_sub.add_parser("switch", help="Switch active project", parents=[common])
    p_prj_sw.add_argument("--project-id", required=True, help="Project ID")

    # Resource
    p_res = subparsers.add_parser("resource", help="Manage unified cloud resources", parents=[common])
    p_res_sub = p_res.add_subparsers(dest="res_action", required=True)
    p_res_list = p_res_sub.add_parser("list", help="List cloud resources", parents=[common])
    p_res_list.add_argument("--type", help="Filter by type (compute, storage, database, etc.)")
    p_res_list.add_argument("--status", help="Filter by status")
    p_res_sub.add_parser("ls", help="List cloud resources (alias)", parents=[common])
    p_res_get = p_res_sub.add_parser("get", help="Get resource details", parents=[common])
    p_res_get.add_argument("resource_id", help="Resource ID")
    p_res_create = p_res_sub.add_parser("create", help="Create a resource", parents=[common])
    p_res_create.add_argument("--name", required=True, help="Resource name")
    p_res_create.add_argument("--type", required=True, help="compute, storage, database, etc.")
    p_res_create.add_argument("--spec", help="Resource specification as JSON string")
    p_res_act = p_res_sub.add_parser("action", help="Perform lifecycle action on a resource", parents=[common])
    p_res_act.add_argument("resource_id", help="Resource ID")
    p_res_act.add_argument("action_name", choices=["start", "stop", "terminate", "restart"], help="Action to perform")
    p_res_del = p_res_sub.add_parser("delete", help="Delete a resource", parents=[common])
    p_res_del.add_argument("resource_id", help="Resource ID")

    # Compute
    p_comp = subparsers.add_parser("compute", help="Manage compute instances and workloads", parents=[common])
    p_comp_sub = p_comp.add_subparsers(dest="compute_action", required=True)
    p_comp_sub.add_parser("list", help="List compute instances", parents=[common])
    p_comp_sub.add_parser("ls", help="List compute instances (alias)", parents=[common])
    p_comp_get = p_comp_sub.add_parser("get", help="Get compute instance details", parents=[common])
    p_comp_get.add_argument("resource_id", help="Compute instance ID")
    p_comp_create = p_comp_sub.add_parser("create", help="Launch a compute instance", parents=[common])
    p_comp_create.add_argument("--name", required=True, help="Instance name")
    p_comp_create.add_argument("--cpu", type=int, default=2, help="vCPU count")
    p_comp_create.add_argument("--ram", type=int, default=4096, help="RAM in MB")
    p_comp_create.add_argument("--image", default="Ubuntu 22.04 LTS", help="OS Image")
    for act in ("start", "stop", "restart", "delete"):
        p_act = p_comp_sub.add_parser(act, help=f"{act.capitalize()} a compute instance", parents=[common])
        p_act.add_argument("resource_id", help="Compute instance ID")

    # Functions
    p_func = subparsers.add_parser("functions", help="Manage Serverless Functions", parents=[common])
    p_func_sub = p_func.add_subparsers(dest="func_action", required=True)
    p_func_sub.add_parser("list", help="List functions", parents=[common])
    p_func_c = p_func_sub.add_parser("create", help="Create function", parents=[common])
    p_func_c.add_argument("--name", required=True)
    p_func_c.add_argument("--runtime", required=True)
    p_func_c.add_argument("--handler", required=True)
    p_func_c.add_argument("--memory", type=int, default=128)
    p_func_c.add_argument("--timeout", type=int, default=15)
    p_func_g = p_func_sub.add_parser("get", help="Get function", parents=[common])
    p_func_g.add_argument("function_id")
    p_func_i = p_func_sub.add_parser("invoke", help="Invoke function", parents=[common])
    p_func_i.add_argument("function_id")
    p_func_i.add_argument("--payload", help="JSON payload")
    p_func_d = p_func_sub.add_parser("delete", help="Delete function", parents=[common])
    p_func_d.add_argument("function_id")
    p_func_l = p_func_sub.add_parser("logs", help="Function invocations", parents=[common])
    p_func_l.add_argument("function_id")
    p_func_m = p_func_sub.add_parser("metrics", help="Function metrics", parents=[common])
    p_func_m.add_argument("function_id")

    # Vault
    p_vault = subparsers.add_parser("vault", help="Secrets & Key Management", parents=[common])
    p_vault_sub = p_vault.add_subparsers(dest="vault_action", required=True)
    p_vault_sub.add_parser("secrets list", help="List secrets")
    p_v_sc = p_vault_sub.add_parser("secrets create", help="Create secret")
    p_v_sc.add_argument("--name", required=True)
    p_v_sc.add_argument("--value", required=True)
    p_v_sg = p_vault_sub.add_parser("secrets get", help="Get secret")
    p_v_sg.add_argument("secret_id")
    p_v_sr = p_vault_sub.add_parser("secrets rotate", help="Rotate secret")
    p_v_sr.add_argument("secret_id")
    p_v_sd = p_vault_sub.add_parser("secrets delete", help="Delete secret")
    p_v_sd.add_argument("secret_id")
    p_vault_sub.add_parser("keys list", help="List keys")
    p_v_kc = p_vault_sub.add_parser("keys create", help="Create key")
    p_v_kc.add_argument("--name", required=True)
    p_v_kc.add_argument("--algorithm", required=True)
    p_v_ke = p_vault_sub.add_parser("keys encrypt", help="Encrypt with key")
    p_v_ke.add_argument("key_id")
    p_v_ke.add_argument("--plaintext", required=True)
    p_v_kd = p_vault_sub.add_parser("keys decrypt", help="Decrypt with key")
    p_v_kd.add_argument("key_id")
    p_v_kd.add_argument("--ciphertext", required=True)
    p_vault_sub.add_parser("audit-log", help="Vault audit log")

    # Events
    p_evt = subparsers.add_parser("events", help="Event Bus & Queues", parents=[common])
    p_evt_sub = p_evt.add_subparsers(dest="events_action", required=True)
    p_evt_sub.add_parser("queues list", help="List queues")
    p_e_qc = p_evt_sub.add_parser("queues create", help="Create queue")
    p_e_qc.add_argument("--name", required=True)
    p_e_qc.add_argument("--type", choices=["STANDARD", "FIFO"], default="STANDARD")
    p_e_qs = p_evt_sub.add_parser("queues send", help="Send to queue")
    p_e_qs.add_argument("queue_id")
    p_e_qs.add_argument("--body", required=True, help="JSON message body")
    p_e_qr = p_evt_sub.add_parser("queues receive", help="Receive from queue")
    p_e_qr.add_argument("queue_id")
    p_e_qp = p_evt_sub.add_parser("queues purge", help="Purge queue")
    p_e_qp.add_argument("queue_id")
    p_e_qd = p_evt_sub.add_parser("queues delete", help="Delete queue")
    p_e_qd.add_argument("queue_id")
    p_evt_sub.add_parser("topics list", help="List topics")
    p_e_tc = p_evt_sub.add_parser("topics create", help="Create topic")
    p_e_tc.add_argument("--name", required=True)
    p_e_tp = p_evt_sub.add_parser("topics publish", help="Publish to topic")
    p_e_tp.add_argument("topic_id")
    p_e_tp.add_argument("--message", required=True, help="JSON message")

    # DNS
    p_dns = subparsers.add_parser("dns", help="DNS Management", parents=[common])
    p_dns_sub = p_dns.add_subparsers(dest="dns_action", required=True)
    p_dns_sub.add_parser("zones list", help="List zones")
    p_d_zc = p_dns_sub.add_parser("zones create", help="Create zone")
    p_d_zc.add_argument("--domain", required=True)
    p_d_rl = p_dns_sub.add_parser("records list", help="List records")
    p_d_rl.add_argument("zone_id")
    p_d_rc = p_dns_sub.add_parser("records create", help="Create record")
    p_d_rc.add_argument("zone_id")
    p_d_rc.add_argument("--type", required=True)
    p_d_rc.add_argument("--name", required=True)
    p_d_rc.add_argument("--value", required=True)
    p_d_rc.add_argument("--ttl", type=int, default=300)
    p_d_rd = p_dns_sub.add_parser("records delete", help="Delete record")
    p_d_rd.add_argument("zone_id")
    p_d_rd.add_argument("record_id")

    # LB
    p_lb = subparsers.add_parser("lb", help="Load Balancers", parents=[common])
    p_lb_sub = p_lb.add_subparsers(dest="lb_action", required=True)
    p_lb_sub.add_parser("list", help="List load balancers")
    p_lb_c = p_lb_sub.add_parser("create", help="Create load balancer")
    p_lb_c.add_argument("--name", required=True)
    p_lb_c.add_argument("--type", choices=["L4", "L7"], default="L7")
    p_lb_g = p_lb_sub.add_parser("get", help="Get load balancer")
    p_lb_g.add_argument("lb_id")
    p_lb_d = p_lb_sub.add_parser("delete", help="Delete load balancer")
    p_lb_d.add_argument("lb_id")

    # Workflows
    p_wf = subparsers.add_parser("workflows", help="Workflow Orchestration", parents=[common])
    p_wf_sub = p_wf.add_subparsers(dest="wf_action", required=True)
    p_wf_sub.add_parser("list", help="List workflows")
    p_wf_c = p_wf_sub.add_parser("create", help="Create workflow")
    p_wf_c.add_argument("--name", required=True)
    p_wf_c.add_argument("--definition", required=True, help="JSON definition")
    p_wf_r = p_wf_sub.add_parser("run", help="Run workflow")
    p_wf_r.add_argument("workflow_id")
    p_wf_r.add_argument("--input", help="JSON input")
    p_wf_t = p_wf_sub.add_parser("trace", help="Trace execution")
    p_wf_t.add_argument("execution_id")

    # Stream
    p_st = subparsers.add_parser("stream", help="Stream Processing (Kafka)", parents=[common])
    p_st_sub = p_st.add_subparsers(dest="stream_action", required=True)
    p_st_sub.add_parser("clusters list", help="List clusters")
    p_st_cc = p_st_sub.add_parser("clusters create", help="Create cluster")
    p_st_cc.add_argument("--name", required=True)
    p_st_tl = p_st_sub.add_parser("topics list", help="List topics in cluster")
    p_st_tl.add_argument("cluster_id")
    p_st_tc = p_st_sub.add_parser("topics create", help="Create topic in cluster")
    p_st_tc.add_argument("cluster_id")
    p_st_tc.add_argument("--name", required=True)
    p_st_tc.add_argument("--partitions", type=int, required=True)

    # Billing
    p_bill = subparsers.add_parser("billing", help="Inspect billing accounts, live estimates, meters, and invoices", parents=[common])
    p_bill_sub = p_bill.add_subparsers(dest="billing_action", required=True)
    p_bill_sub.add_parser("account", help="Inspect tenant billing account balance and status", parents=[common])
    p_bill_usage = p_bill_sub.add_parser("usage", help="List metered resource usage records", parents=[common])
    p_bill_usage.add_argument("--status", choices=["OPEN", "CLOSED", "BILLED"], help="Filter by meter status")
    p_bill_sub.add_parser("estimate", help="Get live cost estimate for current unbilled usage", parents=[common])
    p_bill_sub.add_parser("invoices", help="List finalized tenant invoices", parents=[common])
    p_bill_sub.add_parser("list", help="List finalized tenant invoices (alias)", parents=[common])
    p_bill_pay = p_bill_sub.add_parser("pay", help="Pay an invoice", parents=[common])
    p_bill_pay.add_argument("invoice_id", help="Invoice ID (e.g. INV-202609-ABCD)")
    p_bill_pay.add_argument("--provider", default="sandbox", help="Payment provider")
    p_bill_pay.add_argument("--method", default="CLI_CHECKOUT", help="Payment method name")
    p_bill_sub.add_parser("close-period", help="Close period and generate invoice (test mode)", parents=[common])

    return parser


def main():
    parser = build_parser()
    
    # Custom fallback for space-separated subparsers like `vault secrets list`
    args_list = sys.argv[1:]
    for multi_word in [
        ("vault", "secrets", "list"), ("vault", "secrets", "create"), ("vault", "secrets", "get"),
        ("vault", "secrets", "rotate"), ("vault", "secrets", "delete"), ("vault", "keys", "list"),
        ("vault", "keys", "create"), ("vault", "keys", "encrypt"), ("vault", "keys", "decrypt"),
        ("events", "queues", "list"), ("events", "queues", "create"), ("events", "queues", "send"),
        ("events", "queues", "receive"), ("events", "queues", "purge"), ("events", "queues", "delete"),
        ("events", "topics", "list"), ("events", "topics", "create"), ("events", "topics", "publish"),
        ("dns", "zones", "list"), ("dns", "zones", "create"), ("dns", "records", "list"),
        ("dns", "records", "create"), ("dns", "records", "delete"),
        ("stream", "clusters", "list"), ("stream", "clusters", "create"),
        ("stream", "topics", "list"), ("stream", "topics", "create")
    ]:
        if len(args_list) >= 3 and args_list[0] == multi_word[0] and args_list[1] == multi_word[1] and args_list[2] == multi_word[2]:
            sys.argv[2] = f"{sys.argv[2]} {sys.argv[3]}"
            del sys.argv[3]
            break
            
    args = parser.parse_args()

    if getattr(args, "json", False):
        args.output = "json"

    if not args.command:
        parser.print_help()
        sys.exit(0)

    cfg = load_config()

    if args.command == "init":
        cmd_init(args, cfg)
    elif args.command == "doctor":
        cmd_doctor(args, cfg)
    elif args.command == "logs":
        cmd_logs(args, cfg)
    elif args.command == "completion":
        cmd_completion(args, cfg)
    elif args.command == "auth":
        cmd_auth(args, cfg)
    elif args.command == "whoami":
        cmd_whoami(args, cfg)
    elif args.command == "status":
        cmd_status(args, cfg)
    elif args.command == "org":
        cmd_org(args, cfg)
    elif args.command == "project":
        cmd_project(args, cfg)
    elif args.command == "resource":
        cmd_resource(args, cfg)
    elif args.command == "compute":
        cmd_compute(args, cfg)
    elif args.command == "functions":
        cmd_functions(args, cfg)
    elif args.command == "vault":
        cmd_vault(args, cfg)
    elif args.command == "events":
        cmd_events(args, cfg)
    elif args.command == "dns":
        cmd_dns(args, cfg)
    elif args.command == "lb":
        cmd_lb(args, cfg)
    elif args.command == "workflows":
        cmd_workflows(args, cfg)
    elif args.command == "stream":
        cmd_stream(args, cfg)
    elif args.command == "billing":
        cmd_billing(args, cfg)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
