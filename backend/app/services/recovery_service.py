from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import RecoveryPlan, ExceptionRecord, ServiceRequest, Assignment, Technician
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

class RecoveryService:
    @classmethod
    def apply_recovery_plan(
        cls,
        db: Session,
        plan_id: UUID,
        applied_by_user_id: UUID,
        notes: str = ""
    ) -> RecoveryPlan:
        plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery plan not found")

        exception = db.query(ExceptionRecord).filter(ExceptionRecord.id == plan.exception_id).first()
        request = db.query(ServiceRequest).filter(ServiceRequest.id == plan.service_request_id).first()

        # Update affected assignment
        old_values = {}
        if exception and exception.assignment_id:
            old_assignment = db.query(Assignment).filter(Assignment.id == exception.assignment_id).first()
            if old_assignment:
                old_values = {
                    "technician_id": str(old_assignment.technician_id),
                    "status": old_assignment.assignment_status
                }
                old_assignment.assignment_status = "REASSIGNED"
                # Decrement previous technician workload
                prev_tech = db.query(Technician).filter(Technician.id == old_assignment.technician_id).first()
                if prev_tech and prev_tech.current_workload > 0:
                    prev_tech.current_workload -= 1

        # Create or update new assignment
        new_assignment = None
        if plan.proposed_technician_id:
            new_assignment = Assignment(
                service_request_id=plan.service_request_id,
                technician_id=plan.proposed_technician_id,
                assignment_status="ASSIGNED",
                scheduled_start=plan.proposed_start,
                scheduled_end=plan.proposed_end,
                travel_distance_km=plan.estimated_travel_distance_km,
                assignment_score=plan.score,
                assigned_by=applied_by_user_id,
                assigned_at=datetime.now(timezone.utc)
            )
            db.add(new_assignment)

            # Increment new technician workload
            new_tech = db.query(Technician).filter(Technician.id == plan.proposed_technician_id).first()
            if new_tech:
                new_tech.current_workload += 1
                new_tech.availability_status = "BUSY"

        # Update service request
        if request:
            request.status = "ASSIGNED"

        # Mark exception as RESOLVED
        now = datetime.now(timezone.utc)
        if exception:
            exception.status = "RESOLVED"
            exception.resolved_at = now
            exception.resolution_notes = f"Applied plan: {plan.plan_name}. {notes}".strip()

        # Mark this plan as APPLIED, all sister plans for this exception as REJECTED
        plan.status = "APPLIED"
        sister_plans = db.query(RecoveryPlan).filter(
            RecoveryPlan.exception_id == plan.exception_id,
            RecoveryPlan.id != plan.id
        ).all()
        for sp in sister_plans:
            sp.status = "REJECTED"

        db.commit()
        db.refresh(plan)

        # Audit log
        AuditService.log(
            db=db,
            action="APPLY_RECOVERY_PLAN",
            entity_type="RECOVERY_PLAN",
            entity_id=plan.id,
            user_id=applied_by_user_id,
            old_values=old_values,
            new_values={
                "applied_plan": plan.plan_name,
                "strategy_type": plan.strategy_type,
                "proposed_technician_id": str(plan.proposed_technician_id) if plan.proposed_technician_id else None,
                "exception_status": "RESOLVED",
                "notes": notes
            }
        )

        # Notifications
        if plan.proposed_technician_id:
            new_tech = db.query(Technician).filter(Technician.id == plan.proposed_technician_id).first()
            if new_tech and new_tech.user_id:
                NotificationService.create(
                    db=db,
                    user_id=new_tech.user_id,
                    notification_type="ASSIGNMENT",
                    title="Urgent Recovery Assignment Dispatched",
                    message=f"You have been reassigned to recovery job: {request.title if request else 'Service Request'}.",
                    service_request_id=plan.service_request_id,
                    exception_id=plan.exception_id
                )

        NotificationService.notify_role(
            db=db,
            roles=["DISPATCHER", "MANAGER"],
            notification_type="RECOVERY_PLAN",
            title="Recovery Plan Orchestrated Successfully",
            message=f"Plan '{plan.plan_name}' executed. Job back on track.",
            service_request_id=plan.service_request_id,
            exception_id=plan.exception_id
        )

        return plan
