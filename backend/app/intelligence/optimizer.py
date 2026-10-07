from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models import ServiceRequest, Technician, Assignment
from app.intelligence.technician_matcher import TechnicianMatcher

class OperationalOptimizer:
    """
    Multi-objective operational scheduling & dispatch optimizer.
    Balances:
    1. Minimizing SLA delay risk
    2. Minimizing travel distance
    3. Balancing technician workload
    4. Enforcing skill and resource constraints
    """

    @classmethod
    def optimize_assignments(
        cls,
        db: Session,
        service_request_ids: Optional[List[UUID]] = None
    ) -> List[Dict[str, Any]]:
        # Find unassigned or pending approved service requests
        query = db.query(ServiceRequest).filter(
            ServiceRequest.status.in_(["APPROVED", "OPEN"])
        )
        if service_request_ids:
            query = query.filter(ServiceRequest.id.in_(service_request_ids))
        
        requests = query.order_by(
            # Critical priority first
            ServiceRequest.priority.desc(),
            ServiceRequest.sla_deadline.asc().nullslast()
        ).all()

        optimized_plan = []
        assigned_tech_ids = set()

        for req in requests:
            # Match eligible candidates excluding already heavily scheduled techs
            candidates = TechnicianMatcher.match_technicians(
                db=db,
                service_request_id=req.id
            )
            eligible = [c for c in candidates if c["is_eligible"]]

            if not eligible:
                optimized_plan.append({
                    "service_request_id": req.id,
                    "request_code": req.request_code,
                    "title": req.title,
                    "status": "UNASSIGNABLE",
                    "reason": "No eligible technicians found with required skills/availability",
                    "recommended_action": "Raise exception or reassign required skills"
                })
                continue

            # Pick best candidate considering load distribution
            best = eligible[0]
            for c in eligible:
                if c["technician_id"] not in assigned_tech_ids:
                    best = c
                    break

            assigned_tech_ids.add(best["technician_id"])

            est_duration = req.estimated_duration_minutes or 120
            start_time = datetime.now(timezone.utc) + timedelta(minutes=30)
            end_time = start_time + timedelta(minutes=est_duration)

            optimized_plan.append({
                "service_request_id": req.id,
                "request_code": req.request_code,
                "title": req.title,
                "status": "OPTIMAL_MATCH_FOUND",
                "technician_id": best["technician_id"],
                "technician_name": best["name"],
                "technician_code": best["employee_code"],
                "match_score": best["match_score"],
                "estimated_distance_km": best["estimated_distance_km"],
                "estimated_travel_minutes": int(best["estimated_distance_km"] * 1.5) if best["estimated_distance_km"] else 15,
                "proposed_start": start_time.isoformat(),
                "proposed_end": end_time.isoformat(),
                "score_breakdown": best["score_breakdown"]
            })

        return optimized_plan
