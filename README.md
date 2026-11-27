# Q-Netra — Project Violet Milk

**Assistive Cyber-Fraud Triage & Fiat-to-Crypto Forensics for India**

`VBYLD 2027 · Assistive Technology Track` · `BSA 2023 Sec 63(4)` · `RBI Localisation ap-south-1 / bom1`

| | |
|---|---|
| **Live prototype** | https://qnetra-enterprise.vercel.app |
| **Pitch deck** | [`docs/Q-Netra_VBYLD_Pitch_Deck.pptx`](docs/Q-Netra_VBYLD_Pitch_Deck.pptx) |
| **Sample statement CSV** | [`docs/Demo_SBI_CyberFraud_Statement.csv`](docs/Demo_SBI_CyberFraud_Statement.csv) |
| **Founder** | Pranshu Joshi, Cybernautics |

Q-Netra bridges the "fiat-to-crypto cliff" — the point where CFCFRMS INR tracing stops and USDT/TRON/ETH laundering begins — and turns a panicked victim's first five minutes into a court-admissible forensic packet.

---

## Two pillars

### Pillar 1 · Q-Sahayak — assistive citizen triage
- **Bilingual voice dictation + speech read-out** in six Indian languages (`en`, `hi`, `pa`, `ta`, `te`, `bn`).
- **`A+` Accessibility Mode** — 115% text scaling with high-contrast text and borders for elderly and Divyangjan users.
- **Golden-Hour `02:00:00` countdown** with one-tap `1930` NCRP routing and `XXNCRP` 14-digit acknowledgement validation.
- **SHA-256 victim receipt** — evidence is hashed with Web Crypto before a byte leaves the device.

### Pillar 2 · Officer Workbench — police forensic co-pilot
- **Multi-bank CSV normaliser** — SBI/HDFC/ICICI exports mapped to UTR, amount, IST timestamp and bank, whatever the column names.
- **Cytoscape fund-flow graph** driven by the active route `caseId` or the selected node (never a hardcoded wallet).
- **Section 168 read with Section 94 BNSS 2023** freeze notice, with a Section 106(1) restoration clause and proportional dilution safeguard.
- **Section 63(4) BSA 2023 dossier** — Part A (IO) and Part B (forensic examiner) certificate, SHA-256 table and dilution annexure, plus a print-ready A4 HTML fallback when the reporting host is unreachable.

---

## Statutory & regulatory compliance

| Provision | Where it is implemented |
|---|---|
| **Section 63(4) BSA 2023** — Part A / Part B electronic evidence certificates | `backend/app/routers/reporting.py`, `frontend/lib/api.js` (offline A4 fallback) |
| **Section 168 read with Section 94 BNSS 2023** — immediate bank / VASP lien and production of records | `frontend/components/organs/AssistiveCoPilot.jsx` |
| **Section 106(1) BNSS 2023** — restoration of property, proportional freeze only | Freeze notice and dossier annexure |
| **I4C CFCFRMS / 1930** — golden-hour reporting and NCRP acknowledgement | `frontend/components/GoldenHourBanner.jsx`, `frontend/app/citizen/helpdesk/page.jsx` |
| **RBI data localisation (DPSS.CO.OD.No 2785)** — Mumbai-only hosting | `vercel.json` (`bom1`), `docker-compose.yml` (`ap-south-1`) |
| **FIU-IND PMLA** — VASP reporting status and nodal desks | `backend/app/vasp_intel.py`, `frontend/lib/vaspFallback.js` |

---

## Proportional dilution & deterministic risk

```
New taint ratio = Dirty received  /  Total balance post-receipt
                = (received x prior ratio) / (pre-balance + received)
```

Each hop decays the tainted share; the final figure bounds how much of a balance may lawfully be frozen, so innocent customer funds and commingled exchange liquidity pools are never swept up.

Deterministic rule-based risk (0-100): **+20** mixer exposure, **+15** rapid fan-out (>5 tx/min), **+20** scam-cluster proximity, **+15** cross-chain bridge traversal.

---

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Lead Investigator | `admin@cybernautics.in` | `Admin@123` |
| Compliance Auditor | `auditor@cybernautics.in` | `Auditor@123` |
| Demo Citizen | `victim.demo@citizen.in` | `Citizen@123` |

On the hosted prototype these three sign in through **demo mode** when the FastAPI host is unreachable: the same session, case queue, graph, risk panel and dossier export run from seeded data.

**1-click demo:** open `/officer/investigate/CP-CYBER-2026-001` and press **"Load Sample SBI Fraud CSV (Demo)"** — the sample runs through the real ingest path (Web Crypto SHA-256 → header detection → IST normalisation → graph).

---

## Quickstart

```bash
# Full stack (PostgreSQL + Neo4j + FastAPI + Next.js)
cp .env.example .env
docker-compose up --build          # frontend :3000 · backend :8000

# Backend only
cd backend
python -m venv .venv && .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend only
cd frontend
npm install
npm run dev                        # http://127.0.0.1:3000
```

Verification: `python -c "from app.main import app; print('BACKEND_OK')"` in `backend/`, and `npm run build` in `frontend/`.

---

## Repository map

```
qnetra-enterprise/
├── backend/app/
│   ├── routers/        auth · cases · citizen · officer · reporting · vasp · forensics
│   ├── security.py     PBKDF2-SHA256 hashing (hmac.compare_digest)
│   ├── vasp_intel.py   FIU-IND directory and node enrichment
│   └── store.py        seeded cases, audit chain
├── frontend/
│   ├── app/citizen/    Q-Sahayak helpdesk, my cases
│   ├── app/officer/    dashboard, investigate/[caseId], vasp-directory
│   ├── components/     GoldenHourBanner, QSahayakBot, organs/*
│   ├── hooks/          useFileIngest (SHA-256 + CSV normaliser)
│   └── lib/            api.js (live + offline demo), translations, a11y
├── docs/               pitch deck, sample statement, spec
├── docker-compose.yml  ap-south-1 Mumbai pinning
└── vercel.json         bom1 region
```

---

## Mandatory statutory disclaimer

> **This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.**
>
> Every freeze notice and dossier is a draft for the Investigating Officer's review and signature (DSC). All figures are demonstration data.

Proprietary — Cybernautics. All rights reserved.
