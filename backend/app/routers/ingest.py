from fastapi import APIRouter, UploadFile, File, HTTPException
import hashlib, io, csv, json
from ..store import CASES, add_audit

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])

@router.post("/batch")
async def ingest_batch(file: UploadFile = File(...)):
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    # simple parse: store as audit event
    add_audit("SYSTEM", "system@cybernautics.in", "System", "INGEST_BATCH", f"File {file.filename} hash {file_hash}")
    return {"status": "ok", "filename": file.filename, "sha256": file_hash, "rows": 0}

@router.post("/webhook")
async def ingest_webhook(payload: dict):
    add_audit("SYSTEM", "system@cybernautics.in", "System", "INGEST_WEBHOOK", json.dumps(payload)[:200])
    return {"status": "ok", "received": True}
