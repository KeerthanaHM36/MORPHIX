from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import SparePart, User
from app.schemas.entities import SparePartCreate, SparePartUpdate, SparePartResponse

router = APIRouter(prefix="/spare-parts", tags=["Spare Parts"])

@router.get("", response_model=List[SparePartResponse])
def list_spare_parts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SparePart).order_by(SparePart.name).all()

@router.post("", response_model=SparePartResponse, status_code=status.HTTP_201_CREATED)
def create_spare_part(
    payload: SparePartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    existing = db.query(SparePart).filter(SparePart.part_code == payload.part_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Part code already exists")
    p = SparePart(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
