from fastapi import APIRouter
from ..config import ETHERSCAN_API_KEY

router = APIRouter(prefix="/api/v1/onchain", tags=["onchain"])

@router.get("/enrich/{address}")
def enrich(address: str):
    # deterministic fallback telemetry
    return {
        "address": address,
        "source": "fallback_simulator",
        "balance_usdt": 12345.67,
        "tx_count": 42,
        "risk_flags": ["high_velocity", "mixer_interaction"],
        "offline": not bool(ETHERSCAN_API_KEY),
    }
