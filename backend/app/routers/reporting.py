from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io, base64
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
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
    graph_snapshot_base64: Optional[str] = None

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
    c.drawString(50, y, "IO Digital Signature Certificate (DSC): ____________________")
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=sec63_dossier.pdf"})
