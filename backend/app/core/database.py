import os
import re
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
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

    # Strip channel_binding query param if present (incompatible with PgBouncer pooler and psycopg2)
    if "channel_binding=" in url:
        url = re.sub(r"[?&]channel_binding=[^&]*", "", url)
        if "?" not in url and "&" in url:
            url = url.replace("&", "?", 1)

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
is_sqlite = DATABASE_URL.startswith("sqlite")
is_serverless_env = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


def _create_robust_engine(url: str, is_serverless: bool):
    """
    Build SQLAlchemy engine with driver auto-detection and safe SQLite fallback.
    Guarantees that module import NEVER crashes the serverless worker.
    """
    candidates = []
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        base_pg = url.replace("postgres://", "postgresql://", 1)
        # 1. psycopg2 dialect
        candidates.append(("postgresql+psycopg2", base_pg.replace("postgresql://", "postgresql+psycopg2://", 1)))
        # 2. psycopg (v3) dialect
        candidates.append(("postgresql+psycopg", base_pg.replace("postgresql://", "postgresql+psycopg://", 1)))
        # 3. default postgresql dialect
        candidates.append(("postgresql", base_pg))
    else:
        candidates.append(("sqlite", url))

    for dialect_name, candidate_url in candidates:
        try:
            if candidate_url.startswith("sqlite"):
                eng = create_engine(
                    candidate_url,
                    connect_args={"check_same_thread": False},
                    pool_pre_ping=True,
                )
            elif is_serverless:
                eng = create_engine(
                    candidate_url,
                    poolclass=NullPool,
                    connect_args={"connect_timeout": 5},
                )
            else:
                eng = create_engine(
                    candidate_url,
                    pool_pre_ping=True,
                    pool_size=5,
                    max_overflow=10,
                    pool_recycle=300,
                    pool_timeout=5,
                    connect_args={"connect_timeout": 5},
                )
            # Verify driver importability without executing network I/O
            if not candidate_url.startswith("sqlite"):
                eng.dialect.dbapi
            logger.info("Successfully initialized database engine with dialect '%s'", dialect_name)
            return eng
        except Exception as exc:
            logger.warning(
                "Driver/engine candidate '%s' failed: %s",
                dialect_name,
                exc,
            )
            continue

    # Absolute fallback so serverless worker always boots
    fallback_path = "/tmp/aravanta_fallback.db" if is_serverless else "./aravanta_dev.db"
    fallback_url = f"sqlite:///{fallback_path}"
    logger.critical(
        "All PostgreSQL drivers failed. Using fallback SQLite database at '%s'.",
        fallback_url,
    )
    return create_engine(
        fallback_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )


engine = _create_robust_engine(DATABASE_URL, is_serverless_env)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            db.close()
        except Exception:
            pass

