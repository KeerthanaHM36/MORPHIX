from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import (
    ServiceRequest, Technician, Assignment, ExceptionRecord, 
    RecoveryPlan, Machine, User
)
from app.schemas.operations import DashboardResponse, DashboardKPISummary
from app.services.sla_service import SLAService

router = APIRouter(prefix="/dashboard", tags=["Command Center Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Queries for KPIs
    open_requests = db.query(ServiceRequest).filter(
        ServiceRequest.status.in_(["OPEN", "PENDING_APPROVAL", "APPROVED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"])
    ).all()
    open_req_count = len(open_requests)
    critical_req_count = len([r for r in open_requests if r.priority == "CRITICAL"])

    available_techs = db.query(Technician).filter(
        Technician.is_active == True,
        Technician.availability_status == "AVAILABLE"
    ).count()

    active_assignments = db.query(Assignment).filter(
        Assignment.assignment_status.in_(["ASSIGNED", "CONFIRMED", "IN_PROGRESS"])
    ).all()
    active_assign_count = len(active_assignments)

    open_exceptions = db.query(ExceptionRecord).filter(
        ExceptionRecord.status.in_(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"])
    ).all()
    open_exc_count = len(open_exceptions)

    # Calculate SLA at risk count
    sla_at_risk_count = 0
    live_requests_data = []
    for r in open_requests[:10]:
        sla_status, remaining_minutes, risk = SLAService.assess_sla(r)
        if sla_status in ["AT_RISK", "BREACHED"]:
            sla_at_risk_count += 1
        live_requests_data.append({
            "id": str(r.id),
            "request_code": r.request_code,
            "title": r.title,
            "priority": r.priority,
            "status": r.status,
            "machine_name": r.machine.name if r.machine else None,
            "site_name": r.site.name if r.site else None,
            "sla_status": sla_status,
            "remaining_minutes": remaining_minutes,
            "sla_deadline": r.sla_deadline.isoformat() if r.sla_deadline else None
        })

    kpis = DashboardKPISummary(
        open_service_requests=open_req_count,
        critical_requests=critical_req_count,
        technicians_available=available_techs,
        active_assignments=active_assign_count,
        sla_at_risk=sla_at_risk_count,
        open_exceptions=open_exc_count
    )

    # 2. Technician roster
    techs = db.query(Technician).filter(Technician.is_active == True).limit(10).all()
    technician_roster = [
        {
            "id": str(t.id),
            "name": t.user.name if t.user else "Technician",
            "employee_code": t.employee_code,
            "specialization": t.specialization,
            "availability_status": t.availability_status,
            "current_workload": t.current_workload,
            "max_daily_jobs": t.max_daily_jobs
        }
        for t in techs
    ]

    # 3. Active assignments
    assignments_data = [
        {
            "id": str(a.id),
            "service_request_id": str(a.service_request_id),
            "request_code": a.service_request.request_code if a.service_request else "N/A",
            "request_title": a.service_request.title if a.service_request else "N/A",
            "technician_name": a.technician.user.name if (a.technician and a.technician.user) else "Tech",
            "status": a.assignment_status,
            "scheduled_start": a.scheduled_start.isoformat() if a.scheduled_start else None,
            "score": float(a.assignment_score) if a.assignment_score else None
        }
        for a in active_assignments[:8]
    ]

    # 4. Critical exceptions
    exceptions_data = [
        {
            "id": str(e.id),
            "title": e.title,
            "severity": e.severity,
            "status": e.status,
            "exception_type": e.exception_type,
            "service_request_id": str(e.service_request_id) if e.service_request_id else None,
            "request_code": e.service_request.request_code if e.service_request else None,
            "detected_at": e.detected_at.isoformat() if e.detected_at else None,
            "description": e.description
        }
        for e in open_exceptions[:8]
    ]

    # 5. Active Recovery Plans
    rec_plans = db.query(RecoveryPlan).filter(
        RecoveryPlan.status == "PROPOSED"
    ).order_by(RecoveryPlan.score.desc().nullslast()).limit(6).all()
    recovery_data = [
        {
            "id": str(p.id),
            "exception_id": str(p.exception_id),
            "plan_name": p.plan_name,
            "description": p.description,
            "strategy_type": p.strategy_type,
            "proposed_technician_name": p.proposed_technician.user.name if (p.proposed_technician and p.proposed_technician.user) else None,
            "score": float(p.score) if p.score else 0.0,
            "estimated_delay_minutes": p.estimated_delay_minutes,
            "estimated_travel_distance_km": float(p.estimated_travel_distance_km) if p.estimated_travel_distance_km else 0.0,
            "status": p.status
        }
        for p in rec_plans
    ]

    return DashboardResponse(
        kpis=kpis,
        live_requests=live_requests_data,
        technician_roster=technician_roster,
        active_assignments=assignments_data,
        critical_exceptions=exceptions_data,
        active_recovery_plans=recovery_data
    )
