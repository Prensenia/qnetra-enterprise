import sqlite3, json, os
from pathlib import Path
from .security import hash_password
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

DB_PATH = os.getenv("QNETRA_DB", str(Path(__file__).resolve().parents[2] / "qnetra.db"))

engine = create_engine("sqlite:///" + DB_PATH, echo=False)
SessionLocal = sessionmaker(bind=engine)

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT,
        badge TEXT,
        agency TEXT
    );
    CREATE TABLE IF NOT EXISTS cases (
        case_id TEXT PRIMARY KEY,
        data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        user_email TEXT,
        role TEXT,
        action TEXT,
        details TEXT,
        timestamp_utc TEXT,
        payload_sha256 TEXT,
        prev_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        name TEXT,
        key TEXT,
        created_at TEXT,
        revoked INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS notes (
        case_id TEXT PRIMARY KEY,
        notes TEXT
    );
    """)
    conn.commit()
    conn.close()
    engine = create_engine("sqlite:///" + DB_PATH, echo=False)
    Base.metadata.create_all(engine)

def seed_users():
    conn = get_conn()
    cur = conn.cursor()
    if cur.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        users = [
            ("admin@cybernautics.in", hash_password("Admin@123"), "Lead Investigator", "Admin User", "BADGE-001", "Cyber Cell Chandigarh"),
            ("auditor@cybernautics.in", hash_password("Auditor@123"), "Auditor", "Auditor User", "BADGE-002", "FIU-IND Sandbox"),
            ("victim.demo@citizen.in", hash_password("Citizen@123"), "Citizen", "Demo Victim", "", "Chandigarh"),
        ]
        cur.executemany("INSERT INTO users (email,password,role,name,badge,agency) VALUES (?,?,?,?,?,?)", users)
        conn.commit()
    conn.close()
