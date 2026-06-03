from __future__ import annotations

import json
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, func, select, text
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, get_db, init_db
from app.fraud_pipeline import analyze_fraud, analyze_image_bytes, chatbot_reply
from app.models import AnalysisLog, ChatMessage, UserProfile
from app.schemas import (
    AdminMetrics,
    AnalysisItem,
    AnalyzeRequest,
    ChatItem,
    ChatRequest,
    ChatResponse,
    FraudAnalysisResult,
    NearestServicesRequest,
    NearestServicesResponse,
    RealtimeCasesResponse,
    CategoryStat,
    LiveCaseItem,
    UserHistoryResponse,
    UserRegisterRequest,
    UserRegisterResponse,
)
from app.service_finder import find_nearest_services, seed_service_directory


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip())


def admin_emails() -> set[str]:
    raw = os.getenv("ADMIN_EMAILS", "admin@fraudshield.local").strip()
    return {normalize_email(item) for item in raw.split(",") if item.strip()}


def role_for_email(email: str) -> str:
    return "admin" if normalize_email(email) in admin_emails() else "user"


def ensure_sqlite_columns() -> None:
    """Menambah kolom baru pada database SQLite lama tanpa perlu migrasi Alembic."""
    if not str(engine.url).startswith("sqlite"):
        return

    missing_columns = {
        "analysis_logs": {
            "case_category": "VARCHAR(80)",
            "external_source": "VARCHAR(80)",
            "external_status": "VARCHAR(80)",
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "city": "VARCHAR(120)",
        },
        "chat_messages": {
            "case_category": "VARCHAR(80)",
            "ai_provider": "VARCHAR(80)",
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "city": "VARCHAR(120)",
        },
        "user_profiles": {
            "role": "VARCHAR(20)",
            "status": "VARCHAR(20)",
            "updated_at": "DATETIME",
        },
    }
    with engine.begin() as conn:
        for table_name, columns in missing_columns.items():
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table_name})"))}
            for column_name, column_type in columns.items():
                if column_name not in existing:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    ensure_sqlite_columns()
    db = SessionLocal()
    try:
        seed_service_directory(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Del-FraudShield AI Core Service", version="3.0.0", lifespan=lifespan)

allowed_origins = [
    origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "fraudshield-core-service",
        "version": "3.0.0",
        "virustotal_configured": bool(os.getenv("VIRUSTOTAL_API_KEY", "").strip()),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
        "google_places_configured": bool(os.getenv("GOOGLE_PLACES_API_KEY", "").strip()),
    }


@app.post("/users/register", response_model=UserRegisterResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)) -> UserRegisterResponse:
    email = normalize_email(payload.email)
    name = normalize_name(payload.name)

    if len(name) < 3:
        raise HTTPException(status_code=400, detail="Nama pengguna minimal 3 karakter.")
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Format email belum valid.")

    existing_by_email = db.scalar(select(UserProfile).where(UserProfile.email == email))
    requested_role = role_for_email(email)

    if existing_by_email:
        if existing_by_email.name.lower() != name.lower():
            name_taken = db.scalar(select(UserProfile).where(func.lower(UserProfile.name) == name.lower()))
            if name_taken and name_taken.email != email:
                raise HTTPException(status_code=409, detail="Nama pengguna sudah digunakan oleh akun lain. Gunakan nama yang berbeda.")
            existing_by_email.name = name
        existing_by_email.role = requested_role
        existing_by_email.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_by_email)
        return UserRegisterResponse(
            id=existing_by_email.id,
            name=existing_by_email.name,
            email=existing_by_email.email,
            role="admin" if existing_by_email.role == "admin" else "user",
            is_new=False,
        )

    existing_by_name = db.scalar(select(UserProfile).where(func.lower(UserProfile.name) == name.lower()))
    if existing_by_name:
        raise HTTPException(status_code=409, detail="Nama pengguna sudah digunakan oleh akun lain. Gunakan nama yang berbeda.")

    user = UserProfile(name=name, email=email, role=requested_role, status="active")
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRegisterResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role="admin" if user.role == "admin" else "user",
        is_new=True,
    )


def store_analysis(db: Session, payload: AnalyzeRequest, result: FraudAnalysisResult) -> FraudAnalysisResult:
    log = AnalysisLog(
        input_type=result.type,
        user_email=normalize_email(payload.user_email) if payload.user_email else None,
        title=result.title,
        content=payload.content,
        score=result.score,
        level=result.level,
        reasons_json=json.dumps(result.reasons, ensure_ascii=False),
        recommendations_json=json.dumps(result.recommendations, ensure_ascii=False),
        features_json=json.dumps(result.features, ensure_ascii=False),
        case_category=result.case_category,
        external_source=result.external_source,
        external_status=result.external_status,
        latitude=payload.latitude,
        longitude=payload.longitude,
        city=payload.city,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    result.log_id = log.id
    return result


@app.post("/analyze", response_model=FraudAnalysisResult)
def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> FraudAnalysisResult:
    result = analyze_fraud(payload.type, payload.content)
    return store_analysis(db, payload, result)


@app.post("/analyze-image-upload", response_model=FraudAnalysisResult)
async def analyze_image_upload(
    image: UploadFile = File(...),
    user_email: str | None = Form(default=None),
    context: str | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    city: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> FraudAnalysisResult:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar.")

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="File gambar kosong.")
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ukuran gambar maksimal 8 MB.")

    try:
        result, extracted_text = analyze_image_bytes(
            image_bytes=data,
            mime_type=image.content_type,
            filename=image.filename or "screenshot",
            context=context or "",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    payload = AnalyzeRequest(
        type="image",
        content=(context or "").strip() + "\n\n" + extracted_text,
        user_email=user_email,
        latitude=latitude,
        longitude=longitude,
        city=city,
    )
    return store_analysis(db, payload, result)


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    try:
        reply, analysis, signals, provider = chatbot_reply(payload.message)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    chat_log = ChatMessage(
        user_email=normalize_email(payload.user_email) if payload.user_email else None,
        message=payload.message,
        reply=reply,
        risk_score=analysis.score,
        risk_level=analysis.level,
        case_category=analysis.case_category,
        ai_provider=provider,
        latitude=payload.latitude,
        longitude=payload.longitude,
        city=payload.city,
    )
    db.add(chat_log)
    db.commit()
    db.refresh(chat_log)

    return ChatResponse(
        reply=reply,
        risk_score=analysis.score,
        risk_level=analysis.level,
        signals=signals,
        ai_provider=provider,
        case_category=analysis.case_category,
        chat_id=chat_log.id,
    )


def to_analysis_item(row: AnalysisLog) -> AnalysisItem:
    return AnalysisItem(
        id=row.id,
        created_at=row.created_at,
        input_type=row.input_type,
        title=row.title,
        score=row.score,
        level=row.level,
        user_email=row.user_email,
        case_category=row.case_category,
        external_source=row.external_source,
        external_status=row.external_status,
        city=row.city,
    )


def to_chat_item(row: ChatMessage) -> ChatItem:
    return ChatItem(
        id=row.id,
        created_at=row.created_at,
        message=row.message,
        reply=row.reply,
        risk_score=row.risk_score,
        risk_level=row.risk_level,
        case_category=row.case_category,
    )


@app.get("/users/history", response_model=UserHistoryResponse)
def user_history(email: str = Query(..., min_length=5), db: Session = Depends(get_db)) -> UserHistoryResponse:
    user_email = normalize_email(email)
    total_analyses = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.user_email == user_email)) or 0
    total_chats = db.scalar(select(func.count()).select_from(ChatMessage).where(ChatMessage.user_email == user_email)) or 0
    high_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.user_email == user_email, AnalysisLog.level == "Tinggi")) or 0
    medium_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.user_email == user_email, AnalysisLog.level == "Sedang")) or 0
    low_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.user_email == user_email, AnalysisLog.level == "Rendah")) or 0
    average_score = db.scalar(select(func.avg(AnalysisLog.score)).where(AnalysisLog.user_email == user_email)) or 0.0
    recent_analyses = db.scalars(select(AnalysisLog).where(AnalysisLog.user_email == user_email).order_by(AnalysisLog.created_at.desc()).limit(8)).all()
    recent_chats = db.scalars(select(ChatMessage).where(ChatMessage.user_email == user_email).order_by(ChatMessage.created_at.desc()).limit(5)).all()
    return UserHistoryResponse(
        user_email=user_email,
        total_analyses=total_analyses,
        total_chats=total_chats,
        high_risk_count=high_risk_count,
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count,
        average_score=round(float(average_score), 2),
        recent_analyses=[to_analysis_item(row) for row in recent_analyses],
        recent_chats=[to_chat_item(row) for row in recent_chats],
    )


@app.get("/admin/analyses", response_model=list[AnalysisItem])
def list_analyses(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)) -> list[AnalysisItem]:
    rows = db.scalars(select(AnalysisLog).order_by(AnalysisLog.created_at.desc()).limit(limit)).all()
    return [to_analysis_item(row) for row in rows]


@app.get("/admin/metrics", response_model=AdminMetrics)
def metrics(db: Session = Depends(get_db)) -> AdminMetrics:
    total_analyses = db.scalar(select(func.count()).select_from(AnalysisLog)) or 0
    total_chats = db.scalar(select(func.count()).select_from(ChatMessage)) or 0
    high_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.level == "Tinggi")) or 0
    medium_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.level == "Sedang")) or 0
    low_risk_count = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.level == "Rendah")) or 0
    average_score = db.scalar(select(func.avg(AnalysisLog.score))) or 0.0
    recent = list_analyses(limit=8, db=db)

    return AdminMetrics(
        total_analyses=total_analyses,
        total_chats=total_chats,
        high_risk_count=high_risk_count,
        medium_risk_count=medium_risk_count,
        low_risk_count=low_risk_count,
        average_score=round(float(average_score), 2),
        recent_analyses=recent,
    )


@app.get("/cases/realtime", response_model=RealtimeCasesResponse)
def realtime_cases(limit: int = Query(25, ge=1, le=100), db: Session = Depends(get_db)) -> RealtimeCasesResponse:
    rows = db.scalars(select(AnalysisLog).order_by(AnalysisLog.created_at.desc()).limit(limit)).all()
    total_cases = db.scalar(select(func.count()).select_from(AnalysisLog)) or 0
    high_risk_cases = db.scalar(select(func.count()).select_from(AnalysisLog).where(AnalysisLog.level == "Tinggi")) or 0

    category_rows = db.execute(
        select(
            func.coalesce(AnalysisLog.case_category, "umum").label("category"),
            func.count().label("count"),
            func.sum(case((AnalysisLog.level == "Tinggi", 1), else_=0)).label("high_risk"),
            func.avg(AnalysisLog.score).label("average_score"),
        ).group_by(func.coalesce(AnalysisLog.case_category, "umum"))
    ).all()

    categories = [
        CategoryStat(
            category=str(row.category),
            count=int(row.count or 0),
            high_risk=int(row.high_risk or 0),
            average_score=round(float(row.average_score or 0), 2),
        )
        for row in category_rows
    ]
    categories.sort(key=lambda item: item.count, reverse=True)

    recent = [
        LiveCaseItem(
            id=row.id,
            created_at=row.created_at,
            title=row.title,
            case_category=row.case_category or "umum",
            score=row.score,
            level=row.level,
            input_type=row.input_type,
            city=row.city,
            external_source=row.external_source,
            external_status=row.external_status,
        )
        for row in rows
    ]
    return RealtimeCasesResponse(
        total_cases=total_cases,
        high_risk_cases=high_risk_cases,
        categories=categories,
        recent_cases=recent,
        generated_at=datetime.utcnow(),
    )


@app.post("/services/nearest", response_model=NearestServicesResponse)
def nearest_services(payload: NearestServicesRequest, db: Session = Depends(get_db)) -> NearestServicesResponse:
    return find_nearest_services(
        db=db,
        case_type=str(payload.case_type),
        lat=payload.latitude,
        lon=payload.longitude,
        radius_meters=payload.radius_meters,
    )


@app.get("/admin/export-json")
def export_json(db: Session = Depends(get_db)) -> dict[str, list[dict[str, object]]]:
    analyses = db.scalars(select(AnalysisLog).order_by(AnalysisLog.created_at.desc()).limit(200)).all()
    chats = db.scalars(select(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(200)).all()
    users = db.scalars(select(UserProfile).order_by(UserProfile.created_at.desc()).limit(200)).all()
    return {
        "users": [
            {
                "id": row.id,
                "created_at": row.created_at.isoformat(),
                "name": row.name,
                "email": row.email,
                "role": row.role,
                "status": row.status,
            }
            for row in users
        ],
        "analyses": [
            {
                "id": row.id,
                "created_at": row.created_at.isoformat(),
                "input_type": row.input_type,
                "title": row.title,
                "score": row.score,
                "level": row.level,
                "user_email": row.user_email,
                "case_category": row.case_category,
                "external_source": row.external_source,
                "external_status": row.external_status,
                "city": row.city,
                "features": json.loads(row.features_json),
            }
            for row in analyses
        ],
        "chats": [
            {
                "id": row.id,
                "created_at": row.created_at.isoformat(),
                "risk_score": row.risk_score,
                "risk_level": row.risk_level,
                "case_category": row.case_category,
                "message": row.message,
                "reply": row.reply,
                "user_email": row.user_email,
            }
            for row in chats
        ],
    }
