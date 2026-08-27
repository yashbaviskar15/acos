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
    # If using SQLite with a relative path, convert to absolute path in data directory
    if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
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
