from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth import create_token
from ..store import USERS

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(req.email, user["role"])
    return {"access_token": token, "token_type": "bearer", "role": user["role"], "email": req.email}
