import math
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Technician, ServiceRequest, ServiceRequestSkill, TechnicianSkill, Site, Assignment

class TechnicianMatcher:
    # Configurable weights
    DEFAULT_WEIGHTS = {
        "skill": 0.30,
        "experience": 0.20,
        "proximity": 0.20,
        "availability": 0.15,
        "workload": 0.15
    }

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two coordinates in km."""
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    @classmethod
    def match_technicians(
        cls,
        db: Session,
        service_request_id: UUID,
        weights: Optional[Dict[str, float]] = None,
        exclude_technician_ids: Optional[List[UUID]] = None
    ) -> List[Dict[str, Any]]:
        w = weights or cls.DEFAULT_WEIGHTS
        exclude_ids = exclude_technician_ids or []

        request = db.query(ServiceRequest).filter(ServiceRequest.id == service_request_id).first()
        if not request:
            return []

        required_skills = db.query(ServiceRequestSkill).filter(
            ServiceRequestSkill.service_request_id == service_request_id
        ).all()

        site = db.query(Site).filter(Site.id == request.site_id).first()
        site_lat = float(site.latitude) if site and site.latitude else 0.0
        site_lon = float(site.longitude) if site and site.longitude else 0.0

        # Query all active technicians
        query = db.query(Technician).filter(
            Technician.is_active == True,
            Technician.availability_status.in_(["AVAILABLE", "BUSY"])
        )
        if exclude_ids:
            query = query.filter(~Technician.id.in_(exclude_ids))

        technicians = query.all()
        candidates = []

        for tech in technicians:
            reasons_ineligible = []

            # 1. Check workload
            if tech.current_workload >= tech.max_daily_jobs:
                reasons_ineligible.append(f"Workload exceeded ({tech.current_workload}/{tech.max_daily_jobs} jobs)")

            # 2. Check required skills & proficiency
            tech_skills = {
                ts.skill_id: ts for ts in tech.technician_skills
            }

            matched_skill_scores = []
            for req_skill in required_skills:
                if req_skill.skill_id not in tech_skills:
                    if req_skill.is_required:
                        reasons_ineligible.append(f"Missing required skill: {req_skill.skill.name if req_skill.skill else 'Skill'}")
                else:
                    ts = tech_skills[req_skill.skill_id]
                    if ts.proficiency_level < req_skill.minimum_proficiency:
                        reasons_ineligible.append(
                            f"Skill proficiency too low for {req_skill.skill.name}: {ts.proficiency_level} < {req_skill.minimum_proficiency}"
                        )
                    else:
                        matched_skill_scores.append(ts.proficiency_level / 5.0)

            # Skill component score (0-100)
            if matched_skill_scores:
                skill_score = (sum(matched_skill_scores) / len(matched_skill_scores)) * 100.0
            elif not required_skills:
                skill_score = 80.0
            else:
                skill_score = 0.0

            # Experience score (0-100, capped at 10 years for max score)
            exp_years = float(tech.experience_years or 0)
            experience_score = min(100.0, (exp_years / 10.0) * 100.0)

            # Proximity score (0-100, within 10km is 100, over 100km drops to 10)
            distance_km = 0.0
            if site_lat and site_lon and tech.current_latitude and tech.current_longitude:
                distance_km = cls.haversine_distance_km(
                    site_lat, site_lon,
                    float(tech.current_latitude), float(tech.current_longitude)
                )
                proximity_score = max(5.0, 100.0 - (distance_km * 0.9))
            else:
                proximity_score = 70.0  # default when GPS not reported

            # Availability status score (0-100)
            if tech.availability_status == "AVAILABLE":
                availability_score = 100.0
            elif tech.availability_status == "BUSY":
                availability_score = 50.0
            else:
                availability_score = 0.0

            # Workload score (0-100, lower current workload gets higher score)
            workload_ratio = tech.current_workload / max(tech.max_daily_jobs, 1)
            workload_score = max(0.0, (1.0 - workload_ratio) * 100.0)

            # Composite weighted score
            composite_score = (
                skill_score * w["skill"] +
                experience_score * w["experience"] +
                proximity_score * w["proximity"] +
                availability_score * w["availability"] +
                workload_score * w["workload"]
            )

            is_eligible = len(reasons_ineligible) == 0

            candidates.append({
                "technician_id": tech.id,
                "employee_code": tech.employee_code,
                "name": tech.user.name if tech.user else "Technician",
                "specialization": tech.specialization,
                "experience_years": float(tech.experience_years),
                "availability_status": tech.availability_status,
                "current_workload": tech.current_workload,
                "max_daily_jobs": tech.max_daily_jobs,
                "estimated_distance_km": round(distance_km, 2),
                "is_eligible": is_eligible,
                "ineligibility_reasons": reasons_ineligible,
                "match_score": round(composite_score, 2),
                "score_breakdown": {
                    "skill_score": round(skill_score, 1),
                    "experience_score": round(experience_score, 1),
                    "proximity_score": round(proximity_score, 1),
                    "availability_score": round(availability_score, 1),
                    "workload_score": round(workload_score, 1)
                }
            })

        # Sort: eligible first, then by match_score descending
        candidates.sort(key=lambda c: (c["is_eligible"], c["match_score"]), reverse=True)
        return candidates
