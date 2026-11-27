VASP_DIRECTORY = [
    {"name": "CoinDCX (Neblio Technologies Pvt Ltd)", "platform": "CoinDCX", "fiu_registered": True, "fiu_status": "FIU-IND Registered Reporting Entity", "re_id": "VA000412", "lea_email": "lea-compliance@coindcx.com", "freeze_sla": "< 4 hrs (24x7 nodal desk)", "kyc": "PAN + Aadhaar + Selfie Verified", "risk_tier": "LOW", "notes": "FIU-IND registered; nodal escrow accounts held with scheduled commercial banks.", "type": "VASPExchange"},
    {"name": "CoinSwitch (CoinSwitch Kuber)", "platform": "CoinSwitch", "fiu_registered": True, "fiu_status": "FIU-IND Registered Reporting Entity", "re_id": "VA000334", "lea_email": "compliance@coinswitch.co", "freeze_sla": "< 5 hrs", "kyc": "PAN + Aadhaar + Bank Penny Drop", "risk_tier": "LOW", "notes": "Registered with FIU-IND; responds to Sec 94 BNSS notices through its nodal compliance officer.", "type": "VASPExchange"},
    {"name": "Mudrex", "platform": "Mudrex", "fiu_registered": True, "fiu_status": "FIU-IND Registered Reporting Entity", "re_id": "VA000891", "lea_email": "compliance@mudrex.com", "freeze_sla": "< 6 hrs", "kyc": "PAN + Aadhaar", "risk_tier": "MEDIUM", "notes": "Registered with FIU-IND; smaller liquidity pool - proportionate freeze recommended.", "type": "VASPExchange"},
    {"name": "ZebPay", "platform": "ZebPay", "fiu_registered": True, "fiu_status": "FIU-IND Registered Reporting Entity", "re_id": "VA000223", "lea_email": "legal@zebpay.com", "freeze_sla": "< 5 hrs", "kyc": "PAN + Aadhaar + Video KYC", "risk_tier": "LOW", "notes": "FIU-IND registered; cooperative on Golden-Hour lien requests.", "type": "VASPExchange"},
    {"name": "WazirX (Zanmai Labs)", "platform": "WazirX", "fiu_registered": False, "fiu_status": "FIU-IND show-cause issued (Dec 2023) - not a registered reporting entity", "re_id": None, "lea_email": "compliance@wazirx.com", "freeze_sla": "6-24 hrs (case-by-case)", "kyc": "PAN + Aadhaar (post-breach re-verification)", "risk_tier": "HIGH", "notes": "Primary on-ramp in this case; no FIU-IND registration, so notices must route via Sec 94 BNSS to the nodal bank escrow as well.", "type": "VASPExchange"},
    {"name": "Binance Global (Hot Wallet #14)", "platform": "Binance", "fiu_registered": False, "fiu_status": "FIU-IND show-cause issued (Dec 2023) - offshore, not registered", "re_id": None, "lea_email": "lawenforcement@binance.com", "freeze_sla": "Non-Cooperative / MLAT required", "kyc": "Email only", "risk_tier": "CRITICAL", "notes": "Offshore entity; MLAT / Mutual Legal Assistance route required. Flag internally for sanctions screening.", "type": "VASPExchange"},
    {"name": "KuCoin Offshore Settlement", "platform": "KuCoin", "fiu_registered": False, "fiu_status": "Offshore unregistered VASP", "re_id": None, "lea_email": "lea@kucoin.com", "freeze_sla": "Non-Cooperative", "kyc": "Minimal", "risk_tier": "CRITICAL", "notes": "No Indian registration; treat as high-risk off-ramp and escalate to I4C for international cooperation.", "type": "VASPExchange"},
    {"name": "Bybit P2P Escrow", "platform": "Bybit", "fiu_registered": False, "fiu_status": "Offshore unregistered VASP (P2P desk)", "re_id": None, "lea_email": "legal@bybit.com", "freeze_sla": "Non-Cooperative", "kyc": "Phone only", "risk_tier": "HIGH", "notes": "P2P desk used for fiat-to-USDT layering; freeze only traced wallet addresses.", "type": "VASPExchange"},
    {"name": "Telegram P2P (Unregistered)", "platform": "Telegram", "fiu_registered": False, "fiu_status": "Unregistered peer-to-peer channel", "re_id": None, "lea_email": "N/A", "freeze_sla": "Non-Cooperative", "kyc": "None", "risk_tier": "CRITICAL", "notes": "No platform-level KYC; triage via UTR trail and bank mule accounts.", "type": "VASPExchange"},
]

BANK_DIRECTORY = [
    {"name": "HDFC Bank", "ifsc": "HDFC0001234", "branch": "Mumbai", "type": "BankAccount", "nodal_email": "grievance@hdfcbank.com", "fraud_desk": "1800-1600 / 1800-2600"},
    {"name": "ICICI Bank", "ifsc": "ICIC0005678", "branch": "Delhi", "type": "BankAccount", "nodal_email": "headservicequality@icicibank.com", "fraud_desk": "1800-1080"},
    {"name": "SBI", "ifsc": "SBIN0009012", "branch": "Chandigarh", "type": "BankAccount", "nodal_email": "agm.customer.service@sbi.co.in", "fraud_desk": "1800-111-221"},
    {"name": "WazirX Nodal Escrow (Bank)", "ifsc": "HDFC0000060", "branch": "Mumbai - Escrow", "type": "BankAccount", "nodal_email": "compliance@wazirx.com", "fraud_desk": "Sec 94 BNSS notice route"},
]

def find_vasp(label: str):
    lowered = (label or "").lower()
    for v in VASP_DIRECTORY:
        if v["platform"].lower() in lowered:
            return v
    return VASP_DIRECTORY[0]

def enrich_node(node):
    meta = node.get("metadata", {})
    if node["type"] == "VASPExchange":
        v = find_vasp(node["label"])
        meta.update({
            "exchange": v["name"],
            "fiu_registered": v["fiu_registered"],
            "fiu_status": v["fiu_status"],
            "re_id": v["re_id"],
            "lea_email": v["lea_email"],
            "freeze_sla": v["freeze_sla"],
            "kyc": v["kyc"],
            "risk_tier": v["risk_tier"],
            "pmla_tier": "FIU-IND Registered" if v["fiu_registered"] else "Unregistered Offshore",
            "statutory_route": "Sec 94 BNSS notice to nodal compliance" if v["fiu_registered"] else "Sec 94 BNSS + MLAT / I4C escalation",
        })
    elif node["type"] in ("BankAccount", "UPI"):
        meta.update({"ifsc": "HDFC0001234", "branch": "Mumbai", "masked_name": "A*** SHARMA", "device_imei": "35891204XXXX", "ip_asn": "AS9829", "cluster_id": "MULE_RING_01"})
    elif node["type"] == "CryptoWallet":
        meta.update({"network": "TRON TRC-20", "token": "USDT", "gas_funder": "0xgasfunder", "sanctions": False, "mixer_exposure": True, "balance": 45000, "tx_count": 120})
    node["metadata"] = meta
    return node
