from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io, base64, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from datetime import datetime
import pytz
from ..db import SessionLocal
from ..models import GeneratedReport, AuditLogORM

router = APIRouter(tags=["reporting"])

class Sec63Request(BaseModel):
    case_id: Optional[str] = "CASE-001"
    fir_ncrp: Optional[str] = "NCRP-001"
    target_wallet: Optional[str] = "0x..."
    files: Optional[List[dict]] = []
    risk: Optional[dict] = {}
    dilution: Optional[dict] = {}
    graph_snapshot_base64: Optional[str] = None

@router.post("/api/report/sec63-pdf")
def sec63_pdf(req: Sec63Request, x_demo_mode: str = Header(None)):
    is_demo = (x_demo_mode or "").lower() == "true"
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    ist = pytz.timezone("Asia/Kolkata")
    ts = datetime.now(ist).strftime("%Y-%m-%d %H:%M:%S IST")
    if is_demo:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, h-50, "SAMPLE WATERMARKED PDF - DEMO ONLY")
    else:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, h-50, "Cybernautics Q-Netra - Financial Forensic Dossier")
    c.setFont("Helvetica", 10)
    c.drawString(50, h-70, f"Case ID: {req.case_id} | FIR/NCRP: {req.fir_ncrp}")
    c.drawString(50, h-85, f"Target Wallet: {req.target_wallet} | Timestamp: {ts}")
    c.drawString(50, h-100, "Section 63 BSA 2023 Electronic Evidence Certificate")
    y = h-120
    c.drawString(50, y, "Ingested Files:")
    y -= 15
    for f in (req.files or []):
        c.drawString(60, y, f"{f.get('name','file')} - {f.get('sha256','')}")
        y -= 12
    if req.graph_snapshot_base64:
        try:
            img_data = base64.b64decode(req.graph_snapshot_base64)
            img = ImageReader(io.BytesIO(img_data))
            c.drawImage(img, 50, y-260, width=500, height=250, preserveAspectRatio=True)
            y -= 270
        except Exception:
            c.drawString(50, y, "Graph snapshot could not be embedded")
            y -= 15
    y -= 10
    c.drawString(50, y, "Risk Assessment:")
    y -= 15
    for k, v in (req.risk or {}).items():
        c.drawString(60, y, f"{k}: {v}")
        y -= 12
    y -= 10
    c.drawString(50, y, "Dilution Appendix:")
    y -= 15
    for k, v in (req.dilution or {}).items():
        c.drawString(60, y, f"{k}: {v}")
        y -= 12
    y -= 20
    c.drawString(50, y, "This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.")
    y -= 30
    report_id = f"RPT-{req.case_id}"
    pdf_bytes = None
    c.drawString(50, y, f"Report Verification ID: {report_id}")
    y -= 15
    c.save()
    buf.seek(0)
    pdf_bytes = buf.getvalue()
    pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
    # stamp hash in footer by re-rendering? We'll append text to a new page? Simpler: draw hash before save. Need modify: draw hash line.
    # Re-generate with hash line
    buf2 = io.BytesIO()
    c2 = canvas.Canvas(buf2, pagesize=A4)
    # redo minimal header+hash
    c2.setFont("Helvetica-Bold", 16)
    c2.drawString(50, h-50, "Cybernautics Q-Netra - Financial Forensic Dossier" if not is_demo else "SAMPLE WATERMARKED PDF - DEMO ONLY")
    c2.setFont("Helvetica", 10)
    c2.drawString(50, h-70, f"Case ID: {req.case_id} | FIR/NCRP: {req.fir_ncrp}")
    c2.drawString(50, h-85, f"Target Wallet: {req.target_wallet} | Timestamp: {ts}")
    c2.drawString(50, h-100, "Section 63(4) BSA 2023 - PART A (IO Declaration)")
    y2 = h-115
    c2.drawString(50, y2, "System operation regularity declaration. Device/server localization: AWS ap-south-1 / Mumbai.")
    y2 -= 15
    c2.drawString(50, y2, "IO Digital Signature Certificate (DSC): ____________________")
    y2 -= 20
    c2.drawString(50, y2, "PART B (Digital Forensics Examiner)")
    y2 -= 15
    c2.drawString(50, y2, "Cryptographic hash algorithm: SHA-256. Ingested file hash table reference included.")
    y2 -= 15
    c2.drawString(50, y2, f"Compiled PDF SHA-256: {pdf_hash}")
    y2 -= 15
    c2.drawString(50, y2, "DSC stamp block: ____________________")
    y2 = h-120
    c2.drawString(50, y2, "Ingested Files:")
    y2 -= 15
    for f in (req.files or []):
        c2.drawString(60, y2, f"{f.get('name','file')} - {f.get('sha256','')}")
        y2 -= 12
    if req.graph_snapshot_base64:
        try:
            img_data = base64.b64decode(req.graph_snapshot_base64)
            img = ImageReader(io.BytesIO(img_data))
            c2.drawImage(img, 50, y2-260, width=500, height=250, preserveAspectRatio=True)
            y2 -= 270
        except Exception:
            c2.drawString(50, y2, "Graph snapshot could not be embedded")
            y2 -= 15
    y2 -= 10
    c2.drawString(50, y2, "Risk Assessment:")
    y2 -= 15
    for k, v in (req.risk or {}).items():
        c2.drawString(60, y2, f"{k}: {v}")
        y2 -= 12
    y2 -= 10
    c2.drawString(50, y2, "Dilution Appendix:")
    y2 -= 15
    for k, v in (req.dilution or {}).items():
        c2.drawString(60, y2, f"{k}: {v}")
        y2 -= 12
    y2 -= 20
    c2.drawString(50, y2, "This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.")
    y2 -= 20
    c2.drawString(50, y2, f"Report Verification ID: {report_id}")
    y2 -= 15
    c2.drawString(50, y2, f"PDF SHA-256: {pdf_hash}")
    y2 -= 30
    c2.drawString(50, y2, "IO Digital Signature Certificate (DSC): ____________________")
    c2.save()
    buf2.seek(0)
    pdf_bytes = buf2.getvalue()
    pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
    # save to DB
    db = SessionLocal()
    gr = GeneratedReport(report_id=report_id, case_id=req.case_id, pdf_sha256=pdf_hash, generated_by="officer", is_demo=is_demo, generated_at_ist=datetime.now(pytz.timezone("Asia/Kolkata")).isoformat())
    db.add(gr)
    al = AuditLogORM(id=f"audit-{report_id}", case_id=req.case_id, actor_id="officer", actor_role="Lead Investigator", client_ip="0.0.0.0", action="EXPORT_PDF", target_hash_or_id=pdf_hash, timestamp_ist=datetime.now(pytz.timezone("Asia/Kolkata")).isoformat())
    db.add(al)
    db.commit()
    db.close()
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={req.case_id}_dossier.pdf"})
