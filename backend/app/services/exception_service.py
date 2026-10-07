from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import ExceptionRecord, ServiceRequest, Assignment, Technician
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService
from app.intelligence.recovery_engine import RecoveryEngine

class ExceptionService:
    @classmethod
    def create_exception(
        cls,
        db: Session,
        exception_type: str,
        severity: str,
        title: str,
        description: Optional[str] = None,
        service_request_id: Optional[UUID] = None,
        assignment_id: Optional[UUID] = None,
        detected_by: Optional[UUID] = None,
        auto_generate_plans: bool = True
    ) -> ExceptionRecord:
        record = ExceptionRecord(
            service_request_id=service_request_id,
            assignment_id=assignment_id,
            exception_type=exception_type,
            severity=severity,
            title=title,
            description=description,
            status="OPEN",
            detected_by=detected_by,
            detected_at=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # Audit log
        AuditService.log(
            db=db,
            action="CREATE_EXCEPTION",
            entity_type="EXCEPTION",
            entity_id=record.id,
            user_id=detected_by,
            new_values={
                "exception_type": exception_type,
                "severity": severity,
                "title": title,
                "service_request_id": str(service_request_id) if service_request_id else None
            }
        )

        # Notify dispatchers and managers
        NotificationService.notify_role(
            db=db,
            roles=["DISPATCHER", "MANAGER", "ADMIN"],
            notification_type="EXCEPTION",
            title=f"Disruption Alert: {title}",
            message=f"[{severity}] {description or title}",
            service_request_id=service_request_id,
            exception_id=record.id
        )

        # Automatically generate candidate recovery plans if requested
        if auto_generate_plans and service_request_id:
            RecoveryEngine.generate_recovery_plans(db, record)

        return record

    @classmethod
    def trigger_technician_unavailable(
        cls,
        db: Session,
        technician_id: UUID,
        reason: Optional[str] = "Technician marked unavailable unexpectedly",
        triggered_by: Optional[UUID] = None
    ) -> List[ExceptionRecord]:
        """
        Core MORPHIX disruption trigger:
        When technician becomes unavailable, identify active assignments,
        mark technician status, raise exceptions, and trigger recovery plans.
        """
        tech = db.query(Technician).filter(Technician.id == technician_id).first()
        if not tech:
            return []

        tech.availability_status = "UNAVAILABLE"
        db.commit()

        # Find affected active assignments
        active_assignments = db.query(Assignment).filter(
            Assignment.technician_id == technician_id,
            Assignment.assignment_status.in_(["ASSIGNED", "CONFIRMED", "IN_PROGRESS"])
        ).all()

        exceptions_created = []
        for assgn in active_assignments:
            req = db.query(ServiceRequest).filter(ServiceRequest.id == assgn.service_request_id).first()
            req_title = req.title if req else "Service Request"
            severity = "CRITICAL" if (req and req.priority == "CRITICAL") else "HIGH"

            exc = cls.create_exception(
                db=db,
                exception_type="TECHNICIAN_UNAVAILABLE",
                severity=severity,
                title=f"Technician {tech.employee_code} unavailable for {req.request_code if req else 'job'}",
                description=f"Technician {tech.user.name if tech.user else tech.employee_code} became unavailable. Job '{req_title}' requires urgent recovery. {reason}",
                service_request_id=assgn.service_request_id,
                assignment_id=assgn.id,
                detected_by=triggered_by,
                auto_generate_plans=True
            )
            exceptions_created.append(exc)

        return exceptions_created
