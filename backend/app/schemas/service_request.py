from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class RequestSkillInput(BaseModel):
    skill_id: UUID
    minimum_proficiency: int = Field(1, ge=1, le=5)
    is_required: bool = True

class RequestPartInput(BaseModel):
    spare_part_id: UUID
    required_quantity: int = Field(..., gt=0)
    is_required: bool = True

class ServiceRequestCreate(BaseModel):
    request_code: str = Field(..., max_length=100)
    machine_id: UUID
    site_id: UUID
    title: str = Field(..., max_length=250)
    description: Optional[str] = None
    request_type: str = Field("CORRECTIVE", description="CORRECTIVE, PREVENTIVE, EMERGENCY, INSPECTION")
    priority: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    sla_deadline: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = Field(None, gt=0)
    required_skills: Optional[List[RequestSkillInput]] = None
    required_parts: Optional[List[RequestPartInput]] = None

class ServiceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = None

class ServiceRequestSkillResponse(BaseModel):
    skill_id: UUID
    skill_name: Optional[str] = None
    minimum_proficiency: int
    is_required: bool

    class Config:
        from_attributes = True

class ServiceRequestPartResponse(BaseModel):
    spare_part_id: UUID
    part_code: Optional[str] = None
    part_name: Optional[str] = None
    required_quantity: int
    reserved_quantity: int
    is_required: bool

    class Config:
        from_attributes = True

class ServiceRequestResponse(BaseModel):
    id: UUID
    request_code: str
    machine_id: UUID
    site_id: UUID
    title: str
    description: Optional[str] = None
    request_type: str
    priority: str
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    estimated_duration_minutes: Optional[int] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    # Display enriched fields
    machine_name: Optional[str] = None
    machine_code: Optional[str] = None
    site_name: Optional[str] = None
    creator_name: Optional[str] = None
    sla_status: Optional[str] = "SAFE"
    sla_remaining_minutes: Optional[int] = None
    required_skills: List[ServiceRequestSkillResponse] = []
    required_parts: List[ServiceRequestPartResponse] = []

    class Config:
        from_attributes = True
