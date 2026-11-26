from fastapi import APIRouter
from ..vasp_intel import VASP_DIRECTORY, BANK_DIRECTORY

router = APIRouter(prefix="/api/v1", tags=["vasp"])

@router.get("/vasp/directory")
def vasp_directory():
    return {"vasps": VASP_DIRECTORY, "banks": BANK_DIRECTORY}
