FALLBACK = {
    "nodes": [
        {"id": "victim_sbi_9812", "type": "VICTIM", "label": "Victim (SBI UPI)", "loss_inr": 500000},
        {"id": "SBI-9920182", "type": "BANK", "label": "State Bank of India", "utr": "420192830192"},
        {"id": "0xCEX_WazirX_Hot", "type": "EXCHANGE", "label": "Centralized Exchange Deposit"},
        {"id": "0xA7F367e92d11b890", "type": "WALLET", "label": "Primary Mule Wallet", "risk_score": 70},
        {"id": "0xBridge_Polygon_ETH", "type": "BRIDGE", "label": "Cross-Chain Liquidity Bridge"},
        {"id": "0xMixer_Tornado_Pool", "type": "MIXER", "label": "Mixer Contract"},
        {"id": "0xB82C104a", "type": "WALLET", "label": "Downstream 1", "risk_score": 60},
        {"id": "0xC91D882f", "type": "WALLET", "label": "Downstream 2", "risk_score": 60},
        {"id": "0xD44E120b", "type": "WALLET", "label": "Downstream 3", "risk_score": 60},
    ],
    "edges": [
        {"id": "e1", "source": "victim_sbi_9812", "target": "SBI-9920182", "tx_hash": "0xabc1", "amount": 470000, "token": "INR", "timestamp": "2026-09-08T10:31:04+05:30"},
        {"id": "e2", "source": "SBI-9920182", "target": "0xCEX_WazirX_Hot", "tx_hash": "0xabc2", "amount": 470000, "token": "INR", "timestamp": "2026-09-08T10:32:00+05:30"},
        {"id": "e3", "source": "0xCEX_WazirX_Hot", "target": "0xA7F367e92d11b890", "tx_hash": "0xabc3", "amount": 5200, "token": "USDT", "timestamp": "2026-09-08T10:33:00+05:30"},
        {"id": "e4", "source": "0xA7F367e92d11b890", "target": "0xBridge_Polygon_ETH", "tx_hash": "0xabc4", "amount": 2000, "token": "USDT", "timestamp": "2026-09-08T10:34:00+05:30"},
        {"id": "e5", "source": "0xA7F367e92d11b890", "target": "0xMixer_Tornado_Pool", "tx_hash": "0xabc5", "amount": 3200, "token": "USDT", "timestamp": "2026-09-08T10:35:00+05:30"},
        {"id": "e6", "source": "0xBridge_Polygon_ETH", "target": "0xB82C104a", "tx_hash": "0xabc6", "amount": 1000, "token": "USDT", "timestamp": "2026-09-08T10:36:00+05:30"},
        {"id": "e7", "source": "0xMixer_Tornado_Pool", "target": "0xC91D882f", "tx_hash": "0xabc7", "amount": 1500, "token": "USDT", "timestamp": "2026-09-08T10:37:00+05:30"},
        {"id": "e8", "source": "0xMixer_Tornado_Pool", "target": "0xD44E120b", "tx_hash": "0xabc8", "amount": 1700, "token": "USDT", "timestamp": "2026-09-08T10:38:00+05:30"},
    ],
}

def get_hops(wallet_id):
    # return 1..3 hops from wallet_id based on fallback edges
    nodes = {n["id"]: n for n in FALLBACK["nodes"]}
    edges = FALLBACK["edges"]
    # BFS
    result_nodes = set([wallet_id])
    result_edges = []
    frontier = [wallet_id]
    for _ in range(3):
        next_frontier = []
        for f in frontier:
            for e in edges:
                if e["source"] == f:
                    result_nodes.add(e["target"])
                    result_edges.append(e)
                    next_frontier.append(e["target"])
        frontier = next_frontier
    nodes_out = [nodes[n] for n in result_nodes if n in nodes]
    edges_out = [e for e in result_edges]
    return {"nodes": nodes_out, "edges": edges_out}

def risk(wallet_id):
    # deterministic
    score = 0
    breakdown = {}
    # mixer exposure
    if any(e["target"] == "0xMixer_Tornado_Pool" and e["source"] == wallet_id for e in FALLBACK["edges"]) or wallet_id == "0xA7F367e92d11b890":
        score += 20
        breakdown["mixer_exposure"] = 20
    # fan-out
    outs = [e for e in FALLBACK["edges"] if e["source"] == wallet_id]
    if len(outs) > 5:
        score += 15
        breakdown["rapid_fanout"] = 15
    # proximity to flagged cluster
    if wallet_id in ("0xA7F367e92d11b890", "0xB82C104a", "0xC91D882f", "0xD44E120b"):
        score += 20
        breakdown["scam_cluster_proximity"] = 20
    # bridge traversal
    if any(e["source"] == wallet_id and e["target"].startswith("0xBridge") for e in FALLBACK["edges"]) or wallet_id == "0xA7F367e92d11b890":
        score += 15
        breakdown["bridge_traversal"] = 15
    level = "CRITICAL" if score >= 60 else "HIGH" if score >= 40 else "MEDIUM" if score >= 20 else "LOW"
    return {"overall_score": score, "risk_level": level, "score_breakdown": breakdown, "legal_disclaimer": "This is an analytical lead, not a final finding of guilt."}

def dilution(initial_taint_ratio, hops):
    current_ratio = initial_taint_ratio
    trace = []
    for h in hops:
        pre = h["pre_balance"]
        received = h["received_amount"]
        new_ratio = (received * current_ratio) / (pre + received) if (pre + received) else current_ratio
        trace.append({"wallet_address": h["wallet_address"], "pre_balance": pre, "received_amount": received, "new_ratio": new_ratio})
        current_ratio = new_ratio
    return {"initial_taint_ratio": initial_taint_ratio, "steps": trace, "final_ratio": current_ratio, "legal_disclaimer": "This is an analytical lead, not a final finding of guilt."}
