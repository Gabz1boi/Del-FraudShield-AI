from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

AnalysisType = Literal["url", "text", "image"]
RiskLevel = Literal["Rendah", "Sedang", "Tinggi"]
CaseCategory = Literal[
    "phishing",
    "rekening_penipuan",
    "akun_diretas",
    "pinjaman_online",
    "kekerasan_digital",
    "malware",
    "hoaks",
    "umum",
]


class UserRegisterRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=5, max_length=255)


class UserRegisterResponse(BaseModel):
    id: int
    name: str
    email: str
    role: Literal["user", "admin"] = "user"
    is_new: bool = False


class AnalyzeRequest(BaseModel):
    type: AnalysisType
    content: str = Field(min_length=5, max_length=6000)
    user_email: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None


class FraudAnalysisResult(BaseModel):
    type: AnalysisType
    title: str
    score: int
    level: RiskLevel
    reasons: list[str]
    recommendations: list[str]
    features: dict[str, Any]
    case_category: CaseCategory = "umum"
    external_source: str | None = None
    external_status: str | None = None
    log_id: int | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=3, max_length=4000)
    user_email: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None


class ChatResponse(BaseModel):
    reply: str
    risk_score: int
    risk_level: RiskLevel
    signals: list[str]
    ai_provider: str
    case_category: CaseCategory
    chat_id: int | None = None


class AnalysisItem(BaseModel):
    id: int
    created_at: datetime
    input_type: str
    title: str
    score: int
    level: str
    user_email: str | None = None
    case_category: str | None = None
    external_source: str | None = None
    external_status: str | None = None
    city: str | None = None


class ChatItem(BaseModel):
    id: int
    created_at: datetime
    message: str
    reply: str
    risk_score: int
    risk_level: str
    case_category: str | None = None


class AdminMetrics(BaseModel):
    total_analyses: int
    total_chats: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_score: float
    recent_analyses: list[AnalysisItem]


class UserHistoryResponse(BaseModel):
    user_email: str
    total_analyses: int
    total_chats: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_score: float
    recent_analyses: list[AnalysisItem]
    recent_chats: list[ChatItem]


class LiveCaseItem(BaseModel):
    id: int
    created_at: datetime
    title: str
    case_category: str
    score: int
    level: str
    input_type: str
    city: str | None = None
    external_source: str | None = None
    external_status: str | None = None


class CategoryStat(BaseModel):
    category: str
    count: int
    high_risk: int
    average_score: float


class RealtimeCasesResponse(BaseModel):
    total_cases: int
    high_risk_cases: int
    categories: list[CategoryStat]
    recent_cases: list[LiveCaseItem]
    generated_at: datetime


class NearestServicesRequest(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    case_type: CaseCategory | str = "umum"
    radius_meters: int = Field(default=25000, ge=1000, le=50000)


class ServiceItem(BaseModel):
    id: int | str
    name: str
    category: str
    description: str
    address: str | None = None
    phone: str | None = None
    website: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    distance_km: float | None = None
    source: str
    action: str


class NearestServicesResponse(BaseModel):
    services: list[ServiceItem]
    location_used: bool
    sources: list[str]
    note: str
