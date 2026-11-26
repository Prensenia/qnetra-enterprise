from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import hashlib, io, json, pandas as pd
from ..store import CASES, add_audit

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])

@router.post("/batch")
async def ingest_batch(file: UploadFile = File(...), case_id: str = Form("CYB-2026-089")):
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    case = CASES.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    try:
        if file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse error: {e}")
    rows = 0
    for _, r in df.iterrows():
        src = str(r.get('source_id', r.get('source', '')))
        stype = str(r.get('source_type', 'BankAccount'))
        tgt = str(r.get('target_id', r.get('target', '')))
        ttype = str(r.get('target_type', 'UPI'))
        amt = float(r.get('amount', 0))
        asset = str(r.get('asset', 'INR'))
        ts = str(r.get('timestamp', ''))
        # upsert nodes
        if not any(n['id'] == src for n in case['nodes']):
            case['nodes'].append({"id": src, "type": stype, "label": src, "risk_score": 50, "risk_tier": "ELEVATED", "amount_inr": amt if asset=='INR' else None, "amount_usdt": amt if asset!='INR' else None, "timestamp": ts, "metadata": {}})
        if not any(n['id'] == tgt for n in case['nodes']):
            case['nodes'].append({"id": tgt, "type": ttype, "label": tgt, "risk_score": 50, "risk_tier": "ELEVATED", "amount_inr": None, "amount_usdt": None, "timestamp": ts, "metadata": {}})
        eid = f"ing_{src}_{tgt}_{rows}"
        case['edges'].append({"id": eid, "source": src, "target": tgt, "type": asset, "amount": amt, "asset": asset, "timestamp": ts, "evidence_type": "confirmed"})
        rows += 1
    case['total_inr'] += sum(float(r.get('amount',0)) for _,r in df.iterrows() if str(r.get('asset','INR'))=='INR')
    add_audit(case_id, "system@cybernautics.in", "System", "INGEST_BATCH", f"{file.filename} sha256={file_hash} rows={rows}")
    return {"status": "ok", "filename": file.filename, "sha256": file_hash, "rows": rows}

@router.post("/webhook")
async def ingest_webhook(payload: dict):
    case_id = payload.get('case_id', 'CYB-2026-089')
    case = CASES.get(case_id)
    if not case:
        return {"status": "error", "detail": "case not found"}
    src = payload.get('source_id', 'WEBHOOK_SRC')
    tgt = payload.get('target_id', 'WEBHOOK_TGT')
    amt = float(payload.get('amount', 10000))
    asset = payload.get('asset', 'INR')
    ts = payload.get('timestamp', '')
    if not any(n['id'] == src for n in case['nodes']):
        case['nodes'].append({"id": src, "type": "BankAccount", "label": src, "risk_score": 60, "risk_tier": "HIGH", "amount_inr": amt if asset=='INR' else None, "amount_usdt": amt if asset!='INR' else None, "timestamp": ts, "metadata": {}})
    if not any(n['id'] == tgt for n in case['nodes']):
        case['nodes'].append({"id": tgt, "type": "CryptoWallet", "label": tgt, "risk_score": 70, "risk_tier": "HIGH", "amount_inr": None, "amount_usdt": None, "timestamp": ts, "metadata": {}})
    case['edges'].append({"id": f"wh_{len(case['edges'])}", "source": src, "target": tgt, "type": asset, "amount": amt, "asset": asset, "timestamp": ts, "evidence_type": "inferred"})
    add_audit(case_id, "system@cybernautics.in", "System", "INGEST_WEBHOOK", f"live hop {src}->{tgt} {amt} {asset}")
    return {"status": "ok", "received": True}
