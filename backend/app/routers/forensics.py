from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Dict, Any
import os
from ..graph_store import get_hops, risk, dilution
from ..config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
from ..auth import get_current_user

router = APIRouter(tags=["forensics"])

try:
    from neo4j import GraphDatabase
    _driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
except Exception:
    _driver = None

def neo4j_available():
    if _driver is None:
        return False
    try:
        with _driver.session() as s:
            s.run("RETURN 1")
        return True
    except Exception:
        return False

@router.get("/api/hops/{wallet_id}")
def hops(wallet_id: str, user=Depends(get_current_user)):
    if neo4j_available():
        try:
            with _driver.session() as session:
                res = session.run("MATCH path = (start {address: $w})-[r:SENDS_TO*1..3]->(downstream) RETURN path", w=wallet_id)
                nodes = {}
                edges = []
                for record in res:
                    path = record["path"]
                    for n in path.nodes:
                        nid = n.get("address") or n.get("account_number") or str(n.id)
                        ntype = list(n.labels)[0] if n.labels else "NODE"
                        nodes[nid] = {"id": nid, "type": ntype, "label": n.get("name") or n.get("label") or nid}
                    for r in path.relationships:
                        edges.append({"id": str(r.id), "source": r.start_node.get("address") or r.start_node.get("account_number"), "target": r.end_node.get("address") or r.end_node.get("account_number"), "tx_hash": r.get("tx_hash"), "amount": r.get("amount"), "token": r.get("token"), "timestamp": r.get("timestamp")})
                return {"nodes": list(nodes.values()), "edges": edges}
        except Exception:
            pass
    return get_hops(wallet_id)

class DilutionHop(BaseModel):
    wallet_address: str
    pre_balance: float
    received_amount: float

class DilutionRequest(BaseModel):
    initial_taint_ratio: float
    hops: List[DilutionHop]

@router.post("/api/dilution/calculate")
def calc_dilution(req: DilutionRequest, user=Depends(get_current_user)):
    hops_list = [h.dict() for h in req.hops]
    return dilution(req.initial_taint_ratio, hops_list)

@router.get("/api/risk/{wallet_id}")
def risk_endpoint(wallet_id: str, user=Depends(get_current_user)):
    return risk(wallet_id)
