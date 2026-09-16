import os
import sys
import json
import traceback
from pathlib import Path

# Add backend root directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

cwd = Path.cwd()
if str(cwd / 'backend') not in sys.path:
    sys.path.insert(0, str(cwd / 'backend'))
if str(cwd) not in sys.path:
    sys.path.insert(0, str(cwd))

# Ensure a secure SECRET_KEY is set in serverless runtime if omitted from Vercel dashboard
curr_secret = os.environ.get("SECRET_KEY", "").strip()
if not curr_secret or len(curr_secret) < 32 or curr_secret == "aravanta_super_secret_jwt_key_change_in_production_2026":
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"

try:
    from app.main import app
    _import_err = None
except Exception as e:
    app = None
    _import_err = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "sys_path": sys.path,
        "cwd": str(Path.cwd()),
        "cwd_files": [str(p.name) for p in Path.cwd().iterdir()] if Path.cwd().exists() else [],
    }

def handler(event_or_scope, context_or_receive=None, send=None):
    if _import_err is not None:
        body = json.dumps(_import_err, indent=2).encode("utf-8")
        if send is not None:
            async def _send_err():
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode("utf-8"))],
                })
                await send({"type": "http.response.body", "body": body})
            return _send_err()
        else:
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(_import_err),
            }
    
    if send is not None:
        return app(event_or_scope, context_or_receive, send)
    try:
        from mangum import Mangum
        _mangum = Mangum(app, lifespan="off")
        return _mangum(event_or_scope, context_or_receive)
    except Exception:
        return app(event_or_scope, context_or_receive, send)

