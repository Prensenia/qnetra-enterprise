from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, ingest, onchain, analyze, dashboard, cases, settings, health, vasp, citizen, officer, forensics, reporting

app = FastAPI(title="Q-Netra Enterprise Suite", version="1.0.0")

@app.on_event("startup")
def startup_seed():
    try:
        import sys, os
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        import seed_neo4j
        seed_neo4j.main()
    except Exception as e:
        print("Neo4j seed skipped:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The frontend historically called /api/auth/* while the canonical prefix is
# /api/v1/auth; serve both so neither client build hits a 404 for login.
from fastapi import APIRouter as _APIRouter
_legacy_auth = _APIRouter(prefix="/api/auth", tags=["auth-legacy"])
_legacy_auth.add_api_route("/login", auth.login, methods=["POST"])
_legacy_auth.add_api_route("/register", auth.register, methods=["POST"])
app.include_router(_legacy_auth)

app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(onchain.router)
app.include_router(analyze.router)
app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(settings.router)
app.include_router(health.router)
app.include_router(vasp.router)
app.include_router(citizen.router)
app.include_router(officer.router)
app.include_router(forensics.router)
app.include_router(reporting.router)

@app.get("/")
def root():
    return {"service": "Q-Netra Enterprise", "status": "ok"}
