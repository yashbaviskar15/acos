import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
_dir = Path(__file__).resolve().parent
if str(_dir) not in sys.path:
    sys.path.insert(0, str(_dir))

from app.main import app, handler, application

__all__ = ["app", "handler", "application"]
