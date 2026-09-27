import os
import sys
import json
import traceback
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

        headers = dict(scope.get("headers", []))
        matched = (
            headers.get(b"x-forwarded-url")
            or headers.get(b"x-forwarded-uri")
            or headers.get(b"x-original-url")
            or headers.get(b"x-invoke-path")
            or headers.get(b"x-real-path")
            or headers.get(b"x-vercel-sc-path")
            or headers.get(b"x-matched-path")
            or headers.get(b"x-vercel-rewrite-path")
            or b""
        ).decode("utf-8", errors="ignore")

        # Strip query params if header contains full URL or query
        if "?" in matched:
            matched = matched.split("?", 1)[0]
        if matched.startswith("http://") or matched.startswith("https://"):
            from urllib.parse import urlparse
            matched = urlparse(matched).path

        if matched and matched not in ("/api", "/api/", "/api/index", "/api/index/", "/api/index.py"):
            raw_path = matched
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
                "path": raw_path,
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
