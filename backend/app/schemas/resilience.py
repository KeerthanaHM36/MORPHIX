from uuid import UUID
from datetime import datetime
from typing import Optional, List, Any, Dict
from decimal import Decimal
from pydantic import BaseModel, Field

# ==============================================================================
# EXCEPTIONS
# ==============================================================================
class ExceptionCreate(BaseModel):
    service_request_id: Optional[UUID] = None
    assignment_id: Optional[UUID] = None
    exception_type: str = Field(..., description="TECHNICIAN_UNAVAILABLE, PART_UNAVAILABLE, SLA_RISK, SLA_BREACH, SCHEDULING_CONFLICT, TRAVEL_DELAY, RESOURCE_CONFLICT, OTHER")
    severity: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    title: str = Field(..., max_length=250)
    description: Optional[str] = None
    status: str = Field("OPEN", description="OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED")

class ExceptionUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    resolution_notes: Optional[str] = None

class ExceptionResponse(BaseModel):
    id: UUID
    service_request_id: Optional[UUID] = None
    assignment_id: Optional[UUID] = None
    exception_type: str
    severity: str
    title: str
    description: Optional[str] = None
    status: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    detected_by: Optional[UUID] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Enriched
    request_title: Optional[str] = None
    request_code: Optional[str] = None

    class Config:
        from_attributes = True

# ==============================================================================
# RECOVERY PLANS
# ==============================================================================
class RecoveryPlanCreate(BaseModel):
    exception_id: UUID
    service_request_id: UUID
    plan_name: str = Field(..., max_length=250)
    description: Optional[str] = None
    strategy_type: str = Field(..., description="REASSIGN_TECHNICIAN, RESCHEDULE, REPLACE_PART, CHANGE_ROUTE, COMBINE_ACTIONS, OTHER")
    proposed_technician_id: Optional[UUID] = None
    proposed_start: Optional[datetime] = None
    proposed_end: Optional[datetime] = None
    estimated_travel_distance_km: Optional[Decimal] = None
    estimated_delay_minutes: Optional[int] = None
    score: Optional[Decimal] = None

class RecoveryPlanResponse(BaseModel):
    id: UUID
    exception_id: UUID
    service_request_id: UUID
    plan_name: str
    description: Optional[str] = None
    strategy_type: str
    proposed_technician_id: Optional[UUID] = None
    proposed_start: Optional[datetime] = None
    proposed_end: Optional[datetime] = None
    estimated_travel_distance_km: Optional[Decimal] = None
    estimated_delay_minutes: Optional[int] = None
    score: Optional[Decimal] = None
    status: str
    created_at: datetime
    updated_at: datetime
    # Enriched
    proposed_technician_name: Optional[str] = None
    exception_title: Optional[str] = None

    class Config:
        from_attributes = True

class ApplyRecoveryPlanRequest(BaseModel):
    plan_id: UUID
    notes: Optional[str] = None

# ==============================================================================
# SIMULATION SCENARIO & EVENTS
# ==============================================================================
class SimulationEventCreate(BaseModel):
    event_type: str = Field(..., description="TECHNICIAN_UNAVAILABLE, PART_UNAVAILABLE, TRAVEL_DELAY, MACHINE_FAILURE, SLA_CHANGE, RESOURCE_CHANGE, CUSTOM")
    event_time: Optional[datetime] = None
    target_entity_type: str = Field(..., description="TECHNICIAN, SPARE_PART, MACHINE, SERVICE_REQUEST, SITE, OTHER")
    target_entity_id: Optional[UUID] = None
    event_data: Optional[Dict[str, Any]] = None
    description: Optional[str] = None

class SimulationScenarioCreate(BaseModel):
    name: str = Field(..., max_length=250)
    description: Optional[str] = None
    scenario_type: str = Field(..., description="TECHNICIAN_DROPOUT, PART_SHORTAGE, TRAVEL_DELAY, SLA_DELAY, MULTIPLE_FAILURES, CUSTOM")
    base_service_request_id: Optional[UUID] = None
    events: Optional[List[SimulationEventCreate]] = None

class SimulationEventResponse(BaseModel):
    id: UUID
    scenario_id: UUID
    event_type: str
    event_time: Optional[datetime] = None
    target_entity_type: str
    target_entity_id: Optional[UUID] = None
    event_data: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationScenarioResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    scenario_type: str
    base_service_request_id: Optional[UUID] = None
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    events: List[SimulationEventResponse] = []

    class Config:
        from_attributes = True

class SimulationRunResult(BaseModel):
    scenario_id: UUID
    scenario_name: str
    scenario_type: str
    current_state: Dict[str, Any]
    simulated_state: Dict[str, Any]
    impact_analysis: Dict[str, Any]
    recommended_recovery_plans: List[Dict[str, Any]]
