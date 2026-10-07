from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ==============================================================================
# NOTIFICATION
# ==============================================================================
class NotificationCreate(BaseModel):
    user_id: UUID
    service_request_id: Optional[UUID] = None
    exception_id: Optional[UUID] = None
    notification_type: str = Field(..., description="ASSIGNMENT, SLA_RISK, EXCEPTION, RECOVERY_PLAN, PART_SHORTAGE, SERVICE_UPDATE, SYSTEM")
    title: str = Field(..., max_length=250)
    message: str

class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    service_request_id: Optional[UUID] = None
    exception_id: Optional[UUID] = None
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ==============================================================================
# AUDIT LOG
# ==============================================================================
class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    entity_type: str
    entity_id: Optional[UUID] = None
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# ==============================================================================
# DASHBOARD KPIS & OPERATIONAL OVERVIEW
# ==============================================================================
class DashboardKPISummary(BaseModel):
    open_service_requests: int
    critical_requests: int
    technicians_available: int
    active_assignments: int
    sla_at_risk: int
    open_exceptions: int

class DashboardResponse(BaseModel):
    kpis: DashboardKPISummary
    live_requests: List[Dict[str, Any]]
    technician_roster: List[Dict[str, Any]]
    active_assignments: List[Dict[str, Any]]
    critical_exceptions: List[Dict[str, Any]]
    active_recovery_plans: List[Dict[str, Any]]
