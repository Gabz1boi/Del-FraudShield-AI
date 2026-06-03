from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20), default="user", index=True)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    input_type: Mapped[str] = mapped_column(String(20), index=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    score: Mapped[int] = mapped_column(Integer, index=True)
    level: Mapped[str] = mapped_column(String(20), index=True)
    reasons_json: Mapped[str] = mapped_column(Text)
    recommendations_json: Mapped[str] = mapped_column(Text)
    features_json: Mapped[str] = mapped_column(Text)
    case_category: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    external_source: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    external_status: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text)
    reply: Mapped[str] = mapped_column(Text)
    risk_score: Mapped[int] = mapped_column(Integer, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), index=True)
    case_category: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    ai_provider: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)


class ServiceDirectory(Base):
    __tablename__ = "service_directory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    case_types: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    action: Mapped[str] = mapped_column(Text)
    is_national: Mapped[int] = mapped_column(Integer, default=0, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
