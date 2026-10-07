from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import ExceptionRecord, User
from app.schemas.resilience import ExceptionCreate, ExceptionUpdate, ExceptionResponse, RecoveryPlanResponse
from app.services.exception_service import ExceptionService

router = APIRouter(prefix="/exceptions", tags=["Exceptions"])

def enrich_exception(e: ExceptionRecord) -> ExceptionResponse:
    res = ExceptionResponse.model_validate(e)
    res.request_title = e.service_request.title if e.service_request else None
    res.request_code = e.service_request.request_code if e.service_request else None
    return res

@router.get("", response_model=List[ExceptionResponse])
def list_exceptions(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    service_request_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ExceptionRecord)
    if status:
        query = query.filter(ExceptionRecord.status == status)
    if severity:
        query = query.filter(ExceptionRecord.severity == severity)
    if service_request_id:
        query = query.filter(ExceptionRecord.service_request_id == service_request_id)

    exceptions = query.order_by(ExceptionRecord.detected_at.desc()).all()
    return [enrich_exception(e) for e in exceptions]

@router.post("", response_model=ExceptionResponse, status_code=status.HTTP_201_CREATED)
def create_exception(
    payload: ExceptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER", "TECHNICIAN"))
):
    record = ExceptionService.create_exception(
        db=db,
        exception_type=payload.exception_type,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        service_request_id=payload.service_request_id,
        assignment_id=payload.assignment_id,
        detected_by=current_user.id,
        auto_generate_plans=True
    )
    return enrich_exception(record)

@router.get("/{exception_id}", response_model=ExceptionResponse)
def get_exception(exception_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    e = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Exception not found")
    return enrich_exception(e)

@router.get("/{exception_id}/plans", response_model=List[RecoveryPlanResponse])
def get_recovery_plans_for_exception(
    exception_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    e = db.query(ExceptionRecord).filter(ExceptionRecord.id == exception_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Exception not found")

    plans = []
    for p in e.recovery_plans:
        item = RecoveryPlanResponse.model_validate(p)
        item.proposed_technician_name = (
            p.proposed_technician.user.name if (p.proposed_technician and p.proposed_technician.user) else None
        )
        item.exception_title = e.title
        plans.append(item)
    return plans
