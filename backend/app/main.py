from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, ingest, onchain, analyze, dashboard, cases, settings, health, vasp, citizen, officer

app = FastAPI(title="Q-Netra Enterprise Suite", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def root():
    return {"service": "Q-Netra Enterprise", "status": "ok"}
