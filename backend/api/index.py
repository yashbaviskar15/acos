import sys
from pathlib import Path

# Add backend root directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Wrap ASGI app with Mangum for AWS Lambda / Vercel Serverless execution.
# lifespan="off" prevents serverless cold-start timeouts on Lambda.
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = app

