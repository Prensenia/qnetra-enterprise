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
    c.drawString(50, height-50, "Cybernautics Q-Netra - Financial Forensic Dossier")
    c.setFont("Helvetica", 10)
    c.drawString(50, height-70, f"Case: {case_id}  |  Title: {case['title']}")
    c.drawString(50, height-85, "Section 65B Indian Evidence Act - Electronic Evidence Certificate")
    y = height-110
    c.drawString(50, y, f"Total INR: {case['total_inr']:,}")
    y -= 15
    c.drawString(50, y, f"Total USDT: {case['total_usdt']:,}")
    y -= 15
    c.drawString(50, y, f"Nodes: {len(case['nodes'])}  Edges: {len(case['edges'])}")
    y -= 25
    # embed graph snapshot if provided
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
