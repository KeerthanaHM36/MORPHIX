from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Skill, User
from app.schemas.entities import SkillCreate, SkillResponse

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("", response_model=List[SkillResponse])
def list_skills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Skill).order_by(Skill.name).all()

@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    existing = db.query(Skill).filter(Skill.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")
    s = Skill(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
