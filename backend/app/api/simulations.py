from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_roles
from app.models import SimulationScenario, SimulationEvent, User
from app.schemas.resilience import (
    SimulationScenarioCreate, SimulationScenarioResponse, 
    SimulationEventResponse, SimulationRunResult
)
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["Simulation Lab"])

@router.get("", response_model=List[SimulationScenarioResponse])
def list_simulation_scenarios(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scenarios = db.query(SimulationScenario).order_by(SimulationScenario.created_at.desc()).all()
    res = []
    for s in scenarios:
        item = SimulationScenarioResponse.model_validate(s)
        item.events = [SimulationEventResponse.model_validate(ev) for ev in s.events]
        res.append(item)
    return res

@router.post("", response_model=SimulationScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_simulation_scenario(
    payload: SimulationScenarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    scenario = SimulationScenario(
        name=payload.name,
        description=payload.description,
        scenario_type=payload.scenario_type,
        base_service_request_id=payload.base_service_request_id,
        created_by=current_user.id,
        status="DRAFT"
    )
    db.add(scenario)
    db.flush()

    if payload.events:
        for ev in payload.events:
            event_obj = SimulationEvent(
                scenario_id=scenario.id,
                event_type=ev.event_type,
                event_time=ev.event_time,
                target_entity_type=ev.target_entity_type,
                target_entity_id=ev.target_entity_id,
                event_data=ev.event_data,
                description=ev.description
            )
            db.add(event_obj)

    db.commit()
    db.refresh(scenario)

    item = SimulationScenarioResponse.model_validate(scenario)
    item.events = [SimulationEventResponse.model_validate(ev) for ev in scenario.events]
    return item

@router.post("/{scenario_id}/run", response_model=SimulationRunResult)
def run_simulation(
    scenario_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "DISPATCHER"))
):
    result = SimulationService.run_simulation(db=db, scenario_id=scenario_id, user_id=current_user.id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
