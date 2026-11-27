from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Pydantic models below...
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str

class Node(BaseModel):
    id: str
    type: str
    label: str
    risk_score: int = 0
    risk_tier: str = "LOW"
    amount_inr: Optional[float] = None
    amount_usdt: Optional[float] = None
    timestamp: Optional[str] = None
    metadata: Dict[str, Any] = {}

class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    amount: float
    asset: str
    timestamp: Optional[str] = None
    evidence_type: str = "confirmed"

class GraphResponse(BaseModel):
    case_id: str
    nodes: List[Node]
    edges: List[Edge]

class RiskReason(BaseModel):
    rule: str
    description: str
    score: int

class AnalysisResult(BaseModel):
    case_id: str
    risk_score: int
    risk_tier: str
    risk_reasons: List[RiskReason]
    clusters: List[Dict[str, Any]] = []

class AuditEntry(BaseModel):
    id: str
    case_id: str
    user_email: str
    role: str
    action: str
    details: str
    timestamp_utc: str
    payload_sha256: str
    prev_hash: str

class ApiKey(BaseModel):
    id: str
    name: str
    key: str
    created_at: str
    revoked: bool = False

class DashboardSummary(BaseModel):
    active_investigations: int
    total_traced_inr: float
    total_traced_usdt: float
    flagged_mule_clusters: int
    median_triage_time_hours: float
    bridge_queue: List[Dict[str, Any]]

# SQLAlchemy ORM models
class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    id = Column(String, primary_key=True)
    case_id = Column(String, index=True)
    filename = Column(String)
    file_type = Column(String)
    client_sha256 = Column(String)
    server_sha256 = Column(String)
    uploaded_by = Column(String)
    uploaded_at_ist = Column(String)

class AuditLogORM(Base):
    __tablename__ = "audit_logs_orm"
    id = Column(String, primary_key=True)
    case_id = Column(String, index=True)
    actor_id = Column(String)
    actor_role = Column(String)
    client_ip = Column(String)
    action = Column(String)
    target_hash_or_id = Column(String)
    timestamp_ist = Column(String)

class GeneratedReport(Base):
    __tablename__ = "generated_reports"
    report_id = Column(String, primary_key=True)
    case_id = Column(String, index=True)
    pdf_sha256 = Column(String)
    generated_by = Column(String)
    is_demo = Column(Boolean, default=False)
    generated_at_ist = Column(String)
