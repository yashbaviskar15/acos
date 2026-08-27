import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


def _resolve_database_url(url: str) -> str:
    """
    Resolve the database URL for the current environment.
    
    For local development with SQLite, use a persistent path in the project's data directory.
    For production (Vercel, AWS Lambda, etc.), a proper DATABASE_URL must be set to a 
    managed PostgreSQL database. SQLite is NOT suitable for serverless production 
    deployments because the filesystem is ephemeral.
    """
    is_serverless = bool(
        os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    )
    
    # If using SQLite with a relative path, convert to absolute path in data directory
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
        if is_serverless:
            # On serverless platforms, SQLite is not suitable - require PostgreSQL
            raise RuntimeError(
                "SQLite database detected on serverless platform (Vercel/AWS Lambda). "
                "Please set the DATABASE_URL environment variable to a managed PostgreSQL "
                "connection string (e.g., postgresql://user:pass@host:5432/dbname). "
                "SQLite does not work on read-only serverless filesystems."
            )
        # Extract the relative path (e.g., "./aravanta_dev.db" -> "aravanta_dev.db")
        rel_path = url.replace("sqlite:///", "")
        # Use a persistent data directory in the project root
        data_dir = Path(__file__).parent.parent.parent.parent / "data"
        data_dir.mkdir(exist_ok=True)
        abs_path = data_dir / rel_path.lstrip("./")
        return f"sqlite:///{abs_path}"
    
    # For absolute SQLite paths or other databases (PostgreSQL, etc.), use as-is
    # NOTE: On serverless platforms (Vercel, AWS Lambda), you MUST set DATABASE_URL
    # to a managed PostgreSQL connection string. SQLite will NOT persist across cold starts.
    if is_serverless and url.startswith("sqlite"):
        raise RuntimeError(
            "SQLite database detected on serverless platform (Vercel/AWS Lambda). "
            "Please set the DATABASE_URL environment variable to a managed PostgreSQL "
            "connection string (e.g., postgresql://user:pass@host:5432/dbname). "
            "SQLite does not work on read-only serverless filesystems."
        )
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
