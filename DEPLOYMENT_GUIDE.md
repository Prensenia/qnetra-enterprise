# Q-Netra Enterprise Deployment Guide

## Local Docker Launch
```bash
cp .env.example .env
docker-compose up --build
```
Frontend: http://localhost:3000
Backend: http://localhost:8000
Login: admin@cybernautics.in / Admin@123 or auditor@cybernautics.in / Auditor@123

## Cloud VM
1. Install Docker & Docker Compose.
2. Clone repo, copy .env, adjust secrets.
3. Run docker-compose up -d --build.

## Demo Walkthrough
1. Login with admin.
2. Dashboard -> Open in Graph for CYB-2026-089.
3. Run Analyze, Export PDF.
4. Settings -> Generate API Key.
