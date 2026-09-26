import os
import sys
from pathlib import Path

# Add backend directory and parent directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

cwd = Path.cwd()
if str(cwd / "backend") not in sys.path:
    sys.path.insert(0, str(cwd / "backend"))
if str(cwd) not in sys.path:
    sys.path.insert(0, str(cwd))

# Ensure production environment variables are present on serverless cold start
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"

if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Import FastAPI instance
try:
    from app.main import app
except Exception as exc:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="Aravanta Cold Start Diagnostic")
    _err_msg = str(exc)
    _err_trace = traceback.format_exc()

    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    def catch_all(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Backend import failure during serverless initialization",
                "path": path_name,
                "error": _err_msg,
                "traceback": _err_trace,
                "sys_path": sys.path,
                "cwd": str(Path.cwd()),
            }
        )

# Expose both app and handler for universal Vercel / ASGI compatibility
handler = app
application = app
