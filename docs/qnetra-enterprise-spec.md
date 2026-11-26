# Q-Netra Enterprise Suite — Full Architecture & UI Specification (Environment 1)

## 1. Visual Design System
- **Theme:** Dark Tactical Intelligence (`#090D16` obsidian canvas, `#111827` elevated panels, `#1E293B` subtle borders, `#06B6D4` cyan primary accents, `#EF4444` critical risk, `#F59E0B` elevated risk, `#10B981` verified/healthy).
- **Typography:** Clean sans-serif UI (`Inter`) + monospace (`JetBrains Mono`) for wallet hashes, UTR numbers, timestamps, and SHA-256 checksums.

## 2. Core User Flows
1. **Login (`/login`):** Pre-filled quick-fill pills for `admin@cybernautics.in` (Lead Investigator) and `auditor@cybernautics.in` (Auditor) for frictionless live demos.
2. **Executive Triage Dashboard (`/dashboard`):**
   - Top Command Bar with Agency Switcher, Global Search, System Health Telemetry, and `+ Ingest Evidence` / `Simulate Live Webhook` buttons.
   - 4 KPI Cards + Live Suspicious Bridge Queue table -> clicks directly into `/investigate/[caseId]`.
3. **3-Pane Investigation Workspace (`/investigate/[caseId]`):**
   - **Left Rail:** Case summary, evidence files + SHA-256 hashes, watchlist, and Chain-of-Custody Audit Log viewer.
   - **Center Canvas:** Cytoscape.js interactive graph with node taxonomy shapes, layout switchers (`Dagre`, `Concentric`, `Force`), INR/USDT threshold slider, Mule Ring collapse/expand, Shortest Path isolator, and **Temporal Playback Scrubber** (Play/Pause/Step through hops).
   - **Right Inspector Drawer:** Node/edge risk score (0–100), triggered Neo4j behavioral rules, metadata, analyst notes, and **Export Forensic Dossier (PDF)**.
4. **API Keys & Enterprise Integration (`/settings/api-keys`):** Generate/revoke API keys and copy cURL/Python webhook integration snippets for banks and exchanges.
