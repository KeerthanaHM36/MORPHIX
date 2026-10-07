from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import RecoveryPlan, User
from app.schemas.resilience import RecoveryPlanResponse, ApplyRecoveryPlanRequest
from app.services.recovery_service import RecoveryService

router = APIRouter(prefix="/recovery", tags=["Recovery Plans"])

def enrich_plan(p: RecoveryPlan) -> RecoveryPlanResponse:
    res = RecoveryPlanResponse.model_validate(p)
    res.proposed_technician_name = (
        p.proposed_technician.user.name if (p.proposed_technician and p.proposed_technician.user) else None
    )
    res.exception_title = p.exception.title if p.exception else None
    return res

@router.get("", response_model=List[RecoveryPlanResponse])
def list_recovery_plans(
    exception_id: Optional[UUID] = None,
    service_request_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RecoveryPlan)
    if exception_id:
        query = query.filter(RecoveryPlan.exception_id == exception_id)
    if service_request_id:
        query = query.filter(RecoveryPlan.service_request_id == service_request_id)
    if status:
        query = query.filter(RecoveryPlan.status == status)
    
    plans = query.order_by(RecoveryPlan.score.desc().nullslast()).all()
    return [enrich_plan(p) for p in plans]

@router.post("/apply", response_model=RecoveryPlanResponse)
def apply_recovery_plan(
    payload: ApplyRecoveryPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    plan = RecoveryService.apply_recovery_plan(
        db=db,
        plan_id=payload.plan_id,
        applied_by_user_id=current_user.id,
        notes=payload.notes or ""
    )
    return enrich_plan(plan)
