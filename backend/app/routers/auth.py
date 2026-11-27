from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth import create_token, verify_password, hash_password
from ..store import USERS
from ..db import get_conn

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Citizen"
    badge: str = ""
    agency: str = ""

@router.post("/register")
def register(req: RegisterRequest):
    conn = get_conn()
    existing = conn.execute("SELECT 1 FROM users WHERE email=?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    hp = hash_password(req.password)
    conn.execute("INSERT INTO users (email,password,role,name,badge,agency) VALUES (?,?,?,?,?,?)",
                 (req.email, hp, req.role, req.name, req.badge, req.agency))
    conn.commit()
    conn.close()
    USERS[req.email] = {"password": hp, "role": req.role, "name": req.name, "badge": req.badge, "agency": req.agency}
    token = create_token(req.email, req.role)
    return {"access_token": token, "token_type": "bearer", "role": req.role, "email": req.email}

@router.post("/login")
def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user or not verify_password(user["password"], req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(req.email, user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"], "email": req.email}
