from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=False)


def resolve_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "sqlite:///./fraudshield.db").strip()

    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    is_vercel = bool(os.getenv("VERCEL"))
    if is_vercel and raw_url.startswith("sqlite:///"):
        return f"sqlite:///{Path(tempfile.gettempdir()) / 'fraudshield.db'}"

    return raw_url


DATABASE_URL = resolve_database_url()

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()