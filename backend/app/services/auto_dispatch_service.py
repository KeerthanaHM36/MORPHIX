import math
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import (
    Assignment, ServiceRequest, Technician, ServiceTask, User, Site, Machine
)
from app.intelligence.technician_matcher import TechnicianMatcher
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class AutoDispatchService:
    @classmethod
    def allocate_technician(
        cls,
        db: Session,
        service_request: ServiceRequest,
        exclude_technician_ids: Optional[List[UUID]] = None,
        assigned_by_user_id: Optional[UUID] = None
    ) -> Optional[Tuple[Assignment, Technician, Dict[str, Any]]]:
        """
        AI Model auto-allocates the expert technician for a service request.
        Guarantees:
        - No single technician assigned to two problems simultaneously.
        - No service request has more than one active technician assignment.
        """
        # 1. Check if request already has an active assignment
        existing_active = db.query(Assignment).filter(
            Assignment.service_request_id == service_request.id,
            Assignment.assignment_status.in_(["ASSIGNED", "CONFIRMED", "IN_PROGRESS"])
        ).first()
        if existing_active:
            # Already actively assigned
            tech = db.query(Technician).filter(Technician.id == existing_active.technician_id).first()
            return existing_active, tech, {
                "match_score": float(existing_active.assignment_score or 90.0),
                "estimated_distance_km": float(existing_active.travel_distance_km or 5.0)
            }

        # 2. Match candidate technicians with strict availability checks
        candidates = TechnicianMatcher.match_technicians(
            db=db,
            service_request_id=service_request.id,
            exclude_technician_ids=exclude_technician_ids,
            only_available=True
        )

        if not candidates:
            return None

        # Filter for eligible or pick best available candidate
        eligible_candidates = [c for c in candidates if c.get("is_eligible", True)]
        selected_candidate = eligible_candidates[0] if eligible_candidates else candidates[0]

        tech_id = selected_candidate["technician_id"]
        tech = db.query(Technician).filter(Technician.id == tech_id).first()
        if not tech:
            return None

        # Double check technician has NO other active assignment at this moment (race condition guard)
        has_active_job = db.query(Assignment).filter(
            Assignment.technician_id == tech.id,
            Assignment.assignment_status.in_(["ASSIGNED", "CONFIRMED", "IN_PROGRESS"])
        ).first()
        if has_active_job:
            # If race condition occurred, retry excluding this technician
            new_excludes = list(set(exclude_technician_ids or []).union({tech.id}))
            return cls.allocate_technician(db, service_request, exclude_technician_ids=new_excludes, assigned_by_user_id=assigned_by_user_id)

        # 3. Create the assignment in ASSIGNED status (pending technician confirmation)
        now_utc = datetime.now(timezone.utc)
        sched_start = now_utc + timedelta(minutes=15)
        duration_mins = service_request.estimated_duration_minutes or 120
        sched_end = sched_start + timedelta(minutes=duration_mins)

        dist_km = Decimal(str(selected_candidate.get("estimated_distance_km", 5.0)))
        travel_mins = int(float(dist_km) * 1.5) + 10
        score = Decimal(str(selected_candidate.get("match_score", 90.0)))

        assignment = Assignment(
            service_request_id=service_request.id,
            technician_id=tech.id,
            assignment_status="ASSIGNED",
            scheduled_start=sched_start,
            scheduled_end=sched_end,
            travel_distance_km=dist_km,
            travel_duration_minutes=travel_mins,
            assignment_score=score,
            assigned_by=assigned_by_user_id,
            assigned_at=now_utc
        )
        db.add(assignment)
        db.flush()

        # 4. Lock technician status & update workload
        tech.availability_status = "BUSY"
        tech.current_workload += 1
        service_request.status = "ASSIGNED"

        # 5. Generate standard service checklist tasks
        standard_tasks = [
            "Site arrival & Lockout/Tagout (LOTO) safety protocol",
            "Initial diagnostic telemetry check & physical inspection",
            "Component repair, calibration & precision alignment",
            "Operational test cycle & vibration baseline verification",
            "Customer sign-off & work order completion"
        ]
        for idx, tname in enumerate(standard_tasks, start=1):
            task = ServiceTask(
                service_request_id=service_request.id,
                assignment_id=assignment.id,
                task_name=tname,
                status="PENDING",
                sequence_number=idx
            )
            db.add(task)

        db.commit()
        db.refresh(assignment)
        db.refresh(tech)
        db.refresh(service_request)

        # 6. Notify the technician of new AI assignment
        if tech.user_id:
            NotificationService.create(
                db=db,
                user_id=tech.user_id,
                notification_type="ASSIGNMENT",
                title=f"AI Service Allocation: {service_request.request_code}",
                message=f"New problem allocated: {service_request.title}. Match score: {float(score):.1f}%. Please review and Accept or Reject.",
                service_request_id=service_request.id
            )

        return assignment, tech, selected_candidate
