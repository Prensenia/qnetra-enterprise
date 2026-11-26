VASP_DIRECTORY = [
    {"name": "CoinDCX (Neblio Technologies Pvt Ltd)", "platform": "CoinDCX", "fiu_registered": True, "re_id": "VA000412", "lea_email": "lea-compliance@coindcx.com", "freeze_sla": "< 4 hrs", "kyc": "PAN + Aadhaar + Selfie Verified", "type": "VASPExchange"},
    {"name": "Mudrex", "platform": "Mudrex", "fiu_registered": True, "re_id": "VA000891", "lea_email": "compliance@mudrex.com", "freeze_sla": "< 6 hrs", "kyc": "PAN + Aadhaar", "type": "VASPExchange"},
    {"name": "ZebPay", "platform": "ZebPay", "fiu_registered": True, "re_id": "VA000223", "lea_email": "legal@zebpay.com", "freeze_sla": "< 5 hrs", "kyc": "PAN + Aadhaar + Video KYC", "type": "VASPExchange"},
    {"name": "CoinSwitch", "platform": "CoinSwitch", "fiu_registered": True, "re_id": "VA000334", "lea_email": "compliance@coinswitch.co", "freeze_sla": "< 5 hrs", "kyc": "PAN + Aadhaar", "type": "VASPExchange"},
    {"name": "Binance Global (Hot Wallet #14)", "platform": "Binance", "fiu_registered": False, "re_id": None, "lea_email": "lawenforcement@binance.com", "freeze_sla": "Non-Cooperative", "kyc": "Email Only", "type": "VASPExchange"},
    {"name": "KuCoin Offshore Settlement", "platform": "KuCoin", "fiu_registered": False, "re_id": None, "lea_email": "lea@kucoin.com", "freeze_sla": "Non-Cooperative", "kyc": "Minimal", "type": "VASPExchange"},
    {"name": "Bybit P2P Escrow", "platform": "Bybit", "fiu_registered": False, "re_id": None, "lea_email": "legal@bybit.com", "freeze_sla": "Non-Cooperative", "kyc": "Phone Only", "type": "VASPExchange"},
    {"name": "Telegram P2P (Unregistered)", "platform": "Telegram", "fiu_registered": False, "re_id": None, "lea_email": "N/A", "freeze_sla": "Non-Cooperative", "kyc": "None", "type": "VASPExchange"},
]

BANK_DIRECTORY = [
    {"name": "HDFC Bank", "ifsc": "HDFC0001234", "branch": "Mumbai", "type": "BankAccount"},
    {"name": "ICICI Bank", "ifsc": "ICIC0005678", "branch": "Delhi", "type": "BankAccount"},
    {"name": "SBI", "ifsc": "SBIN0009012", "branch": "Chandigarh", "type": "BankAccount"},
]

def enrich_node(node):
    meta = node.get("metadata", {})
    if node["type"] == "VASPExchange":
        v = next((x for x in VASP_DIRECTORY if x["platform"].lower() in node["label"].lower()), VASP_DIRECTORY[0])
        meta.update({"exchange": v["name"], "fiu_registered": v["fiu_registered"], "re_id": v["re_id"], "lea_email": v["lea_email"], "freeze_sla": v["freeze_sla"], "kyc": v["kyc"], "pmla_tier": "FIU-IND Registered" if v["fiu_registered"] else "Unregistered Offshore"})
    elif node["type"] in ("BankAccount", "UPI"):
        meta.update({"ifsc": "HDFC0001234", "branch": "Mumbai", "masked_name": "A*** SHARMA", "device_imei": "35891204XXXX", "ip_asn": "AS9829", "cluster_id": "MULE_RING_01"})
    elif node["type"] == "CryptoWallet":
        meta.update({"network": "TRON TRC-20", "token": "USDT", "gas_funder": "0xgasfunder", "sanctions": False, "mixer_exposure": True, "balance": 45000, "tx_count": 120})
    node["metadata"] = meta
    return node
