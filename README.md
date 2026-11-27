# Q-Netra — Project Violet Milk

**Assistive Cyber-Fraud Triage & Fiat-to-Crypto Forensics for India**

`VBYLD 2027 · Assistive Technology Track` · `BSA 2023 Sec 63(4)` · `RBI Localisation ap-south-1 / bom1`

| | |
|---|---|
| **Live prototype** | https://qnetra-enterprise.vercel.app |
| **Pitch deck (PowerPoint)** | [`docs/Q-Netra_VBYLD_Pitch_Deck.pptx`](docs/Q-Netra_VBYLD_Pitch_Deck.pptx) |
| **Pitch deck (HTML, present in the browser)** | [`docs/pitch-deck.html`](docs/pitch-deck.html) — ←/→ to move, Ctrl/Cmd+P for a landscape PDF |
| **Pitch deck (PDF, 6 slides, A4 landscape)** | [`docs/Q-Netra_VBYLD_Pitch_Deck.pdf`](docs/Q-Netra_VBYLD_Pitch_Deck.pdf) — opens on any phone or locked-down laptop, no PowerPoint needed |
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

## Presentation script — 4 minutes

Every officer and citizen screen has a **Voice guide → Explain this screen** button that reads the screen aloud with live captions (Hindi included). The captions are exactly the words below, so the product and the pitch never drift apart.

| Time | Screen | Click | Say |
|---|---|---|---|
| 0:00 | `/login` | — | "A cyber fraud victim in India has about thirty minutes before the money leaves the country. The system takes forty-eight hours. I'm Pranshu, this is Q-Netra." |
| 0:20 | `/login` | **Demo: Citizen (Victim)** → **Sign In** | "Three roles in one product: victim, investigating officer, compliance auditor. Start where the clock starts." |
| 0:35 | `/citizen/helpdesk` | Point at the countdown; **Voice guide → Explain this screen** | "The golden hour, running live. No lawyer, no hash, no statute — three steps." |
| 1:00 | Q-Sahayak | *"I transferred ₹2,85,000 from HDFC to wallet TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE 25 minutes ago"* | "She describes it in her own words. Q-Sahayak extracts the amount, the bank and the wallet, and answers in her language — six languages, no API key required." |
| 1:25 | Q-Sahayak | Switch language to **हिन्दी** | "Same product, same case, her language." |
| 1:35 | `/officer/dashboard` | Scroll to the ledger | "On the officer's side it is already triaged — three live cases, ₹2.27 crore in scope, a new citizen submission flagged before anyone opened a file." |
| 1:55 | Ledger | Point at **[✓] SHA-256 INTEGRITY VERIFIED** | "Every action is hash-chained and re-verified on screen. Section 63 BSA, not a slide." |
| 2:10 | `CYB-2026-089` | **Launch Investigation** — let the graph draw, stay quiet 2 s | "This is the money moving: ₹4.70 lakh out of SBI by UPI, 5,200 USDT at WazirX, then split across a bridge and a mixer. Five hops, twenty-one minutes." |
| 2:35 | Workspace | Point at **70/100 CRITICAL**, then the four rules | "Seventy, and every point has a reason: mixer exposure, scam-cluster proximity, bridge traversal, fan-out. Ask me why any number is what it is." |
| 2:55 | Dilution panel | Then **Export Sec 63 BSA Dossier PDF** | "Courts don't ask whether the money is dirty, they ask how much of the account is. 60% decays to 12% across five hops, so we freeze twelve percent, not the account. One click, and the dossier is out — four hours becomes under a second." |
| 3:20 | Dossier modal | Stop on the Section 94 line | "And it says what it is: an analytical lead, not a finding of guilt, requiring independent verification under Section 94 BNSS. We don't accuse anyone; we make the first hour defensible." |
| 3:40 | Dispatch (Auditor) | On `/officer/dashboard`, sign in as **Demo: Compliance Auditor**, then press **Dispatch** on case `CYB-2026-089` and show the read-only banner | "The auditor verifies everything and dispatches nothing. Separation of duty is in the product." |
| 3:55 | — | Hands off the laptop | "Q-Netra doesn't investigate faster. It makes the first hour count." |

**If it breaks:** pre-signed-in tab for a slow login · refresh once for a blank graph · captions carry the voice if audio is blocked · the amber chip is deliberate — "every screen runs the same contracts the FastAPI service exposes; `docker compose up` swaps seeded data for live ingestion with no UI change."

**Answers ready:** risk score = four fixed-weight rules with a reason string each · AI extracts deterministically so a hallucinated UTR never reaches the form · offline is a procurement requirement, not a fallback · who pays = cyber cells and bank AML desks, dossier generator as the wedge.

---

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Lead Investigator | `admin@cybernautics.in` | `Admin@123` |
| Compliance Auditor | `auditor@cybernautics.in` | `Auditor@123` |
| Demo Citizen | `victim.demo@citizen.in` | `Citizen@123` |

On the hosted prototype these three sign in through **demo mode** when the FastAPI host is unreachable: the same session, case queue, graph, risk panel and dossier export run from seeded data.

**1-click demo:** open `/officer/investigate/CP-CYBER-2026-001` and press **"Load Sample SBI Fraud CSV (Demo)"** — the sample runs through the real ingest path (Web Crypto SHA-256 → header detection → IST normalisation → graph).

**Judge run-sheet (10 minutes):** 5 minutes on [`docs/pitch-deck.html`](docs/pitch-deck.html) (problem → pillars → workflow → why it wins → impact), then 5 minutes live: citizen helpdesk (Golden Hour, A+, NCRP) → officer dashboard → sample CSV load (hash) → Verify All Hashes → node risk 70/100 → Sec 63(4) BSA dossier → VASP directory.

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
