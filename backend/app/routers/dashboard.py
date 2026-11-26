from fastapi import APIRouter
from ..store import CASES

router = APIRouter(prefix="/api/v1", tags=["dashboard"])

@router.get("/dashboard/summary")
def summary():
    cases = list(CASES.values())
    # citizen submissions first
    cases_sorted = sorted(cases, key=lambda c: 0 if c.get("complainant") else 1)
    bridge_queue = []
    for c in cases_sorted:
        bridge_queue.append({"case_id": c["case_id"], "title": c["title"], "risk_tier": "CRITICAL", "total_inr": c["total_inr"], "status": c.get("status", "SEEDED")})
    return {
        "active_investigations": len(CASES),
        "total_traced_inr": sum(c["total_inr"] for c in CASES.values()),
        "total_traced_usdt": sum(c["total_usdt"] for c in CASES.values()),
        "flagged_mule_clusters": 2,
        "median_triage_time_hours": 4.2,
        "bridge_queue": bridge_queue,
    }
