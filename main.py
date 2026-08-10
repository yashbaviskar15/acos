import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT / "backend"

sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402, F401
