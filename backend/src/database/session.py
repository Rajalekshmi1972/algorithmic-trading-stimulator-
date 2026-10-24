from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from src.config import get_settings

class Base(DeclarativeBase):
    pass

s = get_settings()
engine = create_engine(
    s.database_url,
    connect_args={"check_same_thread": False} if s.database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def init_db():
    from src.models import entities
    Base.metadata.create_all(bind=engine)

    # Automatic schema migrations for existing SQLite databases
    if s.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                cols = {row[1] for row in res}
                if "password_hash" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT ''"))
                if "is_verified" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
                if "updated_at" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
                conn.commit()
            except Exception:
                pass

            try:
                res = conn.execute(text("PRAGMA table_info(backtests)")).fetchall()
                cols = {row[1] for row in res}
                if "user_id" not in cols:
                    conn.execute(text("ALTER TABLE backtests ADD COLUMN user_id INTEGER"))
                if "name" not in cols:
                    conn.execute(text("ALTER TABLE backtests ADD COLUMN name VARCHAR(150)"))
                conn.commit()
            except Exception:
                pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
