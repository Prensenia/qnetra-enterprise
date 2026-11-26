# AGENTS.md — Q-Netra Enterprise Suite (Cybernautics)

## Project Identity
- **Product:** Q-Netra (Environment 1 — Core Cybercrime & Financial Intelligence Suite)
- **Organization:** Cybernautics
- **Tech Stack:** Next.js (App Router), React, Tailwind CSS, Cytoscape.js, Python FastAPI, PostgreSQL, Neo4j, Docker Compose.

## Multi-Agent Orchestration Rules
You have 4 specialist subagents configured in `.opencode/agents/`:
1. `@ui-architect`: Tactical Command-Center UI, dark theme, Executive Dashboard, 3-Pane Cytoscape.js Investigation Workspace, Temporal Scrubber, Inspector Drawer.
2. `@forensics-backend`: Python FastAPI ingestion (`/ingest/batch`, `/ingest/webhook`), Blockchain RPC enrichment with offline fallback, and Neo4j Cypher behavioral fraud scoring.
3. `@compliance-security`: JWT RBAC auth (`admin@cybernautics.in`, `auditor@cybernautics.in`), PostgreSQL SHA-256 Chain-of-Custody `audit_logs`, and Court PDF Forensic Dossier generator.
4. `@devops-qa`: `docker-compose.yml` with healthchecks, `.env.example`, startup seed script (`CYB-2026-089` & `CYB-2026-094`), build/lint verification, and `DEPLOYMENT_GUIDE.md`.

## Strict Engineering Guardrails
- **Extend Existing Stack:** Inspect existing folders first and extend Next.js, FastAPI, PostgreSQL, and Neo4j without breaking existing routes or schemas.
- **Zero Hardcoded Demo Locks:** Every graph and KPI must be driven by FastAPI + Neo4j/PostgreSQL, backed by auto-seeded realistic fraud cases AND live CSV/webhook ingestion.
- **Offline Resilience:** External RPC/explorer lookups must gracefully fall back to realistic cached/simulated telemetry when offline or unconfigured.
- **Environment 1 Focus:** Keep Environment 2 features (multi-agency federation, mempool surveillance) out of the UI so Environment 1 stands as a complete, self-contained enterprise product.
