"""
Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import os
from typing import Generator, Optional

# Database URL from environment or default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/analitix_ai"
)

# Create engine (lazy connection - won't connect until first use)
engine: Optional[object] = None
SessionLocal: Optional[sessionmaker] = None

try:
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False,  # Set to True for SQL logging
        connect_args={"connect_timeout": 5}  # 5 second timeout
    )
    # Session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("[OK] Database connection configured")
except Exception as e:
    print(f"[WARN] Database not available: {e}")
    print("[INFO] Using in-memory storage (fallback mode)")
    engine = None
    SessionLocal = None

def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    if SessionLocal is None:
        raise Exception("Database not configured. Using in-memory storage.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    if engine is None:
        print("[WARN] Database not available. Cannot initialize tables.")
        return
    try:
        from app.models.database import Base
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created successfully")
    except Exception as e:
        print(f"[ERROR] Error initializing database: {e}")
        print("[INFO] Application will use in-memory storage")

def drop_db():
    """Drop all tables (use with caution!)"""
    if engine is None:
        print("[WARN] Database not available")
        return
    try:
        from app.models.database import Base
        Base.metadata.drop_all(bind=engine)
        print("[WARN] All database tables dropped")
    except Exception as e:
        print(f"[ERROR] Error dropping tables: {e}")

