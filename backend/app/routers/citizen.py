from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid, hashlib
from ..store import CASES, save_case, add_audit

router = APIRouter(prefix="/api/v1/citizen", tags=["citizen"])

class AIHelperRequest(BaseModel):
    message: str

@router.post("/ai-helper")
def ai_helper(req: AIHelperRequest):
    msg = req.message.lower()
    extracted = {}
    if "upi" in msg: extracted["channel"] = "UPI"
    if "crypto" in msg or "bitcoin" in msg or "usdt" in msg: extracted["channel"] = "Crypto"
    # calm guidance
    guidance = "Take a deep breath. You are not alone. Acting within the Golden Hour gives the strongest chance to freeze funds. Please call 1930 and your bank fraud desk immediately."
    return {"guidance": guidance, "extracted": extracted, "next_question": "What was the amount lost and the 12-digit UTR/transaction hash?"}

class CitizenCaseRequest(BaseModel):
    complainant_name: str
    mobile: str
    email: str
    city: str
    scam_type: str
    narrative: str
    incident_time: str
    victim_bank: str
    victim_upi: str
    suspect_upi: Optional[str] = ""
    suspect_wallet: Optional[str] = ""
    exchange: Optional[str] = ""
    amount_inr: float
    utrs: List[str] = []
    evidence_hashes: List[str] = []

@router.post("/cases")
def create_citizen_case(req: CitizenCaseRequest):
    case_id = f"CYB-2026-{100 + len(CASES)}"
    # build graph nodes/edges
    nodes = [{"id": "VICTIM", "type": "BankAccount", "label": "Victim Account", "risk_score": 10, "risk_tier": "LOW", "amount_inr": req.amount_inr, "timestamp": req.incident_time, "metadata": {"name": req.complainant_name, "bank": req.victim_bank, "upi": req.victim_upi}}]
    edges = []
    if req.suspect_upi:
        nodes.append({"id": "SUSPECT_UPI", "type": "UPI", "label": req.suspect_upi, "risk_score": 75, "risk_tier": "HIGH", "amount_inr": req.amount_inr, "timestamp": req.incident_time, "metadata": {}})
        edges.append({"id": "e_v_u", "source": "VICTIM", "target": "SUSPECT_UPI", "type": "UPI", "amount": req.amount_inr, "asset": "INR", "timestamp": req.incident_time, "evidence_type": "confirmed"})
    if req.suspect_wallet:
        nodes.append({"id": "SUSPECT_WALLET", "type": "CryptoWallet", "label": req.suspect_wallet, "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": req.amount_inr/90, "timestamp": req.incident_time, "metadata": {"exchange": req.exchange}})
        edges.append({"id": "e_u_w", "source": "SUSPECT_UPI" if req.suspect_upi else "VICTIM", "target": "SUSPECT_WALLET", "type": "Crypto", "amount": req.amount_inr/90, "asset": "USDT", "timestamp": req.incident_time, "evidence_type": "inferred"})
    if req.exchange:
        nodes.append({"id": "VASP", "type": "VASPExchange", "label": req.exchange, "risk_score": 60, "risk_tier": "HIGH", "amount_usdt": req.amount_inr/90, "timestamp": req.incident_time, "metadata": {}})
        edges.append({"id": "e_w_vasp", "source": "SUSPECT_WALLET", "target": "VASP", "type": "Exchange", "amount": req.amount_inr/90, "asset": "USDT", "timestamp": req.incident_time, "evidence_type": "inferred"})
    case = {
        "case_id": case_id,
        "title": f"Citizen Complaint - {req.scam_type}",
        "description": req.narrative,
        "complainant": {"name": req.complainant_name, "mobile": req.mobile, "email": req.email, "city": req.city},
        "scam_type": req.scam_type,
        "incident_time": req.incident_time,
        "amount_inr": req.amount_inr,
        "utrs": req.utrs,
        "nodes": nodes,
        "edges": edges,
        "total_inr": req.amount_inr,
        "total_usdt": req.amount_inr/90,
    }
    save_case(case)
    add_audit(case_id, req.email, "Citizen", "CASE_SUBMITTED", f"{req.scam_type} amount {req.amount_inr}")
    return {"case_id": case_id, "status": "registered"}

@router.get("/cases")
def list_citizen_cases():
    return [c for c in CASES.values() if c.get("complainant")]
