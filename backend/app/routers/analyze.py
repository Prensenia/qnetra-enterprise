from fastapi import APIRouter, HTTPException
from ..store import CASES, add_audit
from ..models import AnalysisResult, RiskReason

router = APIRouter(prefix="/api/v1", tags=["analyze"])

@router.post("/analyze/{case_id}")
def analyze(case_id: str):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    reasons = [
        RiskReason(rule="Velocity Bridge", description="Fiat converted to USDT and withdrawn within 30 min", score=40),
        RiskReason(rule="Smurfing Ring", description="Multiple sub-threshold deposits aggregated", score=30),
        RiskReason(rule="Peel Chain", description="Rapid multi-hop splitting detected", score=20),
    ]
    total = sum(r.score for r in reasons)
    tier = "CRITICAL" if total >= 80 else "HIGH" if total >= 60 else "ELEVATED" if total >= 40 else "LOW"
    add_audit(case_id, "system@cybernautics.in", "System", "ANALYZE", f"Risk {total} {tier}")
    return AnalysisResult(case_id=case_id, risk_score=total, risk_tier=tier, risk_reasons=reasons, clusters=[{"id": "CLUSTER_1", "nodes": len(case["nodes"])}])
