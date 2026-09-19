import os
import pytest
import secrets
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test_" + secrets.token_urlsafe(64)
os.environ["ENVIRONMENT"] = "local"
os.environ.pop("MFA_DEV_MASTER_CODES", None)

from app.core.database import Base, get_db
from app.main import app as fastapi_app

import app.services.arvgate.models
import app.control_plane.models
import app.core.cloud_models
import app.services.arvcommunity.models
import app.services.arvcostiq.models
import app.services.arvguard.models
import app.services.arvpulse.models
import app.services.arvsandbox.models
import app.billing.models

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=test_engine)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def _per_test_isolation(setup_test_db):
    from app.core.rate_limit import clear_rate_limits
    clear_rate_limits()
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            if table.name not in {"sqlite_master"}:
                try:
                    db.execute(table.delete())
                except Exception:
                    pass
        db.commit()
    finally:
        db.close()
    yield

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db
