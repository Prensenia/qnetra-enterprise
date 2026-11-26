import hashlib, json, uuid, os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from .db import get_conn, init_db, seed_users
from .vasp_intel import enrich_node

init_db()
seed_users()

USERS = {}
conn = get_conn()
for r in conn.execute("SELECT * FROM users").fetchall():
    USERS[r["email"]] = {"password": r["password"], "role": r["role"], "name": r["name"], "badge": r["badge"], "agency": r["agency"]}
conn.close()

CASES: Dict[str, Dict[str, Any]] = {}
AUDIT_LOGS: List[Dict[str, Any]] = []
API_KEYS: List[Dict[str, Any]] = []

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()

def _ts(minutes: int) -> str:
    base = datetime(2026, 3, 15, 10, 0, 0)
    return (base + timedelta(minutes=minutes)).isoformat() + "+05:30"

# Seed cases
nodes_089 = [
    {"id": "VICTIM_001", "type": "BankAccount", "label": "Victim Account", "risk_score": 10, "risk_tier": "LOW", "amount_inr": 14200000, "timestamp": _ts(0), "metadata": {}},
    {"id": "UPI_MULE_1", "type": "UPI", "label": "Mule UPI 1", "risk_score": 78, "risk_tier": "HIGH", "amount_inr": 2300000, "timestamp": _ts(5), "metadata": {}},
    {"id": "UPI_MULE_2", "type": "UPI", "label": "Mule UPI 2", "risk_score": 72, "risk_tier": "HIGH", "amount_inr": 2100000, "timestamp": _ts(7), "metadata": {}},
    {"id": "UPI_MULE_3", "type": "UPI", "label": "Mule UPI 3", "risk_score": 80, "risk_tier": "HIGH", "amount_inr": 2500000, "timestamp": _ts(9), "metadata": {}},
    {"id": "UPI_MULE_4", "type": "UPI", "label": "Mule UPI 4", "risk_score": 75, "risk_tier": "HIGH", "amount_inr": 2400000, "timestamp": _ts(11), "metadata": {}},
    {"id": "UPI_MULE_5", "type": "UPI", "label": "Mule UPI 5", "risk_score": 70, "risk_tier": "HIGH", "amount_inr": 2200000, "timestamp": _ts(13), "metadata": {}},
    {"id": "UPI_MULE_6", "type": "UPI", "label": "Mule UPI 6", "risk_score": 82, "risk_tier": "HIGH", "amount_inr": 2700000, "timestamp": _ts(15), "metadata": {}},
    {"id": "CONSOL_BANK", "type": "BankAccount", "label": "Consolidation Bank", "risk_score": 90, "risk_tier": "CRITICAL", "amount_inr": 14200000, "timestamp": _ts(20), "metadata": {}},
    {"id": "VASP_ONRAMP", "type": "VASPExchange", "label": "CoinDCX On-Ramp (Neblio)", "risk_score": 65, "risk_tier": "HIGH", "amount_usdt": 157000, "timestamp": _ts(25), "metadata": {}},
    {"id": "WALLET_TRON_1", "type": "CryptoWallet", "label": "TRON Wallet 1", "risk_score": 88, "risk_tier": "CRITICAL", "amount_usdt": 80000, "timestamp": _ts(30), "metadata": {}},
    {"id": "WALLET_TRON_2", "type": "CryptoWallet", "label": "TRON Wallet 2", "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": 45000, "timestamp": _ts(32), "metadata": {}},
    {"id": "WALLET_ETH_1", "type": "CryptoWallet", "label": "ETH Wallet 1", "risk_score": 80, "risk_tier": "HIGH", "amount_usdt": 32000, "timestamp": _ts(35), "metadata": {}},
    {"id": "MIXER_1", "type": "Mixer", "label": "Mixer (Tornado-style)", "risk_score": 95, "risk_tier": "CRITICAL", "amount_usdt": 120000, "timestamp": _ts(40), "metadata": {}},
    {"id": "OFFSHORE_1", "type": "SanctionedCluster", "label": "Binance Hot Wallet #14", "risk_score": 99, "risk_tier": "CRITICAL", "amount_usdt": 100000, "timestamp": _ts(50), "metadata": {}},
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
for n in nodes_089:
    enrich_node(n)

nodes_094 = [
    {"id": "VICTIM_B", "type": "BankAccount", "label": "Victim B", "risk_score": 15, "risk_tier": "LOW", "amount_inr": 8500000, "timestamp": _ts(0), "metadata": {}},
    {"id": "FIAT_BRIDGE", "type": "BankAccount", "label": "Fiat Bridge", "risk_score": 60, "risk_tier": "ELEVATED", "amount_inr": 8500000, "timestamp": _ts(10), "metadata": {}},
    {"id": "VASP_B", "type": "VASPExchange", "label": "Mudrex", "risk_score": 70, "risk_tier": "HIGH", "amount_usdt": 94000, "timestamp": _ts(15), "metadata": {}},
    {"id": "W1", "type": "CryptoWallet", "label": "Wallet 1", "risk_score": 75, "risk_tier": "HIGH", "amount_usdt": 94000, "timestamp": _ts(20), "metadata": {}},
    {"id": "W2", "type": "CryptoWallet", "label": "Wallet 2", "risk_score": 78, "risk_tier": "HIGH", "amount_usdt": 47000, "timestamp": _ts(22), "metadata": {}},
    {"id": "W3", "type": "CryptoWallet", "label": "Wallet 3", "risk_score": 80, "risk_tier": "HIGH", "amount_usdt": 23500, "timestamp": _ts(24), "metadata": {}},
    {"id": "W4", "type": "CryptoWallet", "label": "Wallet 4", "risk_score": 82, "risk_tier": "HIGH", "amount_usdt": 11750, "timestamp": _ts(26), "metadata": {}},
    {"id": "W5", "type": "CryptoWallet", "label": "Wallet 5", "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": 5875, "timestamp": _ts(28), "metadata": {}},
    {"id": "RETURN_CLUSTER", "type": "SanctionedCluster", "label": "Return Cluster", "risk_score": 90, "risk_tier": "CRITICAL", "amount_usdt": 3000, "timestamp": _ts(35), "metadata": {}},
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
for n in nodes_094:
    enrich_node(n)

def save_case(case):
    conn = get_conn()
    conn.execute("INSERT OR REPLACE INTO cases (case_id, data) VALUES (?,?)", (case["case_id"], json.dumps(case)))
    conn.commit()
    conn.close()

def load_cases():
    conn = get_conn()
    rows = conn.execute("SELECT data FROM cases").fetchall()
    conn.close()
    return [json.loads(r["data"]) for r in rows]

# seed if empty
conn = get_conn()
if conn.execute("SELECT COUNT(*) FROM cases").fetchone()[0] == 0:
    conn.close()


    nodes_101 = [
        {"id": "HDFC_VICTIM_ARJUN", "type": "BankAccount", "label": "HDFC Victim (Arjun)", "risk_score": 10, "risk_tier": "LOW", "amount_inr": 285000, "timestamp": _ts(0), "metadata": {"bank": "HDFC Bank"}},
        {"id": "UPI_MULE_DESK99", "type": "UPI", "label": "desk.settlement99@okicici", "risk_score": 80, "risk_tier": "HIGH", "amount_inr": 150000, "timestamp": _ts(10), "metadata": {}},
        {"id": "UPI_MULE_PAYTM81", "type": "UPI", "label": "UPI_MULE_PAYTM81@paytm", "risk_score": 78, "risk_tier": "HIGH", "amount_inr": 135000, "timestamp": _ts(12), "metadata": {}},
        {"id": "COINDCX_NODAL_ESCROW", "type": "VASPExchange", "label": "CoinDCX Nodal Escrow", "risk_score": 70, "risk_tier": "HIGH", "amount_usdt": 3166, "timestamp": _ts(18), "metadata": {}},
        {"id": "TRON_WALLET_101", "type": "CryptoWallet", "label": "TRON Wallet", "risk_score": 85, "risk_tier": "CRITICAL", "amount_usdt": 3166, "timestamp": _ts(21), "metadata": {}},
    ]
    edges_101 = [
        {"id": "h1", "source": "HDFC_VICTIM_ARJUN", "target": "UPI_MULE_DESK99", "type": "UPI", "amount": 150000, "asset": "INR", "timestamp": _ts(10), "evidence_type": "confirmed"},
        {"id": "h2", "source": "HDFC_VICTIM_ARJUN", "target": "UPI_MULE_PAYTM81", "type": "UPI", "amount": 135000, "asset": "INR", "timestamp": _ts(12), "evidence_type": "confirmed"},
        {"id": "h3", "source": "UPI_MULE_DESK99", "target": "COINDCX_NODAL_ESCROW", "type": "Exchange", "amount": 150000, "asset": "INR", "timestamp": _ts(18), "evidence_type": "confirmed"},
        {"id": "h4", "source": "UPI_MULE_PAYTM81", "target": "COINDCX_NODAL_ESCROW", "type": "Exchange", "amount": 135000, "asset": "INR", "timestamp": _ts(18), "evidence_type": "confirmed"},
        {"id": "h5", "source": "COINDCX_NODAL_ESCROW", "target": "TRON_WALLET_101", "type": "Crypto", "amount": 3166, "asset": "USDT", "timestamp": _ts(21), "evidence_type": "inferred"},
    ]
    for n in nodes_101:
        enrich_node(n)
    c101 = {"case_id": "CYB-2026-101", "title": "HDFC-to-CoinDCX Rs 2.85L Urgent Citizen Packet", "description": "Arjun Sharma citizen complaint", "complainant": {"name": "Arjun Sharma", "email": "victim.demo@citizen.in"}, "scam_type": "Pig-Butchering", "amount_inr": 285000, "status": "NEW_CITIZEN_REPORT", "nodes": nodes_101, "edges": edges_101, "total_inr": 285000, "total_usdt": 3166, "triage_summary": "Q-Sahayak triage: HDFC bank, amount 285000, UTRs 432918475612, 432918475988. Downstream platforms: HDFC Bank, ICICI/Paytm Mule Nodal Desk, CoinDCX FIU-IND Compliance Desk."}

    c1 = {"case_id": "CYB-2026-089", "title": "UPI-to-USDT Mule Syndicate", "description": "Rs 1.42 Cr mule network", "nodes": nodes_089, "edges": edges_089, "total_inr": 14200000, "total_usdt": 157000}
    c2 = {"case_id": "CYB-2026-094", "title": "Cross-Border Peel Chain", "description": "Pig-butchering peel chain", "nodes": nodes_094, "edges": edges_094, "total_inr": 8500000, "total_usdt": 94000}
    save_case(c1)
    save_case(c2)
    save_case(c101)
else:
    conn.close()

for c in load_cases():
    CASES[c["case_id"]] = c

# load audit logs
conn = get_conn()
for r in conn.execute("SELECT * FROM audit_logs").fetchall():
    AUDIT_LOGS.append(dict(r))
# load api keys
for r in conn.execute("SELECT * FROM api_keys").fetchall():
    API_KEYS.append({"id": r["id"], "name": r["name"], "key": r["key"], "created_at": r["created_at"], "revoked": bool(r["revoked"])})
conn.close()

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
    conn = get_conn()
    conn.execute("INSERT INTO audit_logs (id,case_id,user_email,role,action,details,timestamp_utc,payload_sha256,prev_hash) VALUES (?,?,?,?,?,?,?,?,?)",
                 (entry["id"], entry["case_id"], entry["user_email"], entry["role"], entry["action"], entry["details"], entry["timestamp_utc"], entry["payload_sha256"], entry["prev_hash"]))
    conn.commit()
    conn.close()
    return entry

def save_case(case):
    conn = get_conn()
    conn.execute("INSERT OR REPLACE INTO cases (case_id, data) VALUES (?,?)", (case["case_id"], json.dumps(case)))
    conn.commit()
    conn.close()
    CASES[case["case_id"]] = case

def add_api_key(name):
    key = {"id": str(uuid.uuid4()), "name": name, "key": "qnetra_" + uuid.uuid4().hex, "created_at": datetime.utcnow().isoformat() + "Z", "revoked": False}
    API_KEYS.append(key)
    conn = get_conn()
    conn.execute("INSERT INTO api_keys (id,name,key,created_at,revoked) VALUES (?,?,?,?,?)", (key["id"], key["name"], key["key"], key["created_at"], 0))
    conn.commit()
    conn.close()
    return key
