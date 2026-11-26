from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid, hashlib, os, httpx
from ..store import CASES, save_case, add_audit
from ..bank_helplines import lookup_bank

router = APIRouter(prefix="/api/v1/citizen", tags=["citizen"])

class AIHelperRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    current_form: Dict[str, Any] = {}
    language: str = "en-IN"

@router.post("/ai-helper")
def ai_helper(req: AIHelperRequest):
    msg = req.message.strip()
    msg_lower = msg.lower()
    cf = req.current_form or {}
    # LLM path
    gemini = os.getenv("GEMINI_API_KEY")
    groq = os.getenv("GROQ_API_KEY")
    openai = os.getenv("OPENAI_API_KEY")
    if gemini or groq or openai:
        try:
            system = "You are Cyber Sahayak, a compassionate Indian cybercrime assistant. Calm the victim first. Ask one missing detail at a time. Support English, Hindi, Hinglish. Return JSON with reply, extracted_fields, suggested_quick_replies."
            # simple call to groq if available
            if groq:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq}"}
                model = "llama3-8b-8192"
            elif openai:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {openai}"}
                model = "gpt-4o-mini"
            else:
                url = None
            if url:
                payload = {"model": model, "messages": [{"role": "system", "content": system}] + req.history + [{"role": "user", "content": msg}], "temperature": 0.4}
                r = httpx.post(url, headers=headers, json=payload, timeout=15)
                r.raise_for_status()
                content = r.json()["choices"][0]["message"]["content"]
                import json
                try:
                    data = json.loads(content)
                except Exception:
                    data = {"reply": content, "extracted_fields": {}, "suggested_quick_replies": []}
                return data
        except Exception:
            pass
    # fallback state machine
    extracted = {}
    # amount
    import re
    m = re.search(r"(\d[\d,]*)", msg)
    if m and not cf.get("amount_inr"):
        try: extracted["amount_inr"] = float(m.group(1).replace(",", ""))
        except: pass
    # bank
    for bank in ["sbi","hdfc","icici","axis","pnb","kotak","bob","canara","union","indusind","yes","idfc","paytm"]:
        if bank in msg_lower and not cf.get("victim_bank"):
            extracted["bank_name"] = bank.upper()
    # utr
    if "utr" in msg_lower or re.search(r"\b\d{12}\b", msg):
        utr = re.search(r"\b\d{12}\b", msg)
        if utr: extracted["utr"] = utr.group(0)
        elif "don't know" in msg_lower or "dont know" in msg_lower:
            extracted["utr"] = "UNKNOWN_UTR_BANK_STATEMENT_PENDING"
    # suspect
    if "upi" in msg_lower and "@" in msg:
        extracted["suspect_id"] = msg.split()[-1]
    if "don't know" in msg_lower or "dont know" in msg_lower:
        if not cf.get("suspect_upi"): extracted["suspect_upi"] = "UNKNOWN_SUSPECT_IDENTIFIER"
        if not cf.get("exchange"): extracted["exchange"] = "UNKNOWN_PLATFORM"

    # determine reply based on history/form
    if not cf.get("victim_bank") and "bank_name" not in extracted and "amount" not in str(cf):
        reply = "I understand this is stressful. Take a deep breath. You are not alone. First, which bank or UPI app did you use, and roughly how much money was lost?"
    elif not cf.get("narrative"):
        reply = "Thank you. Can you briefly describe how the scam happened (fake investment, digital arrest, UPI QR, etc.)?"
    elif not cf.get("utr") and not cf.get("suspect_upi"):
        reply = "Do you have the 12-digit UTR or the suspect's UPI ID / wallet address? If not, that's okay—type 'I don't know' and we'll continue."
    else:
        reply = "You're doing great. I've captured the details. Please review the form on the right and submit. Remember to call 1930 immediately."

    # acknowledge
    if "dar" in msg_lower or "scared" in msg_lower or "afraid" in msg_lower:
        reply = "I hear you, and it's completely understandable to feel scared. We will help you step by step. " + reply
    if "called" in msg_lower or "1930" in msg:
        reply = "Good job calling 1930. " + reply
    if "don't know" in msg_lower or "dont know" in msg_lower:
        reply = "No problem at all. " + reply
    if "frozen" in msg_lower or "freeze" in msg_lower:
        reply = "If your own account is frozen as collateral, you can submit a 15-day representation letter to the District/State Grievance Officer under NCRP-CFCFRMS SOP Section 9. " + reply

    quick = ["I don't know the UTR", "I don't have the suspect ID", "I already called 1930", "Help me fill the form"]
    return {"reply": reply, "extracted_fields": extracted, "suggested_quick_replies": quick}

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
    ncrp_id: Optional[str] = ""
@router.post("/cases")
def create_citizen_case(req: CitizenCaseRequest):
    case_id = f"CYB-2026-{100 + len(CASES)}"
    nodes = [{"id": "VICTIM", "type": "BankAccount", "label": "Victim Account", "risk_score": 10, "risk_tier": "LOW", "amount_inr": req.amount_inr, "timestamp": req.incident_time, "metadata": {"name": req.complainant_name, "bank": req.victim_bank, "upi": req.victim_upi}}]
    edges = []
    if req.suspect_upi and req.suspect_upi != "UNKNOWN_SUSPECT_IDENTIFIER":
        nodes.append({"id": "SUSPECT_UPI", "type": "UPI", "label": req.suspect_upi, "risk_score": 75, "risk_tier": "HIGH", "amount_inr": req.amount_inr, "timestamp": req.incident_time, "metadata": {}})
        edges.append({"id": "e_v_u", "source": "VICTIM", "target": "SUSPECT_UPI", "type": "UPI", "amount": req.amount_inr, "asset": "INR", "timestamp": req.incident_time, "evidence_type": "confirmed"})
    if req.suspect_wallet and req.suspect_wallet != "UNKNOWN_SUSPECT_IDENTIFIER":
        nodes.append({"id": "SUSPECT_WALLET", "type": "CryptoWallet", "label": req.suspect_wallet, "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": (req.amount_inr or 0)/90, "timestamp": req.incident_time, "metadata": {"exchange": req.exchange}})
        edges.append({"id": "e_u_w", "source": "SUSPECT_UPI" if req.suspect_upi and req.suspect_upi != "UNKNOWN_SUSPECT_IDENTIFIER" else "VICTIM", "target": "SUSPECT_WALLET", "type": "Crypto", "amount": (req.amount_inr or 0)/90, "asset": "USDT", "timestamp": req.incident_time, "evidence_type": "inferred"})
    if req.exchange and req.exchange != "UNKNOWN_PLATFORM":
        nodes.append({"id": "VASP", "type": "VASPExchange", "label": req.exchange, "risk_score": 60, "risk_tier": "HIGH", "amount_usdt": (req.amount_inr or 0)/90, "timestamp": req.incident_time, "metadata": {}})
        edges.append({"id": "e_w_vasp", "source": "SUSPECT_WALLET", "target": "VASP", "type": "Exchange", "amount": (req.amount_inr or 0)/90, "asset": "USDT", "timestamp": req.incident_time, "evidence_type": "inferred"})
    from .vasp_intel import enrich_node
    for n in nodes:
        enrich_node(n)
    case = {
        "case_id": case_id,
        "title": f"Citizen Complaint - {req.scam_type}",
        "description": req.narrative,
        "complainant": {"name": req.complainant_name, "mobile": req.mobile, "email": req.email, "city": req.city},
        "scam_type": req.scam_type,
        "incident_time": req.incident_time,
        "amount_inr": req.amount_inr,
        "utrs": req.utrs,
        "ncrp_id": req.ncrp_id,
        "status": "NEW_CITIZEN_REPORT",
        "nodes": nodes,
        "edges": edges,
        "total_inr": req.amount_inr or 0,
        "total_usdt": (req.amount_inr or 0)/90,
    }
    save_case(case)
    add_audit(case_id, req.email, "Citizen", "CASE_SUBMITTED", f"{req.scam_type} amount {req.amount_inr}")
    return {"case_id": case_id, "status": "registered"}

@router.get("/cases")
def list_citizen_cases():
    return [c for c in CASES.values() if c.get("complainant")]
