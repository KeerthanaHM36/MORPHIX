from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import (
    ServiceRequest, ServiceRequestSkill, ServiceRequestPart, 
    Machine, Site, User, Skill, SparePart
)
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestUpdate, ServiceRequestResponse,
    ServiceRequestSkillResponse, ServiceRequestPartResponse
)
from app.services.sla_service import SLAService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])

def enrich_request(r: ServiceRequest) -> ServiceRequestResponse:
    sla_status, remaining_minutes, risk = SLAService.assess_sla(r)
    res = ServiceRequestResponse.model_validate(r)
    res.machine_name = r.machine.name if r.machine else None
    res.machine_code = r.machine.machine_code if r.machine else None
    res.site_name = r.site.name if r.site else None
    res.creator_name = r.creator.name if r.creator else None
    res.sla_status = sla_status
    res.sla_remaining_minutes = remaining_minutes
    res.required_skills = [
        ServiceRequestSkillResponse(
            skill_id=rs.skill_id,
            skill_name=rs.skill.name if rs.skill else None,
            minimum_proficiency=rs.minimum_proficiency,
            is_required=rs.is_required
        )
        for rs in r.required_skills
    ]
    res.required_parts = [
        ServiceRequestPartResponse(
            spare_part_id=rp.spare_part_id,
            part_code=rp.spare_part.part_code if rp.spare_part else None,
            part_name=rp.spare_part.name if rp.spare_part else None,
            required_quantity=rp.required_quantity,
            reserved_quantity=rp.reserved_quantity,
            is_required=rp.is_required
        )
        for rp in r.required_parts
    ]
    return res

@router.get("", response_model=List[ServiceRequestResponse])
def list_service_requests(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    site_id: Optional[UUID] = None,
    machine_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ServiceRequest)
    if status:
        query = query.filter(ServiceRequest.status == status)
    if priority:
        query = query.filter(ServiceRequest.priority == priority)
    if site_id:
        query = query.filter(ServiceRequest.site_id == site_id)
    if machine_id:
        query = query.filter(ServiceRequest.machine_id == machine_id)
    
    requests = query.order_by(ServiceRequest.requested_at.desc()).all()
    return [enrich_request(r) for r in requests]

@router.post("", response_model=ServiceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_service_request(
    payload: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate machine and site
    machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
    if not machine:
        raise HTTPException(status_code=400, detail="Invalid machine_id")
    site = db.query(Site).filter(Site.id == payload.site_id).first()
    if not site:
        raise HTTPException(status_code=400, detail="Invalid site_id")

    # SLA deadline calculation
    sla_deadline = payload.sla_deadline
    if not sla_deadline:
        sla_deadline = SLAService.calculate_default_deadline(payload.priority)

    req_data = payload.model_dump(exclude={"required_skills", "required_parts"})
    req_data["sla_deadline"] = sla_deadline
    req_data["created_by"] = current_user.id
    req_data["status"] = "OPEN"

    req = ServiceRequest(**req_data)
    db.add(req)
    db.flush()

    # Add required skills
    if payload.required_skills:
        for s in payload.required_skills:
            rs = ServiceRequestSkill(
                service_request_id=req.id,
                skill_id=s.skill_id,
                minimum_proficiency=s.minimum_proficiency,
                is_required=s.is_required
            )
            db.add(rs)

    # Add required parts
    if payload.required_parts:
        for p in payload.required_parts:
            rp = ServiceRequestPart(
                service_request_id=req.id,
                spare_part_id=p.spare_part_id,
                required_quantity=p.required_quantity,
                reserved_quantity=0,
                is_required=p.is_required
            )
            db.add(rp)

    db.commit()
    db.refresh(req)

    # Audit & Notification
    AuditService.log(
        db=db,
        action="CREATE_SERVICE_REQUEST",
        entity_type="SERVICE_REQUEST",
        entity_id=req.id,
        user_id=current_user.id,
        new_values={"request_code": req.request_code, "priority": req.priority, "title": req.title}
    )

    NotificationService.notify_role(
        db=db,
        roles=["MANAGER", "DISPATCHER"],
        notification_type="SERVICE_UPDATE",
        title=f"New Service Request: {req.request_code}",
        message=f"[{req.priority}] {req.title} for machine {machine.name} at {site.name}",
        service_request_id=req.id
    )

    return enrich_request(req)

@router.get("/{request_id}", response_model=ServiceRequestResponse)
def get_service_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return enrich_request(req)

@router.post("/{request_id}/approve", response_model=ServiceRequestResponse)
def approve_service_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    old_status = req.status
    req.status = "APPROVED"
    req.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)

    AuditService.log(
        db=db,
        action="APPROVE_SERVICE_REQUEST",
        entity_type="SERVICE_REQUEST",
        entity_id=req.id,
        user_id=current_user.id,
        old_values={"status": old_status},
        new_values={"status": "APPROVED"}
    )

    NotificationService.notify_role(
        db=db,
        roles=["DISPATCHER"],
        notification_type="SERVICE_UPDATE",
        title=f"Request Approved: {req.request_code}",
        message=f"Request '{req.title}' is approved and ready for technician assignment.",
        service_request_id=req.id
    )

    return enrich_request(req)

@router.patch("/{request_id}", response_model=ServiceRequestResponse)
def update_service_request(
    request_id: UUID,
    payload: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    old_values = {"status": req.status, "priority": req.priority}
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(req, k, v)
    
    db.commit()
    db.refresh(req)

    AuditService.log(
        db=db,
        action="UPDATE_SERVICE_REQUEST",
        entity_type="SERVICE_REQUEST",
        entity_id=req.id,
        user_id=current_user.id,
        old_values=old_values,
        new_values=update_data
    )

    return enrich_request(req)
