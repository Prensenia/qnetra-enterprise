from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ..store import CASES, AUDIT_LOGS, add_audit
import io, base64
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

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

@router.get("/cases/{case_id}/audit-trail")
def get_audit_trail(case_id: str):
    from ..db import SessionLocal
    from ..models import EvidenceFile, AuditLogORM
    db = SessionLocal()
    evidence = db.query(EvidenceFile).filter(EvidenceFile.case_id == case_id).all()
    orm_logs = db.query(AuditLogORM).filter(AuditLogORM.case_id == case_id).all()
    db.close()
    entries = []
    for e in evidence:
        entries.append({"timestamp_ist": e.uploaded_at_ist, "actor_id": e.uploaded_by, "action": "EVIDENCE_UPLOAD", "sha256": e.server_sha256, "filename": e.filename})
    for a in orm_logs:
        entries.append({"timestamp_ist": a.timestamp_ist, "actor_id": a.actor_id, "action": a.action, "sha256": a.target_hash_or_id, "ip": a.client_ip})
    # also legacy audit logs
    for a in AUDIT_LOGS:
        if a["case_id"] == case_id:
            entries.append({"timestamp_ist": a["timestamp_utc"], "actor_id": a["user_email"], "action": a["action"], "sha256": a["payload_sha256"]})
    entries.sort(key=lambda x: x.get("timestamp_ist", ""))
    return {"case_id": case_id, "entries": entries}

@router.get("/cases/{case_id}/correlations")
def correlations(case_id: str):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    shared = []
    for other_id, other in CASES.items():
        if other_id == case_id:
            continue
        ids = {n["id"] for n in case["nodes"]}
        shared_ids = ids & {n["id"] for n in other["nodes"]}
        if shared_ids:
            shared.append({"other_case": other_id, "shared_nodes": list(shared_ids)})
    return {"case_id": case_id, "correlations": shared}

@router.post("/cases/{case_id}/generate-notice")
def generate_notice(case_id: str, payload: dict = {}):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    target = payload.get("target", "VASP")
    content = f"NOTICE u/s 94 BNSS 2023 & Sec 106/168 BNSS 2023\nTo: {target}\nCase: {case_id}\nTraced INR: {case['total_inr']}\nTraced USDT: {case['total_usdt']}\nNodes: {len(case['nodes'])}\n"
    add_audit(case_id, "system@cybernautics.in", "System", "GENERATE_NOTICE", f"Notice for {target}")
    return {"status": "ok", "notice": content}

@router.post("/cases/{case_id}/export-pdf")
def export_pdf(case_id: str, payload: dict = {}):
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    graph_png = payload.get("graph_png")
    add_audit(case_id, "system@cybernautics.in", "System", "EXPORT_PDF", "Forensic dossier generated")
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height-50, "Cybernautics Q-Netra - Financial Forensic Dossier (Sec 106/503 BNSS)")
    c.setFont("Helvetica", 10)
    c.drawString(50, height-70, f"Case: {case_id}  |  Title: {case['title']}")
    c.drawString(50, height-85, "Section 63 BSA 2023 - Electronic Evidence Certificate")
    y = height-110
    c.drawString(50, y, f"Total INR: {case['total_inr']:,}")
    y -= 15
    c.drawString(50, y, f"Total USDT: {case['total_usdt']:,}")
    y -= 15
    c.drawString(50, y, f"Nodes: {len(case['nodes'])}  Edges: {len(case['edges'])}")
    y -= 25
    if graph_png:
        try:
            img_data = base64.b64decode(graph_png)
            img = ImageReader(io.BytesIO(img_data))
            c.drawImage(img, 50, y-260, width=500, height=250, preserveAspectRatio=True)
            y -= 270
        except Exception:
            c.drawString(50, y, "Graph snapshot could not be embedded")
            y -= 15
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Flagged Entities")
    y -= 15
    c.setFont("Helvetica", 9)
    for n in case["nodes"][:15]:
        if y < 80:
            c.showPage(); y = height-50
        c.drawString(50, y, f"{n['id']} ({n['type']}) risk={n['risk_score']} {n['risk_tier']}")
        y -= 12
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Chronological Hop Ledger")
    y -= 15
    c.setFont("Helvetica", 9)
    for e in case["edges"][:20]:
        if y < 80:
            c.showPage(); y = height-50
        c.drawString(50, y, f"{e['source']} -> {e['target']} : {e['amount']} {e['asset']} ({e['evidence_type']})")
        y -= 12
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Chain-of-Custody Audit Hashes")
    y -= 15
    c.setFont("Helvetica", 8)
    for a in AUDIT_LOGS:
        if a["case_id"] != case_id:
            continue
        if y < 60:
            c.showPage(); y = height-50
        c.drawString(50, y, f"{a['timestamp_utc']} {a['action']} {a['payload_sha256'][:16]}...")
        y -= 10
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={case_id}_dossier.pdf"})
