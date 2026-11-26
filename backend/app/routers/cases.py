from fastapi import APIRouter, HTTPException
from ..store import CASES, AUDIT_LOGS, add_audit

router = APIRouter(prefix="/api/v1", tags=["cases"])

@router.get("/cases/{case_id}/graph")
def get_graph(case_id: str):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"case_id": case_id, "nodes": case["nodes"], "edges": case["edges"]}

@router.get("/cases/{case_id}/audit")
def get_audit(case_id: str):
    return [e for e in AUDIT_LOGS if e["case_id"] == case_id]

@router.post("/cases/{case_id}/export-pdf")
def export_pdf(case_id: str, payload: dict = {}):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    add_audit(case_id, "system@cybernautics.in", "System", "EXPORT_PDF", "Forensic dossier generated")
    # Return a simple PDF-like placeholder as text; in production use ReportLab
    content = f"FORENSIC DOSSIER - {case_id}\nTotal INR: {case['total_inr']}\nNodes: {len(case['nodes'])}\n"
    return {"status": "ok", "download_url": f"/static/{case_id}.pdf", "filename": f"{case_id}_dossier.pdf", "content": content}
