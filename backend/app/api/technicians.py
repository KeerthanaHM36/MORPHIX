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

@router.get("/me/assignments")
def get_my_technician_assignments(
    technician_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns assignments allocated to the current technician.
    If technician_id is provided or current user has technician profile, filters by that technician.
    Otherwise defaults to T1 (Marcus Cole) for rapid testing.
    """
    tech = None
    if technician_id:
        tech = db.query(Technician).filter(Technician.id == technician_id).first()
    if not tech:
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
    if not tech:
        tech = db.query(Technician).filter(Technician.employee_code == "T1").first()

    if not tech:
        return []

    from app.models import Assignment
    assignments = db.query(Assignment).filter(
        Assignment.technician_id == tech.id
    ).order_by(Assignment.created_at.desc()).all()

    result = []
    for a in assignments:
        req = a.service_request
        machine = req.machine if req else None
        site = req.site if req else None
        result.append({
            "id": a.id,
            "service_request_id": a.service_request_id,
            "technician_id": a.technician_id,
            "assignment_status": a.assignment_status,
            "scheduled_start": a.scheduled_start,
            "scheduled_end": a.scheduled_end,
            "travel_distance_km": float(a.travel_distance_km or 0),
            "travel_duration_minutes": a.travel_duration_minutes,
            "assignment_score": float(a.assignment_score or 90),
            "assigned_at": a.assigned_at,
            "technician_name": tech.user.name if tech.user else tech.employee_code,
            "technician_code": tech.employee_code,
            "technician_phone": tech.user.phone if tech.user else "+1-555-0199",
            "technician_lat": float(tech.current_latitude or 42.335),
            "technician_lng": float(tech.current_longitude or -83.050),
            "request_title": req.title if req else "Service Request",
            "request_code": req.request_code if req else "SR-1000",
            "request_priority": req.priority if req else "MEDIUM",
            "request_description": req.description if req else "",
            "machine_name": machine.name if machine else "Machine",
            "machine_code": machine.machine_code if machine else "",
            "site_name": site.name if site else "Site",
            "site_address": site.address if site else "",
            "site_lat": float(site.latitude or 42.3314) if site else 42.3314,
            "site_lng": float(site.longitude or -83.0458) if site else -83.0458,
        })
    return result

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
