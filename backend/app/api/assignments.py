from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import Assignment, ServiceRequest, Technician, ServiceTask, User
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.intelligence.technician_matcher import TechnicianMatcher
from app.intelligence.optimizer import OperationalOptimizer
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def enrich_assignment(a: Assignment) -> AssignmentResponse:
    res = AssignmentResponse.model_validate(a)
    res.technician_name = a.technician.user.name if (a.technician and a.technician.user) else None
    res.technician_code = a.technician.employee_code if a.technician else None
    res.request_title = a.service_request.title if a.service_request else None
    res.request_code = a.service_request.request_code if a.service_request else None
    return res

@router.get("", response_model=List[AssignmentResponse])
def list_assignments(
    technician_id: Optional[UUID] = None,
    service_request_id: Optional[UUID] = None,
    assignment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Assignment)
    if technician_id:
        query = query.filter(Assignment.technician_id == technician_id)
    if service_request_id:
        query = query.filter(Assignment.service_request_id == service_request_id)
    if assignment_status:
        query = query.filter(Assignment.assignment_status == assignment_status)

    assignments = query.order_by(Assignment.assigned_at.desc()).all()
    return [enrich_assignment(a) for a in assignments]

@router.get("/match/{service_request_id}")
def match_technicians_for_request(
    service_request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    """
    Returns ranked candidate technicians with match scores for this service request.
    """
    candidates = TechnicianMatcher.match_technicians(db=db, service_request_id=service_request_id)
    return candidates

@router.post("/optimize")
def run_batch_optimization(
    payload: Optional[Dict[str, List[UUID]]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    req_ids = payload.get("request_ids") if payload else None
    plan = OperationalOptimizer.optimize_assignments(db=db, service_request_ids=req_ids)
    return plan

@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == payload.service_request_id).first()
    if not req:
        raise HTTPException(status_code=400, detail="Invalid service_request_id")
    
    tech = db.query(Technician).filter(Technician.id == payload.technician_id).first()
    if not tech:
        raise HTTPException(status_code=400, detail="Invalid technician_id")

    # Set default scheduled window if not provided
    sched_start = payload.scheduled_start or (datetime.now(timezone.utc) + timedelta(minutes=15))
    duration_mins = req.estimated_duration_minutes or 120
    sched_end = payload.scheduled_end or (sched_start + timedelta(minutes=duration_mins))

    assgn = Assignment(
        service_request_id=payload.service_request_id,
        technician_id=payload.technician_id,
        assignment_status="ASSIGNED",
        scheduled_start=sched_start,
        scheduled_end=sched_end,
        travel_distance_km=payload.travel_distance_km,
        travel_duration_minutes=payload.travel_duration_minutes,
        assignment_score=payload.assignment_score,
        assigned_by=current_user.id,
        assigned_at=datetime.now(timezone.utc)
    )
    db.add(assgn)
    db.flush()

    # Update service request status
    req.status = "ASSIGNED"

    # Update technician workload
    tech.current_workload += 1
    tech.availability_status = "BUSY"

    # Auto-generate standard service tasks
    default_tasks = [
        "Safety inspection & lockout/tagout protocol",
        "Diagnostic telemetry analysis & root-cause verification",
        "Component replacement / mechanical calibration",
        "Operational testing & baseline vibration verify",
        "Site cleanup and customer signoff"
    ]
    for idx, tname in enumerate(default_tasks, start=1):
        task = ServiceTask(
            service_request_id=req.id,
            assignment_id=assgn.id,
            task_name=tname,
            status="PENDING",
            sequence_number=idx
        )
        db.add(task)

    db.commit()
    db.refresh(assgn)

    # Audit & Notification
    AuditService.log(
        db=db,
        action="ASSIGN_TECHNICIAN",
        entity_type="ASSIGNMENT",
        entity_id=assgn.id,
        user_id=current_user.id,
        new_values={
            "service_request_id": str(req.id),
            "technician_id": str(tech.id),
            "scheduled_start": sched_start.isoformat()
        }
    )

    if tech.user_id:
        NotificationService.create(
            db=db,
            user_id=tech.user_id,
            notification_type="ASSIGNMENT",
            title=f"New Assignment: {req.request_code}",
            message=f"You have been assigned to: {req.title}. Scheduled for {sched_start.strftime('%Y-%m-%d %H:%M UTC')}.",
            service_request_id=req.id
        )

    return enrich_assignment(assgn)

@router.patch("/{assignment_id}", response_model=AssignmentResponse)
@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assgn = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assgn:
        raise HTTPException(status_code=404, detail="Assignment not found")

    old_status = assgn.assignment_status
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(assgn, k, v)

    # Sync service request status if assignment status changed
    if "assignment_status" in update_data:
        new_status = update_data["assignment_status"]
        if new_status == "IN_PROGRESS":
            assgn.actual_start = datetime.now(timezone.utc)
            if assgn.service_request:
                assgn.service_request.status = "IN_PROGRESS"
        elif new_status == "COMPLETED":
            assgn.actual_end = datetime.now(timezone.utc)
            # Decrement workload
            if assgn.technician and assgn.technician.current_workload > 0:
                assgn.technician.current_workload -= 1
                assgn.technician.availability_status = "AVAILABLE"

    db.commit()
    db.refresh(assgn)

    AuditService.log(
        db=db,
        action="UPDATE_ASSIGNMENT_STATUS",
        entity_type="ASSIGNMENT",
        entity_id=assgn.id,
        user_id=current_user.id,
        old_values={"status": old_status},
        new_values=update_data
    )

    return enrich_assignment(assgn)
