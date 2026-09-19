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
from pathlib import Path
from typing import Dict, Any, Optional, List

VERSION = "1.0.0"
CONFIG_DIR = Path.home() / ".aravanta"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_API_URL = "https://arv-backend.vercel.app"


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
        print(f"Warning: Could not persist config to {CONFIG_FILE}: {e}", file=sys.stderr)


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
            print(f"Error ({err.code}): {detail}", file=sys.stderr)
            if err.code == 401:
                print("Tip: Run 'aravanta auth login' or 'aravanta auth token <jwt>' to authenticate.", file=sys.stderr)
            sys.exit(1)
        except urllib.error.URLError as err:
            if attempt < max_attempts - 1:
                time.sleep(1.0)
                continue
            print(f"Connection Error: Unable to reach Aravanta API at {base_url}.", file=sys.stderr)
            print(f"Details: {err.reason}", file=sys.stderr)
            print("\nTroubleshooting Tips:", file=sys.stderr)
            print("  1. Verify your internet connection and DNS settings.", file=sys.stderr)
            print("  2. If behind a proxy, configure HTTP_PROXY or HTTPS_PROXY.", file=sys.stderr)
            print("  3. You can also use the in-browser Cloud Shell at https://aravantacos.vercel.app/", file=sys.stderr)
            sys.exit(1)
        except Exception as ex:
            if attempt < max_attempts - 1:
                time.sleep(1.0)
                continue
            print(f"Unexpected Request Error: {ex}", file=sys.stderr)
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
            col_widths = {k: max(len(k), max(len(str(row.get(k, ""))) for row in data)) for k in keys}
            header_str = "  ".join(f"{k.upper():<{col_widths[k]}}" for k in keys)
            print(header_str)
            print("-" * len(header_str))
            for row in data:
                row_str = "  ".join(f"{str(row.get(k, '')):<{col_widths[k]}}" for k in keys)
                print(row_str)
        else:
            for item in data:
                print(f"- {item}")
    elif isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                print(f"{k}: {json.dumps(v)}")
            else:
                print(f"{k:<20}: {v}")
    else:
        print(data)


# ─── Command Handlers ────────────────────────────────────────────────────────

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
        print(f"[SUCCESS] Authenticated as {email}")
        if cfg.get("active_org_id"):
            print(f"Active Org: {cfg['active_org_id']}, Project: {cfg.get('active_project_id')}")

    elif action == "token":
        token = getattr(args, "token", None) or input("Paste Aravanta JWT Token: ").strip()
        if not token:
            print("Token cannot be empty.", file=sys.stderr)
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
        print(f"[SUCCESS] Token validated. Authenticated as {resp.get('email')} ({resp.get('role')})")

    elif action == "logout":
        cfg["token"] = None
        cfg["user_email"] = None
        save_config(cfg)
        print("Logged out successfully.")

    elif action == "whoami" or getattr(args, "command", None) == "whoami":
        cmd_whoami(args, cfg)


def cmd_whoami(args, cfg):
    if not cfg.get("token"):
        print("Not logged in. Run 'aravanta auth login' or 'aravanta auth token <jwt>'.", file=sys.stderr)
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
        print(f"Status check failed: {e}", file=sys.stderr)
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
        print(f"Created organization {org['name']} ({org['id']})")
        if not cfg.get("active_org_id"):
            cfg["active_org_id"] = org["id"]
            save_config(cfg)
    elif action == "switch":
        cfg["active_org_id"] = args.org_id
        save_config(cfg)
        print(f"Switched active organization to {args.org_id}")


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
            print("Error: Missing --org-id and no active organization set.", file=sys.stderr)
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
        print(f"Created project {prj['name']} ({prj['id']})")
        if not cfg.get("active_project_id"):
            cfg["active_project_id"] = prj["id"]
            save_config(cfg)
    elif action == "switch":
        cfg["active_project_id"] = args.project_id
        save_config(cfg)
        print(f"Switched active project to {args.project_id}")


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
            print("Error: Specify --project or switch to an active project first.", file=sys.stderr)
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
        print(f"Created resource {res['name']} ({res['id']}) — Status: {res['status']}")
    elif action == "action":
        res = api_request("POST", f"/api/v1/resources/{args.resource_id}/actions", {"action": args.action_name}, api_url=args.api_url)
        print(f"Action '{args.action_name}' submitted for {args.resource_id}. Job ID: {res.get('job_id')}")
    elif action == "delete":
        api_request("DELETE", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        print(f"Deleted resource {args.resource_id}")


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
        print(f"Provisioned compute instance {res['name']} ({res['id']})")
        print(f"Status: {res['status']}, Spec: {args.cpu} vCPU / {args.ram} MB RAM / {args.image}")
    elif action in ("start", "stop", "restart", "delete"):
        if action == "delete":
            args.res_action = "delete"
            cmd_resource(args, cfg)
        else:
            args.res_action = "action"
            args.action_name = action
            cmd_resource(args, cfg)


def cmd_billing(args, cfg):
    action = args.billing_action
    if action == "account":
        res = api_request("GET", "/api/v1/billing/account", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            print("=== Aravanta Billing Account ===")
            print(f"Account ID:      {res.get('id')}")
            print(f"Organization ID: {res.get('organization_id')}")
            print(f"Status:          {res.get('status')}")
            print(f"Currency:        {res.get('currency')}")
            print(f"Current Balance: ₹{res.get('balance', 0):,.2f}")
            print(f"Credits:         ₹{res.get('credits', 0):,.2f}")
            print(f"Billing Cycle:   {res.get('billing_cycle')}")
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
                    r.get("status", "")
                ])
            print_table(headers, rows)
    elif action == "estimate":
        res = api_request("GET", "/api/v1/billing/estimate", api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            print("=== Live Metered Billing Estimate ===")
            print(f"Subtotal:       ₹{res.get('subtotal', 0):,.2f}")
            print(f"CGST (9%):      ₹{res.get('tax_cgst', 0):,.2f}")
            print(f"SGST (9%):      ₹{res.get('tax_sgst', 0):,.2f}")
            print(f"Total Estimate: ₹{res.get('total_estimated', 0):,.2f} ({res.get('currency', 'INR')})")
            print(f"Active Meters:  {res.get('active_unbilled_meters', 0)}")
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
                    inv.get("status", ""),
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
            print(f"Payment {res.get('status')}: Invoice {res.get('invoice_id')} settled for ₹{res.get('amount', 0):,.2f}")
    elif action == "close-period":
        res = api_request("POST", "/api/v1/billing/invoices/generate", {"payment_method": "CLI_AUTOPAY"}, api_url=args.api_url)
        if args.output == "json":
            print(json.dumps(res, indent=2))
        else:
            inv = res.get("invoice")
            if inv:
                print(f"Closed billing period. Finalized Invoice: {inv.get('id')} — Total: ₹{inv.get('total', 0):,.2f}")
            else:
                print(res.get("message", "No unbilled usage found."))


# ─── Parser Setup ────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--api-url", default=None, help="Override Aravanta API endpoint")
    common.add_argument("--output", choices=["table", "json", "yaml"], default="table", help="Output format")
    common.add_argument("--json", action="store_true", help="Shortcut for --output json")
    common.add_argument("--project", default=None, help="Target project ID")
    common.add_argument("--region", default=None, help="Target region")

    parser = argparse.ArgumentParser(
        prog="aravanta",
        description="Aravanta Cloud OS — First-Class Cloud Computing CLI",
        parents=[common]
    )
    parser.add_argument("--version", action="version", version=f"aravanta-cli {VERSION}")

    subparsers = parser.add_subparsers(dest="command")

    # 1. Auth
    p_auth = subparsers.add_parser("auth", help="Manage authentication and sessions", parents=[common])
    p_auth_sub = p_auth.add_subparsers(dest="auth_action", required=True)
    p_login = p_auth_sub.add_parser("login", help="Log in with email and password", parents=[common])
    p_login.add_argument("--email", help="Account email")
    p_login.add_argument("--password", help="Account password")
    p_tok = p_auth_sub.add_parser("token", help="Authenticate directly with a JWT token", parents=[common])
    p_tok.add_argument("token", nargs="?", help="JWT access token from web console")
    p_auth_sub.add_parser("logout", help="Log out of the current session", parents=[common])
    p_auth_sub.add_parser("whoami", help="Show the current authenticated identity", parents=[common])

    # 2. Top-level whoami & status
    subparsers.add_parser("whoami", help="Display active authenticated user and session", parents=[common])
    subparsers.add_parser("status", help="Inspect platform API connectivity and health", parents=[common])

    # 3. Org
    p_org = subparsers.add_parser("org", help="Manage organizations", parents=[common])
    p_org_sub = p_org.add_subparsers(dest="org_action", required=True)
    p_org_sub.add_parser("list", help="List organizations", parents=[common])
    p_org_sub.add_parser("ls", help="List organizations (alias)", parents=[common])
    p_org_create = p_org_sub.add_parser("create", help="Create an organization", parents=[common])
    p_org_create.add_argument("--name", required=True, help="Organization name")
    p_org_create.add_argument("--slug", help="Organization slug")
    p_org_sw = p_org_sub.add_parser("switch", help="Switch active organization", parents=[common])
    p_org_sw.add_argument("--org-id", required=True, help="Organization ID")

    # 4. Project
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

    # 5. Resource
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

    # 6. Compute
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

    # 7. Billing
    p_bill = subparsers.add_parser("billing", help="Inspect billing accounts, live estimates, meters, and invoices", parents=[common])
    p_bill_sub = p_bill.add_subparsers(dest="billing_action", required=True)
    p_bill_sub.add_parser("account", help="Inspect tenant billing account balance and status", parents=[common])
    p_bill_usage = p_bill_sub.add_parser("usage", help="List metered resource usage records", parents=[common])
    p_bill_usage.add_argument("--status", choices=["OPEN", "CLOSED", "BILLED"], help="Filter by meter status")
    p_bill_sub.add_parser("estimate", help="Get live cost estimate for current unbilled usage", parents=[common])
    p_bill_sub.add_parser("invoices", help="List finalized tenant invoices", parents=[common])
    p_bill_pay = p_bill_sub.add_parser("pay", help="Pay an invoice", parents=[common])
    p_bill_pay.add_argument("invoice_id", help="Invoice ID (e.g. INV-202609-ABCD)")
    p_bill_pay.add_argument("--provider", default="sandbox", help="Payment provider")
    p_bill_pay.add_argument("--method", default="CLI_CHECKOUT", help="Payment method name")
    p_bill_sub.add_parser("close-period", help="Close period and generate invoice (test mode)", parents=[common])

    # 8. Version
    subparsers.add_parser("version", help="Print CLI version", parents=[common])

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if getattr(args, "json", False):
        args.output = "json"

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "version":
        print(f"aravanta-cli {VERSION}")
        sys.exit(0)

    cfg = load_config()

    if args.command == "auth":
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
    elif args.command == "billing":
        cmd_billing(args, cfg)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
