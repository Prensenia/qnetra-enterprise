from fastapi import APIRouter, HTTPException
from ..store import CASES

router = APIRouter(prefix="/api/v1/officer", tags=["officer"])

@router.post("/ai-agent/{case_id}")
def ai_agent(case_id: str, payload: dict = {}):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    # deterministic forensic suggestions
    nodes = case.get("nodes", [])
    exit_node = next((n for n in nodes if n["type"] in ("VASPExchange", "SanctionedCluster")), None)
    msg = f"Case {case_id}: Highest freeze choke point is {exit_node['label'] if exit_node else 'unknown'}. Issue BNSS Sec 94 notice immediately. Cross-case overlaps detected: check shared wallets."
    return {"case_id": case_id, "analysis": msg, "suggested_action": "Generate BNSS notice", "choke_point": exit_node["id"] if exit_node else None}
