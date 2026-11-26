from fastapi import APIRouter
from ..store import CASES

router = APIRouter(prefix="/api/v1", tags=["dashboard"])

@router.get("/dashboard/summary")
def summary():
    bridge_queue = []
    for cid, c in CASES.items():
        bridge_queue.append({"case_id": cid, "title": c["title"], "risk_tier": "CRITICAL", "total_inr": c["total_inr"]})
    return {
        "active_investigations": len(CASES),
        "total_traced_inr": sum(c["total_inr"] for c in CASES.values()),
        "total_traced_usdt": sum(c["total_usdt"] for c in CASES.values()),
        "flagged_mule_clusters": 2,
        "median_triage_time_hours": 4.2,
        "bridge_queue": bridge_queue,
    }
