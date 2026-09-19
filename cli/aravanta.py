#!/usr/bin/env python3
"""
Aravanta Cloud OS CLI (`aravanta`)
First-class, API-first command-line interface for managing Aravanta Cloud infrastructure.
Communicates strictly via REST API; never connects to the database directly.
"""
import sys
import os
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
    if not CONFIG_FILE.exists():
        return {
            "api_url": default_url,
            "token": None,
            "active_org_id": None,
            "active_project_id": None,
            "user_email": None
        }
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            if not cfg.get("api_url") or "localhost" in cfg.get("api_url", ""):
                cfg["api_url"] = default_url
            return cfg
    except Exception:
        return {"api_url": default_url, "token": None}


def save_config(cfg: Dict[str, Any]) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


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

    data_bytes = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
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
        sys.exit(1)
    except urllib.error.URLError as err:
        print(f"Connection Error: Unable to reach Aravanta API at {base_url}. Details: {err.reason}", file=sys.stderr)
        sys.exit(1)


def format_output(data: Any, format_type: str = "table") -> None:
    if format_type == "json":
        print(json.dumps(data, indent=2))
        return

    if format_type == "yaml":
        # Simple YAML representation without requiring third-party PyYAML
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
            # Print tabular format
            keys = [k for k in data[0].keys() if k not in ("spec", "metadata", "tags", "env_vars", "result")]
            # Calculate column widths
            col_widths = {k: max(len(k), max(len(str(row.get(k, ""))) for row in data)) for k in keys}
            # Header
            header_str = "  ".join(f"{k.upper():<{col_widths[k]}}" for k in keys)
            print(header_str)
            print("-" * len(header_str))
            # Rows
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
    action = args.auth_action
    if action == "login":
        email = args.email or input("Email: ")
        import getpass
        password = args.password or getpass.getpass("Password: ")
        resp = api_request("POST", "/api/v1/auth/login", {"email": email, "password": password}, api_url=args.api_url)
        token = resp.get("access_token")
        cfg["token"] = token
        cfg["user_email"] = email

        # Automatically fetch organizations and pick first active org/project
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
        print(f"Successfully logged in as {email}")
        if cfg.get("active_org_id"):
            print(f"Active Org: {cfg['active_org_id']}, Project: {cfg.get('active_project_id')}")

    elif action == "logout":
        cfg["token"] = None
        cfg["user_email"] = None
        save_config(cfg)
        print("Logged out successfully.")

    elif action == "whoami":
        if not cfg.get("token"):
            print("Not logged in. Run 'aravanta auth login'.", file=sys.stderr)
            sys.exit(1)
        resp = api_request("GET", "/api/v1/auth/me", api_url=args.api_url)
        resp["active_org_id"] = cfg.get("active_org_id")
        resp["active_project_id"] = cfg.get("active_project_id")
        format_output(resp, args.output)


def cmd_org(args, cfg):
    action = args.org_action
    if action == "list":
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
    if action == "list":
        org_id = args.org_id or cfg.get("active_org_id")
        if not org_id:
            orgs = api_request("GET", "/api/v1/organizations", api_url=args.api_url)
            if orgs:
                org_id = orgs[0]["id"]
        prjs = api_request("GET", f"/api/v1/projects?organization_id={org_id}", api_url=args.api_url)
        for p in prjs:
            if p.get("id") == cfg.get("active_project_id"):
                p["active"] = "*"
        format_output(prjs, args.output)
    elif action == "create":
        org_id = args.org_id or cfg.get("active_org_id")
        if not org_id:
            print("Error: No active organization. Run 'aravanta org switch' or specify --org-id.", file=sys.stderr)
            sys.exit(1)
        prj = api_request("POST", "/api/v1/projects", {
            "organization_id": org_id,
            "name": args.name,
            "region": args.region,
            "description": args.description or ""
        }, api_url=args.api_url)
        print(f"Created project {prj['name']} ({prj['id']}) in region {prj['region']}")
        cfg["active_project_id"] = prj["id"]
        save_config(cfg)
    elif action == "switch":
        cfg["active_project_id"] = args.project_id
        save_config(cfg)
        print(f"Switched active project to {args.project_id}")


def cmd_resource(args, cfg):
    action = args.res_action
    if action == "list":
        prj_id = args.project or cfg.get("active_project_id")
        org_id = cfg.get("active_org_id")
        query_params = []
        if prj_id:
            query_params.append(f"project_id={prj_id}")
        if org_id:
            query_params.append(f"organization_id={org_id}")
        if args.type:
            query_params.append(f"type={args.type}")
        if args.status:
            query_params.append(f"status={args.status}")
        q = f"?{'&'.join(query_params)}" if query_params else ""
        resources = api_request("GET", f"/api/v1/resources{q}", api_url=args.api_url)
        format_output(resources, args.output)
    elif action == "get":
        res = api_request("GET", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        format_output(res, args.output)
    elif action == "create":
        prj_id = args.project or cfg.get("active_project_id")
        if not prj_id:
            print("Error: Specify --project or run 'aravanta project switch'.", file=sys.stderr)
            sys.exit(1)
        spec = {}
        if args.spec:
            try:
                spec = json.loads(args.spec)
            except Exception:
                print("Error: --spec must be valid JSON.", file=sys.stderr)
                sys.exit(1)
        res = api_request("POST", "/api/v1/resources", {
            "name": args.name,
            "type": args.type,
            "project_id": prj_id,
            "region": args.region,
            "spec": spec
        }, api_url=args.api_url)
        print(f"Resource created: {res['name']} [{res['type']}] - Status: {res['status']}")
        format_output(res, args.output)
    elif action == "action":
        res = api_request("POST", f"/api/v1/resources/{args.resource_id}/actions", {"action": args.action_name}, api_url=args.api_url)
        print(f"Resource {args.resource_id} action '{args.action_name}' completed. New status: {res['status']}")
    elif action == "delete":
        res = api_request("DELETE", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        print(f"Resource {args.resource_id} deleted successfully.")


def cmd_compute(args, cfg):
    action = args.compute_action
    prj_id = args.project or cfg.get("active_project_id")
    if action == "list":
        args.res_action = "list"
        args.type = "compute"
        args.status = None
        cmd_resource(args, cfg)
    elif action == "get":
        args.res_action = "get"
        cmd_resource(args, cfg)
    elif action == "create":
        if not prj_id:
            print("Error: Specify --project or run 'aravanta project switch'.", file=sys.stderr)
            sys.exit(1)
        spec = {
            "cpu": args.cpu,
            "ram_mb": args.ram,
            "os_image": args.image
        }
        res = api_request("POST", "/api/v1/resources", {
            "name": args.name,
            "type": "compute",
            "project_id": prj_id,
            "region": args.region,
            "spec": spec
        }, api_url=args.api_url)
        print(f"Compute instance created: {res['name']} ({res['id']}) - IP: {res.get('metadata', {}).get('private_ip')}")
        format_output(res, args.output)
    elif action in ("start", "stop", "restart", "terminate"):
        action_name = "start" if action == "start" else ("stop" if action == "stop" else "terminate")
        res = api_request("POST", f"/api/v1/resources/{args.resource_id}/actions", {"action": action_name}, api_url=args.api_url)
        print(f"Compute instance {args.resource_id} status: {res['status']}")
    elif action == "delete":
        res = api_request("DELETE", f"/api/v1/resources/{args.resource_id}", api_url=args.api_url)
        print(f"Compute instance {args.resource_id} deleted.")


# ─── Main CLI Parser ─────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--api-url", default=None, help="Override Aravanta API endpoint")
    common.add_argument("--output", choices=["table", "json", "yaml"], default="table", help="Output format")
    common.add_argument("--json", action="store_true", help="Shortcut for --output json")
    common.add_argument("--project", default=None, help="Target project ID")
    common.add_argument("--region", default="arv-us-east-1", help="Target region")

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
    p_login = p_auth_sub.add_parser("login", help="Authenticate with Aravanta Cloud OS", parents=[common])
    p_login.add_argument("--email", help="Account email")
    p_login.add_argument("--password", help="Account password")
    p_auth_sub.add_parser("logout", help="Clear current session credentials", parents=[common])
    p_auth_sub.add_parser("whoami", help="Display active authenticated user and scope", parents=[common])

    # 2. Org
    p_org = subparsers.add_parser("org", help="Manage organizations", parents=[common])
    p_org_sub = p_org.add_subparsers(dest="org_action", required=True)
    p_org_sub.add_parser("list", help="List organizations", parents=[common])
    p_org_create = p_org_sub.add_parser("create", help="Create an organization", parents=[common])
    p_org_create.add_argument("--name", required=True, help="Organization name")
    p_org_create.add_argument("--slug", help="Organization unique slug")
    p_org_sw = p_org_sub.add_parser("switch", help="Switch active organization", parents=[common])
    p_org_sw.add_argument("--org-id", required=True, help="Organization ID")

    # 3. Project
    p_prj = subparsers.add_parser("project", help="Manage projects", parents=[common])
    p_prj_sub = p_prj.add_subparsers(dest="project_action", required=True)
    p_prj_list = p_prj_sub.add_parser("list", help="List projects", parents=[common])
    p_prj_list.add_argument("--org-id", help="Organization ID")
    p_prj_create = p_prj_sub.add_parser("create", help="Create a project", parents=[common])
    p_prj_create.add_argument("--name", required=True, help="Project name")
    p_prj_create.add_argument("--org-id", help="Parent organization ID")
    p_prj_create.add_argument("--description", help="Project description")
    p_prj_sw = p_prj_sub.add_parser("switch", help="Switch active project", parents=[common])
    p_prj_sw.add_argument("--project-id", required=True, help="Project ID")

    # 4. Resource
    p_res = subparsers.add_parser("resource", help="Manage unified cloud resources", parents=[common])
    p_res_sub = p_res.add_subparsers(dest="res_action", required=True)
    p_res_list = p_res_sub.add_parser("list", help="List cloud resources", parents=[common])
    p_res_list.add_argument("--type", help="Filter by type (compute, storage, database, etc.)")
    p_res_list.add_argument("--status", help="Filter by status")
    p_res_get = p_res_sub.add_parser("get", help="Get resource details", parents=[common])
    p_res_get.add_argument("resource_id", help="Resource ID")
    p_res_create = p_res_sub.add_parser("create", help="Create a resource", parents=[common])
    p_res_create.add_argument("--name", required=True, help="Resource name")
    p_res_create.add_argument("--type", required=True, help="compute, storage, database, etc.")
    p_res_create.add_argument("--spec", help="Resource specification as JSON string")
    p_res_act = p_res_sub.add_parser("action", help="Perform lifecycle action on a resource", parents=[common])
    p_res_act.add_argument("resource_id", help="Resource ID")
    p_res_act.add_argument("action_name", choices=["start", "stop", "terminate"], help="Action to perform")
    p_res_del = p_res_sub.add_parser("delete", help="Delete a resource", parents=[common])
    p_res_del.add_argument("resource_id", help="Resource ID")

    # 5. Compute
    p_comp = subparsers.add_parser("compute", help="Manage compute instances and workloads", parents=[common])
    p_comp_sub = p_comp.add_subparsers(dest="compute_action", required=True)
    p_comp_sub.add_parser("list", help="List compute instances", parents=[common])
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

    # 6. Version
    subparsers.add_parser("version", help="Print CLI version", parents=[common])

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.json:
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
    elif args.command == "org":
        cmd_org(args, cfg)
    elif args.command == "project":
        cmd_project(args, cfg)
    elif args.command == "resource":
        cmd_resource(args, cfg)
    elif args.command == "compute":
        cmd_compute(args, cfg)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
