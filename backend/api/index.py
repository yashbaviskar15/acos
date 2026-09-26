import os
import sys
import json
import traceback
from pathlib import Path

# Add backend directory and root directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

for p in [str(backend_dir), str(root_dir), str(Path.cwd()), str(Path.cwd() / "backend")]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Ensure production environment variables are present on serverless cold start
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"

if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Import FastAPI instance with zero-dependency WSGI/ASGI fallback
try:
    from app.main import app
except Exception as exc:
    _err_msg = str(exc)
    _err_trace = traceback.format_exc()

    # Pure Python stdlib WSGI application (zero external dependencies)
    def app(environ, start_response):
        status = '500 Internal Server Error'
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Headers', '*'),
            ('Access-Control-Allow-Methods', '*')
        ]
        start_response(status, response_headers)
        body = json.dumps({
            "status": "error",
            "message": "Serverless Cold-Start Initialization Failure",
            "error": _err_msg,
            "traceback": _err_trace,
            "sys_path": sys.path,
            "cwd": str(Path.cwd()),
        }, indent=2).encode('utf-8')
        return [body]

handler = app
application = app
