from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models import (
    SimulationScenario, SimulationEvent, ServiceRequest, 
    Technician, Assignment, SparePart, Inventory, Machine
)
from app.intelligence.technician_matcher import TechnicianMatcher
from app.services.audit_service import AuditService

class SimulationService:
    @classmethod
    def run_simulation(cls, db: Session, scenario_id: UUID, user_id: UUID) -> Dict[str, Any]:
        scenario = db.query(SimulationScenario).filter(SimulationScenario.id == scenario_id).first()
        if not scenario:
            return {"error": "Scenario not found"}

        scenario.status = "RUNNING"
        db.commit()

        # 1. Snapshot current production state (isolated in-memory read-only)
        active_requests = db.query(ServiceRequest).filter(
            ServiceRequest.status.in_(["OPEN", "APPROVED", "ASSIGNED", "IN_PROGRESS"])
        ).all()
        active_assignments = db.query(Assignment).filter(
            Assignment.assignment_status.in_(["ASSIGNED", "CONFIRMED", "IN_PROGRESS"])
        ).all()
        technicians = db.query(Technician).filter(Technician.is_active == True).all()

        current_state = {
            "total_active_jobs": len(active_requests),
            "total_assigned_jobs": len(active_assignments),
            "available_technicians": len([t for t in technicians if t.availability_status == "AVAILABLE"]),
            "average_workload": round(sum(t.current_workload for t in technicians) / max(len(technicians), 1), 2),
            "jobs": [
                {
                    "request_code": r.request_code,
                    "title": r.title,
                    "priority": r.priority,
                    "status": r.status
                }
                for r in active_requests[:5]
            ]
        }

        # 2. Process simulation events
        events = db.query(SimulationEvent).filter(SimulationEvent.scenario_id == scenario_id).all()
        impacted_jobs = []
        conflicts_detected = []
        simulated_tech_status = {t.id: t.availability_status for t in technicians}
        simulated_workloads = {t.id: t.current_workload for t in technicians}

        # Apply events to simulated context
        for ev in events:
            if ev.event_type == "TECHNICIAN_UNAVAILABLE":
                tech_id = ev.target_entity_id
                if tech_id:
                    simulated_tech_status[tech_id] = "UNAVAILABLE"
                    # Find assignments mapped to this tech
                    affected = [a for a in active_assignments if a.technician_id == tech_id]
                    for aff in affected:
                        req = aff.service_request
                        impacted_jobs.append({
                            "service_request_id": str(aff.service_request_id),
                            "request_code": req.request_code if req else "N/A",
                            "title": req.title if req else "N/A",
                            "priority": req.priority if req else "MEDIUM",
                            "issue": "Assigned technician unavailable in simulation",
                            "sla_deadline": req.sla_deadline.isoformat() if req and req.sla_deadline else None
                        })
                        conflicts_detected.append(
                            f"Technician {aff.technician.employee_code if aff.technician else 'Tech'} dropped out. Job {req.request_code if req else ''} stalled."
                        )

            elif ev.event_type == "PART_UNAVAILABLE":
                part_id = ev.target_entity_id
                part = db.query(SparePart).filter(SparePart.id == part_id).first() if part_id else None
                conflicts_detected.append(
                    f"Spare part '{part.name if part else 'P-104'}' stock depleted at target site. Job execution delayed."
                )

            elif ev.event_type == "TRAVEL_DELAY":
                delay_mins = (ev.event_data or {}).get("delay_minutes", 45)
                conflicts_detected.append(
                    f"Traffic gridlock simulated: +{delay_mins} min travel delay across metro sectors."
                )

            elif ev.event_type == "MACHINE_FAILURE":
                conflicts_detected.append(
                    "Simulated sudden cascade failure on secondary equipment."
                )

        # 3. Formulate Counterfactual Resolution Plans
        recommended_recovery = []
        for imp in impacted_jobs:
            req_uuid = UUID(imp["service_request_id"])
            candidates = TechnicianMatcher.match_technicians(
                db=db,
                service_request_id=req_uuid,
                exclude_technician_ids=[ev.target_entity_id for ev in events if ev.target_entity_id]
            )
            eligible = [c for c in candidates if c["is_eligible"]]
            if eligible:
                best_sim = eligible[0]
                recommended_recovery.append({
                    "job_code": imp["request_code"],
                    "strategy": "REASSIGN_TO_STANDBY",
                    "proposed_technician": best_sim["name"],
                    "simulated_score": best_sim["match_score"],
                    "simulated_delay_minutes": 20,
                    "sla_outlook": "PRESERVED"
                })
            else:
                recommended_recovery.append({
                    "job_code": imp["request_code"],
                    "strategy": "EXPEDITE_EXTERNAL_CONTRACTOR",
                    "proposed_technician": "Third-party emergency dispatch",
                    "simulated_score": 70.0,
                    "simulated_delay_minutes": 90,
                    "sla_outlook": "AT_RISK"
                })

        simulated_state = {
            "scenario_name": scenario.name,
            "scenario_type": scenario.scenario_type,
            "simulated_available_technicians": len([status for status in simulated_tech_status.values() if status == "AVAILABLE"]),
            "disrupted_assignments": len(impacted_jobs),
            "simulated_sla_risk_increase": f"+{len(impacted_jobs) * 22}%" if impacted_jobs else "0%"
        }

        impact_analysis = {
            "impacted_jobs_count": len(impacted_jobs),
            "conflicts": conflicts_detected or ["No critical conflicts detected under current event parameters."],
            "impacted_jobs": impacted_jobs
        }

        scenario.status = "COMPLETED"
        db.commit()

        # Audit log the simulation execution
        AuditService.log(
            db=db,
            action="RUN_SIMULATION",
            entity_type="SIMULATION_SCENARIO",
            entity_id=scenario.id,
            user_id=user_id,
            new_values={
                "scenario_name": scenario.name,
                "impacted_jobs": len(impacted_jobs)
            }
        )

        return {
            "scenario_id": str(scenario.id),
            "scenario_name": scenario.name,
            "scenario_type": scenario.scenario_type,
            "current_state": current_state,
            "simulated_state": simulated_state,
            "impact_analysis": impact_analysis,
            "recommended_recovery_plans": recommended_recovery
        }
