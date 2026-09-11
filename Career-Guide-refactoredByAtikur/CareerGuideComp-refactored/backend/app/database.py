import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "careerguide")

if not DB_USER:
    raise RuntimeError("DB_USER is missing from your .env file.")

# URL to connect directly to the MySQL server (without selecting DB)
SERVER_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/"
)

# URL to connect to the specific database
DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# connect_args={"use_pure": True} ensures compatibility with Python on Windows
# preventing C-extension crashes and supporting XAMPP out of the box.
engine = create_engine(
    DATABASE_URL,
    connect_args={"use_pure": True},
    pool_pre_ping=True,
    pool_recycle=280,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ensure_database_exists():
    """Ensure the target MySQL database exists; if not, create it."""
    try:
        server_engine = create_engine(
            SERVER_URL,
            connect_args={"use_pure": True},
            pool_pre_ping=True,
        )
        with server_engine.connect() as conn:
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
            conn.commit()
    except Exception as exc:
        print(f"[Database] Warning: Could not verify/create database `{DB_NAME}`: {exc}")


def init_db():
    """Auto-create database and all SQLAlchemy ORM tables."""
    ensure_database_exists()
    # Import models so they are registered with Base metadata
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print(f"[Database] Auto-database & table creation verified for `{DB_NAME}`.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()