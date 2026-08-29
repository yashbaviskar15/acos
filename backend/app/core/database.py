import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


def _resolve_database_url(url: str) -> str:
    """
    Resolve the database URL for the current environment.

    - Serverless (Vercel / AWS Lambda): On serverless platforms, the root filesystem
      is read-only except for /tmp. If a managed PostgreSQL DATABASE_URL is provided,
      it is used. Otherwise, SQLite is safely placed in /tmp/aravanta_dev.db.
    - Local / Docker: SQLite persists to the local data directory or relative path.
    - URL normalization: Upgrades legacy postgres:// prefixes to postgresql://.
    """
    if not url:
        url = "sqlite:///./aravanta_dev.db"

    # Normalize legacy postgres:// scheme to postgresql:// for SQLAlchemy 2.x
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    is_serverless = bool(
        os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    )

    if is_serverless:
        if url.startswith("sqlite"):
            # Ensure SQLite writes to writable /tmp directory on serverless
            return "sqlite:////tmp/aravanta_dev.db"
        return url

    # Local development: persist relative SQLite path in data directory
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////") and ":memory:" not in url:
        rel_path = url.replace("sqlite:///", "").lstrip("./")
        data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data"
        try:
            data_dir.mkdir(parents=True, exist_ok=True)
            abs_path = data_dir / rel_path
            return f"sqlite:///{abs_path.as_posix()}"
        except Exception:
            return f"sqlite:///./{rel_path}"

    return url


DATABASE_URL = _resolve_database_url(settings.DATABASE_URL)

# SQLite requires check_same_thread=False when used across FastAPI's threadpool.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
