import os
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("aravanta.database")


def _resolve_database_url(url: str) -> str:
    """
    Resolve the database URL for the current environment.

    - Production / Serverless: MUST use an external PostgreSQL database
      (Neon, Supabase, etc.) via the DATABASE_URL environment variable.
    - Local development: Falls back to SQLite in the data/ directory.
    - URL normalization: Upgrades legacy postgres:// to postgresql://.
    """
    if not url:
        url = ""

    # Normalize legacy postgres:// scheme to postgresql:// for SQLAlchemy 2.x
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    is_serverless = bool(
        os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    )

    if is_serverless:
        if url and not url.startswith("sqlite"):
            # Production PostgreSQL — use as-is
            logger.info("Using external PostgreSQL database on serverless.")
            return url
        # No DATABASE_URL or it's SQLite — WARN but use /tmp SQLite as last resort
        logger.warning(
            "CRITICAL: No persistent DATABASE_URL configured on serverless! "
            "Data WILL be lost on cold starts. Set DATABASE_URL to a PostgreSQL connection string."
        )
        return "sqlite:////tmp/aravanta_dev.db"

    # Local development: persist SQLite in data/ directory
    if not url or url.startswith("sqlite"):
        if not url:
            url = "sqlite:///./aravanta_dev.db"
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

    # Local PostgreSQL or other database
    return url


DATABASE_URL = _resolve_database_url(settings.DATABASE_URL)

# Configure engine based on database type
is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    # SQLite requires check_same_thread=False when used across FastAPI's threadpool.
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    # PostgreSQL: proper connection pooling for serverless
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,  # Recycle connections every 5 minutes
        pool_timeout=30,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

logger.info("Database engine created: %s", "PostgreSQL" if not is_sqlite else "SQLite")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
