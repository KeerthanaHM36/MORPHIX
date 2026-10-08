from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

# ==============================================================================
# ASSIGNMENT
# ==============================================================================
class AssignmentCreate(BaseModel):
    service_request_id: UUID
    technician_id: UUID
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    travel_distance_km: Optional[Decimal] = None
    travel_duration_minutes: Optional[int] = None
    assignment_score: Optional[Decimal] = None

class AssignmentUpdate(BaseModel):
    assignment_status: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    travel_distance_km: Optional[Decimal] = None
    travel_duration_minutes: Optional[int] = None
    assignment_score: Optional[Decimal] = None

class AssignmentResponse(BaseModel):
    id: UUID
    service_request_id: UUID
    technician_id: UUID
    assignment_status: str
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    travel_distance_km: Optional[Decimal] = None
    travel_duration_minutes: Optional[int] = None
    assignment_score: Optional[Decimal] = None
    assigned_at: datetime
    assigned_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    technician_name: Optional[str] = None
    technician_code: Optional[str] = None
    request_title: Optional[str] = None
    request_code: Optional[str] = None

    class Config:
        from_attributes = True

# ==============================================================================
# SERVICE TASK
# ==============================================================================
class ServiceTaskCreate(BaseModel):
    service_request_id: UUID
    assignment_id: Optional[UUID] = None
    task_name: str = Field(..., max_length=200)
    description: Optional[str] = None
    sequence_number: int = Field(1, gt=0)

class ServiceTaskUpdate(BaseModel):
    status: Optional[str] = Field(None, description="PENDING, IN_PROGRESS, COMPLETED, SKIPPED, FAILED")
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ServiceTaskResponse(BaseModel):
    id: UUID
    service_request_id: UUID
    assignment_id: Optional[UUID] = None
    task_name: str
    description: Optional[str] = None
    status: str
    sequence_number: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# SERVICE EVIDENCE
# ==============================================================================
class ServiceEvidenceCreate(BaseModel):
    service_request_id: UUID
    assignment_id: Optional[UUID] = None
    evidence_type: str = Field(..., description="PHOTO, VIDEO, REPORT, DOCUMENT, NOTE")
    description: Optional[str] = None
    file_url: Optional[str] = None

class EvidenceVerification(BaseModel):
    is_verified: bool
    notes: Optional[str] = None

class ServiceEvidenceResponse(BaseModel):
    id: UUID
    service_request_id: UUID
    assignment_id: Optional[UUID] = None
    evidence_type: str
    file_url: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: UUID
    uploaded_at: datetime
    is_verified: bool
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    uploader_name: Optional[str] = None
    verifier_name: Optional[str] = None

    class Config:
        from_attributes = True

class TechnicianRejectRequest(BaseModel):
    reason: Optional[str] = "Technician rejected allocation"

class TechnicianActionResponse(BaseModel):
    success: bool
    action: str  # "ACCEPTED" or "REJECTED"
    message: str
    assignment_id: UUID
    service_request_id: UUID
    reallocated: bool = False
    new_technician_name: Optional[str] = None
    new_technician_code: Optional[str] = None
    new_assignment_id: Optional[UUID] = None
