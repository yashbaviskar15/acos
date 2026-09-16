import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / 'backend'
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure a secure SECRET_KEY is set in serverless runtime if omitted from Vercel dashboard
curr_secret = os.environ.get("SECRET_KEY", "").strip()
if not curr_secret or len(curr_secret) < 32 or curr_secret == "aravanta_super_secret_jwt_key_change_in_production_2026":
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"

from app.main import app

# Dual-compatible handler supporting both ASGI (scope, receive, send) and Lambda (event, context)
def handler(event_or_scope, context_or_receive=None, send=None):
    if send is not None:
        return app(event_or_scope, context_or_receive, send)
    try:
        from mangum import Mangum
        _mangum = Mangum(app, lifespan="off")
        return _mangum(event_or_scope, context_or_receive)
    except Exception:
        return app(event_or_scope, context_or_receive, send)
