import hashlib, json, uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any

USERS = {
    "admin@cybernautics.in": {"password": "Admin@123", "role": "Lead Investigator"},
    "auditor@cybernautics.in": {"password": "Auditor@123", "role": "Auditor"},
}

API_KEYS: List[Dict[str, Any]] = []
AUDIT_LOGS: List[Dict[str, Any]] = []
CASES: Dict[str, Dict[str, Any]] = {}


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def add_audit(case_id, user_email, role, action, details):
    prev = AUDIT_LOGS[-1]["payload_sha256"] if AUDIT_LOGS else "0" * 64
    entry = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "user_email": user_email,
        "role": role,
        "action": action,
        "details": details,
        "timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "payload_sha256": sha256(f"{case_id}{user_email}{action}{details}{prev}"),
        "prev_hash": prev,
    }
    AUDIT_LOGS.append(entry)
    return entry


def _ts(minutes: int) -> str:
    base = datetime(2026, 3, 15, 10, 0, 0)
    return (base + timedelta(minutes=minutes)).isoformat() + "+05:30"


# Case CYB-2026-089: Rs 1.42 Cr UPI-to-USDT Mule Syndicate
nodes_089 = [
    {"id": "VICTIM_001", "type": "BankAccount", "label": "Victim Account", "risk_score": 10, "risk_tier": "LOW", "amount_inr": 14200000, "timestamp": _ts(0)},
    {"id": "UPI_MULE_1", "type": "UPI", "label": "Mule UPI 1", "risk_score": 78, "risk_tier": "HIGH", "amount_inr": 2300000, "timestamp": _ts(5)},
    {"id": "UPI_MULE_2", "type": "UPI", "label": "Mule UPI 2", "risk_score": 72, "risk_tier": "HIGH", "amount_inr": 2100000, "timestamp": _ts(7)},
    {"id": "UPI_MULE_3", "type": "UPI", "label": "Mule UPI 3", "risk_score": 80, "risk_tier": "HIGH", "amount_inr": 2500000, "timestamp": _ts(9)},
    {"id": "UPI_MULE_4", "type": "UPI", "label": "Mule UPI 4", "risk_score": 75, "risk_tier": "HIGH", "amount_inr": 2400000, "timestamp": _ts(11)},
    {"id": "UPI_MULE_5", "type": "UPI", "label": "Mule UPI 5", "risk_score": 70, "risk_tier": "HIGH", "amount_inr": 2200000, "timestamp": _ts(13)},
    {"id": "UPI_MULE_6", "type": "UPI", "label": "Mule UPI 6", "risk_score": 82, "risk_tier": "HIGH", "amount_inr": 2700000, "timestamp": _ts(15)},
    {"id": "CONSOL_BANK", "type": "BankAccount", "label": "Consolidation Bank", "risk_score": 90, "risk_tier": "CRITICAL", "amount_inr": 14200000, "timestamp": _ts(20)},
    {"id": "VASP_ONRAMP", "type": "VASPExchange", "label": "Indian VASP On-Ramp", "risk_score": 65, "risk_tier": "HIGH", "amount_usdt": 157000, "timestamp": _ts(25)},
    {"id": "WALLET_TRON_1", "type": "CryptoWallet", "label": "TRON Wallet 1", "risk_score": 88, "risk_tier": "CRITICAL", "amount_usdt": 80000, "timestamp": _ts(30)},
    {"id": "WALLET_TRON_2", "type": "CryptoWallet", "label": "TRON Wallet 2", "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": 45000, "timestamp": _ts(32)},
    {"id": "WALLET_ETH_1", "type": "CryptoWallet", "label": "ETH Wallet 1", "risk_score": 80, "risk_tier": "HIGH", "amount_usdt": 32000, "timestamp": _ts(35)},
    {"id": "MIXER_1", "type": "Mixer", "label": "Mixer Cluster", "risk_score": 95, "risk_tier": "CRITICAL", "amount_usdt": 120000, "timestamp": _ts(40)},
    {"id": "OFFSHORE_1", "type": "SanctionedCluster", "label": "Offshore Cluster", "risk_score": 99, "risk_tier": "CRITICAL", "amount_usdt": 100000, "timestamp": _ts(50)},
]
edges_089 = [
    {"id": "e1", "source": "VICTIM_001", "target": "UPI_MULE_1", "type": "UPI", "amount": 2300000, "asset": "INR", "timestamp": _ts(5), "evidence_type": "confirmed"},
    {"id": "e2", "source": "VICTIM_001", "target": "UPI_MULE_2", "type": "UPI", "amount": 2100000, "asset": "INR", "timestamp": _ts(7), "evidence_type": "confirmed"},
    {"id": "e3", "source": "VICTIM_001", "target": "UPI_MULE_3", "type": "UPI", "amount": 2500000, "asset": "INR", "timestamp": _ts(9), "evidence_type": "confirmed"},
    {"id": "e4", "source": "VICTIM_001", "target": "UPI_MULE_4", "type": "UPI", "amount": 2400000, "asset": "INR", "timestamp": _ts(11), "evidence_type": "confirmed"},
    {"id": "e5", "source": "VICTIM_001", "target": "UPI_MULE_5", "type": "UPI", "amount": 2200000, "asset": "INR", "timestamp": _ts(13), "evidence_type": "confirmed"},
    {"id": "e6", "source": "VICTIM_001", "target": "UPI_MULE_6", "type": "UPI", "amount": 2700000, "asset": "INR", "timestamp": _ts(15), "evidence_type": "confirmed"},
    {"id": "e7", "source": "UPI_MULE_1", "target": "CONSOL_BANK", "type": "Bank", "amount": 2300000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e8", "source": "UPI_MULE_2", "target": "CONSOL_BANK", "type": "Bank", "amount": 2100000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e9", "source": "UPI_MULE_3", "target": "CONSOL_BANK", "type": "Bank", "amount": 2500000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e10", "source": "UPI_MULE_4", "target": "CONSOL_BANK", "type": "Bank", "amount": 2400000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e11", "source": "UPI_MULE_5", "target": "CONSOL_BANK", "type": "Bank", "amount": 2200000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e12", "source": "UPI_MULE_6", "target": "CONSOL_BANK", "type": "Bank", "amount": 2700000, "asset": "INR", "timestamp": _ts(20), "evidence_type": "confirmed"},
    {"id": "e13", "source": "CONSOL_BANK", "target": "VASP_ONRAMP", "type": "Exchange", "amount": 14200000, "asset": "INR", "timestamp": _ts(25), "evidence_type": "confirmed"},
    {"id": "e14", "source": "VASP_ONRAMP", "target": "WALLET_TRON_1", "type": "Crypto", "amount": 80000, "asset": "USDT", "timestamp": _ts(30), "evidence_type": "inferred"},
    {"id": "e15", "source": "VASP_ONRAMP", "target": "WALLET_TRON_2", "type": "Crypto", "amount": 45000, "asset": "USDT", "timestamp": _ts(32), "evidence_type": "inferred"},
    {"id": "e16", "source": "VASP_ONRAMP", "target": "WALLET_ETH_1", "type": "Crypto", "amount": 32000, "asset": "USDT", "timestamp": _ts(35), "evidence_type": "inferred"},
    {"id": "e17", "source": "WALLET_TRON_1", "target": "MIXER_1", "type": "Crypto", "amount": 80000, "asset": "USDT", "timestamp": _ts(40), "evidence_type": "inferred"},
    {"id": "e18", "source": "MIXER_1", "target": "OFFSHORE_1", "type": "Crypto", "amount": 100000, "asset": "USDT", "timestamp": _ts(50), "evidence_type": "inferred"},
]

# Case CYB-2026-094: Cross-Border Peel Chain
nodes_094 = [
    {"id": "VICTIM_B", "type": "BankAccount", "label": "Victim B", "risk_score": 15, "risk_tier": "LOW", "amount_inr": 8500000, "timestamp": _ts(0)},
    {"id": "FIAT_BRIDGE", "type": "BankAccount", "label": "Fiat Bridge", "risk_score": 60, "risk_tier": "ELEVATED", "amount_inr": 8500000, "timestamp": _ts(10)},
    {"id": "VASP_B", "type": "VASPExchange", "label": "VASP B", "risk_score": 70, "risk_tier": "HIGH", "amount_usdt": 94000, "timestamp": _ts(15)},
    {"id": "W1", "type": "CryptoWallet", "label": "Wallet 1", "risk_score": 75, "risk_tier": "HIGH", "amount_usdt": 94000, "timestamp": _ts(20)},
    {"id": "W2", "type": "CryptoWallet", "label": "Wallet 2", "risk_score": 78, "risk_tier": "HIGH", "amount_usdt": 47000, "timestamp": _ts(22)},
    {"id": "W3", "type": "CryptoWallet", "label": "Wallet 3", "risk_score": 80, "risk_tier": "HIGH", "amount_usdt": 23500, "timestamp": _ts(24)},
    {"id": "W4", "type": "CryptoWallet", "label": "Wallet 4", "risk_score": 82, "risk_tier": "HIGH", "amount_usdt": 11750, "timestamp": _ts(26)},
    {"id": "W5", "type": "CryptoWallet", "label": "Wallet 5", "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": 5875, "timestamp": _ts(28)},
    {"id": "RETURN_CLUSTER", "type": "SanctionedCluster", "label": "Return Cluster", "risk_score": 90, "risk_tier": "CRITICAL", "amount_usdt": 3000, "timestamp": _ts(35)},
]
edges_094 = [
    {"id": "b1", "source": "VICTIM_B", "target": "FIAT_BRIDGE", "type": "Bank", "amount": 8500000, "asset": "INR", "timestamp": _ts(10), "evidence_type": "confirmed"},
    {"id": "b2", "source": "FIAT_BRIDGE", "target": "VASP_B", "type": "Exchange", "amount": 8500000, "asset": "INR", "timestamp": _ts(15), "evidence_type": "confirmed"},
    {"id": "b3", "source": "VASP_B", "target": "W1", "type": "Crypto", "amount": 94000, "asset": "USDT", "timestamp": _ts(20), "evidence_type": "inferred"},
    {"id": "b4", "source": "W1", "target": "W2", "type": "Crypto", "amount": 47000, "asset": "USDT", "timestamp": _ts(22), "evidence_type": "inferred"},
    {"id": "b5", "source": "W2", "target": "W3", "type": "Crypto", "amount": 23500, "asset": "USDT", "timestamp": _ts(24), "evidence_type": "inferred"},
    {"id": "b6", "source": "W3", "target": "W4", "type": "Crypto", "amount": 11750, "asset": "USDT", "timestamp": _ts(26), "evidence_type": "inferred"},
    {"id": "b7", "source": "W4", "target": "W5", "type": "Crypto", "amount": 5875, "asset": "USDT", "timestamp": _ts(28), "evidence_type": "inferred"},
    {"id": "b8", "source": "W5", "target": "RETURN_CLUSTER", "type": "Crypto", "amount": 3000, "asset": "USDT", "timestamp": _ts(35), "evidence_type": "inferred"},
]

CASES["CYB-2026-089"] = {
    "case_id": "CYB-2026-089",
    "title": "UPI-to-USDT Mule Syndicate",
    "description": "Rs 1.42 Cr mule network",
    "nodes": nodes_089,
    "edges": edges_089,
    "total_inr": 14200000,
    "total_usdt": 157000,
}
CASES["CYB-2026-094"] = {
    "case_id": "CYB-2026-094",
    "title": "Cross-Border Peel Chain",
    "description": "Pig-butchering peel chain",
    "nodes": nodes_094,
    "edges": edges_094,
    "total_inr": 8500000,
    "total_usdt": 94000,
}

for cid in CASES:
    add_audit(cid, "system@cybernautics.in", "System", "SEED", "Case seeded")
