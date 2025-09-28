from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from shared.config import settings
import os

# Configure SSL for Google Cloud SQL if needed
connect_args = {}
if "sqlite" not in settings.DATABASE_URL:
    # For PostgreSQL (including Google Cloud SQL)
    connect_args = {
        "sslmode": "require" if "cloudsql" in settings.DATABASE_URL or "googleapis" in settings.DATABASE_URL else "prefer"
    }

engine = create_engine(
    settings.DATABASE_URL, 
    # echo=True,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# If you want to create tables automatically (not recommended for production)
def create_db_and_tables():
    Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
