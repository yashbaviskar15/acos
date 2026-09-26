import os
import sys
import json
import traceback
from pathlib import Path

# Add backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

cwd = Path.cwd()
if str(cwd / "backend") not in sys.path:
    sys.path.insert(0, str(cwd / "backend"))
if str(cwd) not in sys.path:
    sys.path.insert(0, str(cwd))

# Ensure a secure SECRET_KEY is set in serverless runtime if omitted from Vercel dashboard
curr_secret = os.environ.get("SECRET_KEY", "").strip()
if not curr_secret or len(curr_secret) < 32 or curr_secret == "aravanta_super_secret_jwt_key_change_in_production_2026":
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"

# Import FastAPI ASGI application
try:
    from app.main import app
except Exception as e:
    err_tb = traceback.format_exc()
    async def app(scope, receive, send):
        if scope["type"] == "http":
            body = json.dumps({
                "status": "error",
                "message": "Serverless Startup Failure",
                "detail": str(e),
                "traceback": err_tb,
                "sys_path": sys.path,
                "cwd": str(Path.cwd()),
            }, indent=2).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    [b"content-type", b"application/json"],
                    [b"access-control-allow-origin", b"*"],
                    [b"content-length", str(len(body)).encode("utf-8")]
                ]
            })
            await send({
                "type": "http.response.body",
                "body": body,
                "more_body": False
            })

# Export application for ASGI runners (Vercel uses native ASGI runner for app)
application = app


