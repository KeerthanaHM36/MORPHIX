from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Technician, TechnicianSkill, Skill, User, ExceptionRecord
from app.schemas.entities import TechnicianCreate, TechnicianUpdate, TechnicianResponse, TechnicianSkillResponse
from app.schemas.resilience import ExceptionResponse
from app.services.exception_service import ExceptionService

router = APIRouter(prefix="/technicians", tags=["Technicians"])

@router.get("", response_model=List[TechnicianResponse])
def list_technicians(
    availability_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Technician)
    if availability_status:
        query = query.filter(Technician.availability_status == availability_status)
    
    technicians = query.order_by(Technician.employee_code).all()
    res = []
    for t in technicians:
        item = TechnicianResponse.model_validate(t)
        item.user_name = t.user.name if t.user else None
        item.user_email = t.user.email if t.user else None
        item.skills = [
            TechnicianSkillResponse(
                skill_id=ts.skill_id,
                skill_name=ts.skill.name if ts.skill else None,
                proficiency_level=ts.proficiency_level,
                certified=ts.certified,
                certification_expiry=ts.certification_expiry
            )
            for ts in t.technician_skills
        ]
        res.append(item)
    return res

@router.post("", response_model=TechnicianResponse, status_code=status.HTTP_201_CREATED)
def create_technician(
    payload: TechnicianCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER"))
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid user_id")
    
    existing = db.query(Technician).filter(Technician.employee_code == payload.employee_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Technician employee code already exists")

    skills_data = payload.skills or []
    tech_data = payload.model_dump(exclude={"skills"})
    tech = Technician(**tech_data)
    db.add(tech)
    db.flush()

    for s in skills_data:
        ts = TechnicianSkill(
            technician_id=tech.id,
            skill_id=s.skill_id,
            proficiency_level=s.proficiency_level,
            certified=s.certified,
            certification_expiry=s.certification_expiry
        )
        db.add(ts)

    db.commit()
    db.refresh(tech)

    item = TechnicianResponse.model_validate(tech)
    item.user_name = user.name
    item.user_email = user.email
    return item

@router.get("/{technician_id}", response_model=TechnicianResponse)
def get_technician(technician_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(Technician).filter(Technician.id == technician_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Technician not found")
    item = TechnicianResponse.model_validate(t)
    item.user_name = t.user.name if t.user else None
    item.user_email = t.user.email if t.user else None
    item.skills = [
        TechnicianSkillResponse(
            skill_id=ts.skill_id,
            skill_name=ts.skill.name if ts.skill else None,
            proficiency_level=ts.proficiency_level,
            certified=ts.certified,
            certification_expiry=ts.certification_expiry
        )
        for ts in t.technician_skills
    ]
    return item

@router.patch("/{technician_id}", response_model=TechnicianResponse)
@router.put("/{technician_id}", response_model=TechnicianResponse)
def update_technician(
    technician_id: UUID,
    payload: TechnicianUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER", "TECHNICIAN"))
):
    t = db.query(Technician).filter(Technician.id == technician_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Technician not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(t, k, v)

    db.commit()
    db.refresh(t)
    return get_technician(technician_id, db, current_user)

@router.post("/{technician_id}/trigger-unavailable", response_model=List[ExceptionResponse])
def trigger_technician_unavailable(
    technician_id: UUID,
    reason: Optional[str] = "Sudden medical or transport disruption",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    """
    Simulates / triggers the core MORPHIX disruption:
    Technician is marked unavailable, raising exceptions and generating recovery options.
    """
    exceptions = ExceptionService.trigger_technician_unavailable(
        db=db,
        technician_id=technician_id,
        reason=reason,
        triggered_by=current_user.id
    )
    return exceptions
