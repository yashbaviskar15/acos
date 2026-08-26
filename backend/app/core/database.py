import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


def _resolve_database_url(url: str) -> str:
    """
    Return a database URL that is usable on the current platform.

    On serverless platforms such as Vercel the deployment filesystem is
    read-only except for /tmp. A relative SQLite path like
    'sqlite:///./aravanta_dev.db' therefore fails with "unable to open
    database file" — which previously crashed the whole app at import time
    (Base.metadata.create_all) and surfaced to the browser as an opaque 500
    with no CORS headers. For SQLite on such platforms we relocate the file
    into the writable /tmp directory.

    NOTE: SQLite under /tmp is EPHEMERAL — it does not persist across cold
    starts or between serverless instances. For durable data, set the
    DATABASE_URL environment variable to a managed Postgres connection string
    (e.g. postgresql://user:pass@host:5432/dbname).
    """
    is_serverless = bool(
        os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    )
    if url.startswith("sqlite") and ":memory:" not in url and is_serverless:
        return "sqlite:////tmp/aravanta_dev.db"
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
