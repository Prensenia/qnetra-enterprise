import os
from neo4j import GraphDatabase

URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "qnetra_neo4j_secure_2026")

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

def seed(tx):
    tx.run("CREATE CONSTRAINT wallet_address IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE")
    tx.run("CREATE CONSTRAINT bank_account IF NOT EXISTS FOR (b:Bank) REQUIRE b.account_number IS UNIQUE")
    # nodes
    tx.run("MERGE (v:Victim {address:'victim_sbi_9812'}) SET v.name='Victim (SBI UPI)', v.loss_inr=500000")
    tx.run("MERGE (b:Bank {account_number:'SBI-9920182'}) SET b.bank_name='State Bank of India', b.utr='420192830192'")
    tx.run("MERGE (e:Exchange {address:'0xCEX_WazirX_Hot'}) SET e.name='Centralized Exchange Deposit'")
    tx.run("MERGE (w:Wallet {address:'0xA7F367e92d11b890'}) SET w.risk_score=70, w.label='Primary Mule Wallet'")
    tx.run("MERGE (br:Bridge {address:'0xBridge_Polygon_ETH'}) SET br.name='Cross-Chain Liquidity Bridge'")
    tx.run("MERGE (m:Mixer {address:'0xMixer_Tornado_Pool'}) SET m.name='Mixer Contract'")
    for addr in ["0xB82C104a", "0xC91D882f", "0xD44E120b"]:
        tx.run("MERGE (w:Wallet {address:$a}) SET w.risk_score=60", a=addr)
    # relationships
    tx.run("MATCH (v:Victim {address:'victim_sbi_9812'}), (b:Bank {account_number:'SBI-9920182'}) MERGE (v)-[:SENDS_TO {tx_hash:'0xabc1', amount:470000, token:'INR', timestamp:'2026-09-08T10:31:04+05:30'}]->(b)")
    tx.run("MATCH (b:Bank {account_number:'SBI-9920182'}), (e:Exchange {address:'0xCEX_WazirX_Hot'}) MERGE (b)-[:SENDS_TO {tx_hash:'0xabc2', amount:470000, token:'INR', timestamp:'2026-09-08T10:32:00+05:30'}]->(e)")
    tx.run("MATCH (e:Exchange {address:'0xCEX_WazirX_Hot'}), (w:Wallet {address:'0xA7F367e92d11b890'}) MERGE (e)-[:SENDS_TO {tx_hash:'0xabc3', amount:5200, token:'USDT', timestamp:'2026-09-08T10:33:00+05:30'}]->(w)")
    tx.run("MATCH (w:Wallet {address:'0xA7F367e92d11b890'}), (br:Bridge {address:'0xBridge_Polygon_ETH'}) MERGE (w)-[:SENDS_TO {tx_hash:'0xabc4', amount:2000, token:'USDT', timestamp:'2026-09-08T10:34:00+05:30'}]->(br)")
    tx.run("MATCH (w:Wallet {address:'0xA7F367e92d11b890'}), (m:Mixer {address:'0xMixer_Tornado_Pool'}) MERGE (w)-[:SENDS_TO {tx_hash:'0xabc5', amount:3200, token:'USDT', timestamp:'2026-09-08T10:35:00+05:30'}]->(m)")
    tx.run("MATCH (br:Bridge {address:'0xBridge_Polygon_ETH'}), (w:Wallet {address:'0xB82C104a'}) MERGE (br)-[:SENDS_TO {tx_hash:'0xabc6', amount:1000, token:'USDT', timestamp:'2026-09-08T10:36:00+05:30'}]->(w)")
    tx.run("MATCH (m:Mixer {address:'0xMixer_Tornado_Pool'}), (w:Wallet {address:'0xC91D882f'}) MERGE (m)-[:SENDS_TO {tx_hash:'0xabc7', amount:1500, token:'USDT', timestamp:'2026-09-08T10:37:00+05:30'}]->(w)")
    tx.run("MATCH (m:Mixer {address:'0xMixer_Tornado_Pool'}), (w:Wallet {address:'0xD44E120b'}) MERGE (m)-[:SENDS_TO {tx_hash:'0xabc8', amount:1700, token:'USDT', timestamp:'2026-09-08T10:38:00+05:30'}]->(w)")

def main():
    with driver.session() as session:
        session.execute_write(seed)
    print("Neo4j seed complete")
    driver.close()

if __name__ == "__main__":
    main()
