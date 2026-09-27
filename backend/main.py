import os
import sys
from pathlib import Path

_dir = Path(__file__).resolve().parent
if str(_dir) not in sys.path:
    sys.path.insert(0, str(_dir))

if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "aravanta_prod_live_sec_key_9f82b71e84a20c4e8d35f76a1b94c032e578"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_rJL0kIVv7Xuj@ep-small-pond-a5i9ohyh-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    from app.main import app
    handler = app
    application = app
except Exception as exc:
    import traceback
    tb = traceback.format_exc()
    error_msg = str(exc)

    async def app(scope, receive, send):
        if scope["type"] == "http":
            import json
            payload = json.dumps({
                "status": "BOOT_FAILURE",
                "error": error_msg,
                "traceback": tb.splitlines(),
            }).encode("utf-8")
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(payload)).encode("ascii")),
                    (b"access-control-allow-origin", b"*"),
                ],
            })
            await send({
                "type": "http.response.body",
                "body": payload,
            })

    handler = app
    application = app

__all__ = ["app", "handler", "application"]
