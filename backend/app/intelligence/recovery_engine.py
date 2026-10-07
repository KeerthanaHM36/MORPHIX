from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import ExceptionRecord, ServiceRequest, Technician, Assignment, RecoveryPlan
from app.intelligence.technician_matcher import TechnicianMatcher

class RecoveryEngine:
    @classmethod
    def generate_recovery_plans(
        cls,
        db: Session,
        exception: ExceptionRecord
    ) -> List[RecoveryPlan]:
        if not exception.service_request_id:
            return []

        request = db.query(ServiceRequest).filter(ServiceRequest.id == exception.service_request_id).first()
        if not request:
            return []

        plans = []
        now = datetime.now(timezone.utc)
        est_duration = request.estimated_duration_minutes or 120

        # Find current assigned technician (if any) to exclude from alternatives
        current_tech_id = None
        if exception.assignment_id:
            assignment = db.query(Assignment).filter(Assignment.id == exception.assignment_id).first()
            if assignment:
                current_tech_id = assignment.technician_id

        exclude_ids = [current_tech_id] if current_tech_id else []

        # Find candidate alternative technicians
        candidates = TechnicianMatcher.match_technicians(
            db=db,
            service_request_id=request.id,
            exclude_technician_ids=exclude_ids
        )
        eligible = [c for c in candidates if c["is_eligible"]]

        # Scenario 1: Reassign to highest ranking eligible technician (Plan A)
        if eligible:
            best = eligible[0]
            start_a = now + timedelta(minutes=20)
            end_a = start_a + timedelta(minutes=est_duration)
            plan_a = RecoveryPlan(
                exception_id=exception.id,
                service_request_id=request.id,
                plan_name=f"Immediate Reassignment to {best['name']}",
                description=f"Reassign job to {best['name']} ({best['employee_code']}). Est. travel: {best['estimated_distance_km']} km. High skill match ({best['match_score']}%).",
                strategy_type="REASSIGN_TECHNICIAN",
                proposed_technician_id=best["technician_id"],
                proposed_start=start_a,
                proposed_end=end_a,
                estimated_travel_distance_km=Decimal(str(best["estimated_distance_km"])),
                estimated_delay_minutes=15,
                score=Decimal(str(best["match_score"])),
                status="PROPOSED"
            )
            db.add(plan_a)
            plans.append(plan_a)

        # Scenario 2: Reschedule with second best candidate or deferred window (Plan B)
        if len(eligible) > 1:
            second_best = eligible[1]
            start_b = now + timedelta(minutes=60)
            end_b = start_b + timedelta(minutes=est_duration)
            plan_b = RecoveryPlan(
                exception_id=exception.id,
                service_request_id=request.id,
                plan_name=f"Reschedule with Backup Tech {second_best['name']}",
                description=f"Reschedule window by 1 hour to assign backup tech {second_best['name']} ({second_best['employee_code']}). Est. travel: {second_best['estimated_distance_km']} km.",
                strategy_type="RESCHEDULE",
                proposed_technician_id=second_best["technician_id"],
                proposed_start=start_b,
                proposed_end=end_b,
                estimated_travel_distance_km=Decimal(str(second_best["estimated_distance_km"])),
                estimated_delay_minutes=60,
                score=Decimal(str(max(10.0, second_best["match_score"] - 15.0))),
                status="PROPOSED"
            )
            db.add(plan_b)
            plans.append(plan_b)
        else:
            # Reschedule same day later
            start_b = now + timedelta(hours=3)
            end_b = start_b + timedelta(minutes=est_duration)
            plan_b = RecoveryPlan(
                exception_id=exception.id,
                service_request_id=request.id,
                plan_name="Reschedule to Next Available Slot",
                description="Reschedule window to next shift/window. Extends timeline by 3 hours while preserving SLA buffer.",
                strategy_type="RESCHEDULE",
                proposed_technician_id=eligible[0]["technician_id"] if eligible else None,
                proposed_start=start_b,
                proposed_end=end_b,
                estimated_travel_distance_km=Decimal("12.5"),
                estimated_delay_minutes=180,
                score=Decimal("65.0"),
                status="PROPOSED"
            )
            db.add(plan_b)
            plans.append(plan_b)

        # Scenario 3: Route change / Expedited parts / Standby (Plan C)
        start_c = now + timedelta(minutes=90)
        end_c = start_c + timedelta(minutes=est_duration)
        plan_c = RecoveryPlan(
            exception_id=exception.id,
            service_request_id=request.id,
            plan_name="Expedited Resource Reallocation & Route Change",
            description="Re-route secondary technician on route from adjacent site with expedited part transfer.",
            strategy_type="CHANGE_ROUTE",
            proposed_technician_id=eligible[0]["technician_id"] if eligible else None,
            proposed_start=start_c,
            proposed_end=end_c,
            estimated_travel_distance_km=Decimal("25.0"),
            estimated_delay_minutes=45,
            score=Decimal("78.5"),
            status="PROPOSED"
        )
        db.add(plan_c)
        plans.append(plan_c)

        db.commit()
        for p in plans:
            db.refresh(p)
        return plans
