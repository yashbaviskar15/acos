import os
from pathlib import Path
import pytest

TEST_DB_PATH = Path(__file__).parent / "aravanta_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
    from app.core.database import Base, engine
    Base.metadata.create_all(bind=engine)
    yield
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
