from fastapi import APIRouter
from ..config import POSTGRES_HOST, NEO4J_URI

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {
        "status": "ok",
        "postgres": {"host": POSTGRES_HOST, "status": "configured"},
        "neo4j": {"uri": NEO4J_URI, "status": "configured"},
        "rpc_adapter": "fallback_simulator",
    }
