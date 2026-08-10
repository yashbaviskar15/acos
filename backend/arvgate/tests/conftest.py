from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


SERVICE_ROOT = Path(__file__).resolve().parents[1]
SHARED_ROOT = SERVICE_ROOT.parents[0] / "shared"

for path in (str(SHARED_ROOT), str(SERVICE_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("ARVGATE_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'arvgate-test.db'}")
    monkeypatch.setenv("ARVGATE_JWT_SECRET_KEY", "test-secret")

    from app.main import create_app

    with TestClient(create_app()) as test_client:
        yield test_client
