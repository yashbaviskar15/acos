import os
import sys
import json
import traceback
import urllib.parse
from pathlib import Path

# Setup paths
_file_dir = Path(__file__).resolve().parent
for _p in [_file_dir, _file_dir / "backend", _file_dir.parent, _file_dir.parent / "backend"]:
    if _p.exists() and str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

# Environment fallbacks
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

_real_app = None
_boot_error = None
try:
    from app.main import app as _real_app
except BaseException as _exc:
    _boot_error = {
        "error": str(_exc),
        "traceback": traceback.format_exc().splitlines()
    }

async def app(scope, receive, send):
    scope_type = scope.get("type", "")

    # Handle ASGI Lifespan cleanly
    if scope_type == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                return

    # Handle HTTP requests
    if scope_type == "http":
        if _boot_error:
            body = json.dumps({
                "status": "BOOT_FAILURE",
                "error": _boot_error["error"],
                "traceback": _boot_error["traceback"]
            }).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                    (b"access-control-allow-origin", b"*")
                ]
            })
            await send({"type": "http.response.body", "body": body})
            return

        if "query_string" not in scope:
            scope["query_string"] = b""
        if "headers" not in scope:
            scope["headers"] = []

        # Extract real client path from __path__ query param or fallback
        raw_qs = scope.get("query_string", b"").decode("utf-8", "ignore")
        if "__path__=" in raw_qs:
            parsed_qs = urllib.parse.parse_qs(raw_qs, keep_blank_values=True)
            if "__path__" in parsed_qs:
                extracted_path = parsed_qs["__path__"][0]
                if not extracted_path.startswith("/"):
                    extracted_path = "/" + extracted_path
                scope["path"] = extracted_path
                remaining_params = []
                for k, vals in parsed_qs.items():
                    if k != "__path__":
                        for v in vals:
                            remaining_params.append(f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}")
                scope["query_string"] = "&".join(remaining_params).encode("ascii")
        else:
            raw_path = scope.get("path", "")
            for prefix in ("/backend", "/api/index.py", "/api/index"):
                if raw_path.startswith(prefix):
                    raw_path = raw_path[len(prefix):] or "/"
            scope["path"] = raw_path or "/"

        try:
            await _real_app(scope, receive, send)
        except BaseException as req_exc:
            tb = traceback.format_exc()
            body = json.dumps({
                "status": "RUNTIME_ERROR",
                "error": str(req_exc),
                "path": scope.get("path"),
                "traceback": tb.splitlines()
            }).encode("utf-8")
            try:
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(body)).encode("ascii")),
                        (b"access-control-allow-origin", b"*")
                    ]
                })
                await send({"type": "http.response.body", "body": body})
            except Exception:
                pass

handler = app
application = app
__all__ = ["app", "handler", "application"]
