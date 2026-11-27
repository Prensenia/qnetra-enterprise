from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import pytz

router = APIRouter(tags=["reporting"])

class Sec63Request(BaseModel):
    case_id: Optional[str] = "CASE-001"
    fir_ncrp: Optional[str] = "NCRP-001"
    target_wallet: Optional[str] = "0x..."
    files: Optional[List[dict]] = []
    risk: Optional[dict] = {}
    dilution: Optional[dict] = {}

@router.post("/api/report/sec63-pdf")
def sec63_pdf(req: Sec63Request):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    ist = pytz.timezone("Asia/Kolkata")
    ts = datetime.now(ist).strftime("%Y-%m-%d %H:%M:%S IST")
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
    c.drawString(50, y, "IO Digital Signature Certificate (DSC): ____________________")
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=sec63_dossier.pdf"})
