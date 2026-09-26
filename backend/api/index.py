import os
import sys
import traceback
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
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
    print(f"FATAL: Startup exception in Vercel backend: {err_tb}", file=sys.stderr)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.api_route("/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def _catch_all(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Serverless Startup Failure",
                "detail": str(e),
                "traceback": err_tb,
                "sys_path": sys.path,
                "cwd": str(Path.cwd()),
            },
        )

# Export application for ASGI / WSGI runners (Vercel uses native ASGI runner for app)
application = app

