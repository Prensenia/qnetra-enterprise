from fastapi import APIRouter
import uuid
from ..store import API_KEYS

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])

@router.get("/api-keys")
def list_keys():
    return API_KEYS

@router.post("/api-keys")
def create_key(payload: dict):
    key = {
        "id": str(uuid.uuid4()),
        "name": payload.get("name", "New Key"),
        "key": "qnetra_" + uuid.uuid4().hex,
        "created_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "revoked": False,
    }
    API_KEYS.append(key)
    return key
