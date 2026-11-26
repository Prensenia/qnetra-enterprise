# Q-Netra Enterprise Suite (Environment 1)

**Cybernautics Q-Netra** is an enterprise-grade **Cybercrime & Hybrid Financial Forensics Platform** built for **State/District Cyber Cells, FIU-IND Registered VASPs, and Bank AML Compliance Desks**. It bridges the "Fiat-to-Crypto Cliff" where traditional CFCFRMS INR tracking ends and USDT/TRON/ETH on-chain laundering begins.

---

## VBYLD Program Submission

- **Program:** VBYLD (Venture Building / Youth-Led Development initiative)
- **Product:** Q-Netra (Environment 1 — Core Cybercrime & Financial Intelligence Suite)
- **Organization:** Cybernautics
- **Focus:** Real-world Indian cybercrime triage, Golden-Hour victim relief, BNSS 2023 legal compliance, FIU-IND PMLA evidence generation, and hybrid fiat-to-crypto forensics.

---

## Key Capabilities

- **Dual-Portal Architecture:**
  - **Citizen Victim Portal (`/citizen/*`):** Calm, empathetic triage, AI Cyber Sahayak (Q-Sahayak), guided complaint wizard, evidence upload, 1930/NCRP readiness, RBI zero-liability tracker, SOS packet sharing.
  - **Officer Command Center (`/officer/*`):** Tactical dark-mode intelligence workbench with Cytoscape.js graph tracing, VASP attribution, BNSS notice generation, PDF dossier export, AI investigation co-pilot.
- **AI Q-Sahayak:** Multi-language (English, Hindi, Punjabi, Tamil, Telugu, Bengali) conversational triage with voice input/output, real LLM routing (Gemini/Groq/OpenAI) with local fallback.
- **Real-Time Ingestion:** CSV/XLSX bank/VASP statement parser with SHA-256 hashing and auto-graph upsert.
- **Blockchain Enrichment:** Modular RPC/explorer adapter with deterministic offline fallback.
- **Neo4j Behavioral Detection:** Velocity Bridge, Smurfing Ring, Peel Chain detection with risk scoring 0–100.
- **Immutable Audit Trail:** SHA-256 chained `audit_logs` in PostgreSQL/SQLite.
- **Court-Ready PDF Dossier:** `reportlab` binary PDF with Section 63 BSA 2023 certificate, graph snapshot, VASP attribution, hop ledger, audit hashes.
- **BNSS Sec 94 / Sec 106 Freeze Notice Generator:** One-click legal notice generation for banks/VASPs.
- **VASP & Exchange Intelligence Directory:** FIU-IND registration status, nodal compliance contacts, freeze SLAs.
- **Offline Resilience:** Works standalone on Vercel via Edge Standalone mock engine; full DB persistence via Docker.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, Cytoscape.js, lucide-react, sonner, recharts, tesseract.js |
| Backend | Python FastAPI, Pydantic, httpx |
| Databases | PostgreSQL + Neo4j (Docker), SQLite fallback (standalone) |
| PDF | reportlab |
| Ingestion | pandas, openpyxl |
| Auth | JWT RBAC (python-jose) |
| Infra | Docker Compose, Vercel |

---

## Repository Structure

```
qnetra-enterprise/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── store.py
│   │   ├── auth.py
│   │   ├── vasp_intel.py
│   │   ├── bank_helplines.py
│   │   ├── models.py
│   │   └── routers/
│   ├── seed_enterprise.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── citizen/
│   │   ├── officer/
│   │   └── api/q-sahayak/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── DEPLOYMENT_GUIDE.md
└── README.md
```

---

## Quick Start

### 1. Backend (standalone)
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API docs: http://127.0.0.1:8000/docs

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

### 3. Docker (full stack)
```bash
cp .env.example .env
docker-compose up --build
```
Frontend: http://localhost:3000  
Backend: http://localhost:8000

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Lead Investigator | admin@cybernautics.in | Admin@123 |
| Compliance Auditor | auditor@cybernautics.in | Auditor@123 |
| Demo Citizen | victim.demo@citizen.in | Demo@123 |

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | JWT login |
| POST | `/api/v1/auth/register` | Register citizen/officer |
| GET | `/api/v1/dashboard/summary` | KPIs + bridge queue |
| GET | `/api/v1/cases/{id}/graph` | Cytoscape graph |
| POST | `/api/v1/analyze/{id}` | Behavioral risk analysis |
| GET | `/api/v1/cases/{id}/audit` | Chain-of-custody audit |
| GET | `/api/v1/cases/{id}/correlations` | Cross-case correlations |
| POST | `/api/v1/cases/{id}/generate-notice` | BNSS Sec 94 notice |
| POST | `/api/v1/cases/{id}/export-pdf` | Binary PDF dossier |
| POST | `/api/v1/ingest/batch` | CSV/XLSX ingestion |
| POST | `/api/v1/ingest/webhook` | Live webhook |
| GET | `/api/v1/onchain/enrich/{address}` | Blockchain enrichment |
| GET | `/api/v1/vasp/directory` | VASP intelligence |
| GET/POST | `/api/v1/settings/api-keys` | API key management |
| POST | `/api/v1/citizen/ai-helper` | AI triage assistant |
| POST | `/api/v1/citizen/cases` | Submit citizen case |
| POST | `/api/v1/officer/ai-agent/{id}` | AI investigation agent |
| GET | `/health` | Service health |

---

## Environment Variables

See `.env.example` for all required variables including PostgreSQL, Neo4j, JWT, and optional LLM/RPC keys.

---

## Deployment

- **Vercel (Frontend):** https://qnetra-enterprise.vercel.app
- **GitHub:** https://github.com/Prensenia/qnetra-enterprise

---

## VBYLD Readiness

This project is designed for the VBYLD program: Indian regulatory compliance (BNSS 2023, BSA 2023, PMLA, NCRP-CFCFRMS), Golden-Hour victim relief, hybrid fiat-to-crypto forensics, and FIU-IND VASP attribution. All features are functional in both Docker (full stack) and Vercel standalone (Edge mock engine) modes.

---

## License

Proprietary — Cybernautics. All rights reserved.