from uuid import UUID
from datetime import datetime, date, time
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

# ==============================================================================
# ORGANIZATION
# ==============================================================================
class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    description: Optional[str] = None
    is_active: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# SITE
# ==============================================================================
class SiteBase(BaseModel):
    organization_id: UUID
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool = True

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    organization_id: Optional[UUID] = None
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None

class SiteResponse(SiteBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# MACHINE
# ==============================================================================
class MachineBase(BaseModel):
    site_id: UUID
    machine_code: str = Field(..., max_length=100)
    name: str = Field(..., max_length=200)
    machine_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    status: str = Field("OPERATIONAL", description="OPERATIONAL, DEGRADED, UNDER_MAINTENANCE, FAILED, DECOMMISSIONED")
    criticality: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    description: Optional[str] = None

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    site_id: Optional[UUID] = None
    machine_code: Optional[str] = None
    name: Optional[str] = None
    machine_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None
    criticality: Optional[str] = None
    description: Optional[str] = None

class MachineResponse(MachineBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    site_name: Optional[str] = None

    class Config:
        from_attributes = True

# ==============================================================================
# SKILL
# ==============================================================================
class SkillBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# TECHNICIAN
# ==============================================================================
class TechnicianSkillMapping(BaseModel):
    skill_id: UUID
    proficiency_level: int = Field(1, ge=1, le=5)
    certified: bool = False
    certification_expiry: Optional[date] = None

class TechnicianBase(BaseModel):
    user_id: UUID
    employee_code: str = Field(..., max_length=100)
    specialization: Optional[str] = None
    experience_years: Decimal = Field(Decimal("0.0"), ge=Decimal("0.0"))
    current_latitude: Optional[Decimal] = None
    current_longitude: Optional[Decimal] = None
    availability_status: str = Field("AVAILABLE", description="AVAILABLE, BUSY, ON_LEAVE, OFFLINE, UNAVAILABLE")
    current_workload: int = Field(0, ge=0)
    max_daily_jobs: int = Field(8, gt=0)
    is_active: bool = True

class TechnicianCreate(TechnicianBase):
    skills: Optional[List[TechnicianSkillMapping]] = None

class TechnicianUpdate(BaseModel):
    specialization: Optional[str] = None
    experience_years: Optional[Decimal] = None
    current_latitude: Optional[Decimal] = None
    current_longitude: Optional[Decimal] = None
    availability_status: Optional[str] = None
    current_workload: Optional[int] = None
    max_daily_jobs: Optional[int] = None
    is_active: Optional[bool] = None

class TechnicianSkillResponse(BaseModel):
    skill_id: UUID
    skill_name: Optional[str] = None
    proficiency_level: int
    certified: bool
    certification_expiry: Optional[date] = None

    class Config:
        from_attributes = True

class TechnicianResponse(TechnicianBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    skills: List[TechnicianSkillResponse] = []

    class Config:
        from_attributes = True

# ==============================================================================
# TECHNICIAN AVAILABILITY
# ==============================================================================
class AvailabilityBase(BaseModel):
    technician_id: UUID
    availability_date: date
    start_time: time
    end_time: time
    status: str = "AVAILABLE"

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityResponse(AvailabilityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================================================================
# SPARE PART & INVENTORY
# ==============================================================================
class SparePartBase(BaseModel):
    part_code: str = Field(..., max_length=100)
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    unit_cost: Decimal = Field(Decimal("0.0"), ge=Decimal("0.0"))
    is_critical: bool = False

class SparePartCreate(SparePartBase):
    pass

class SparePartUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    unit_cost: Optional[Decimal] = None
    is_critical: Optional[bool] = None

class SparePartResponse(SparePartBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InventoryBase(BaseModel):
    site_id: UUID
    spare_part_id: UUID
    quantity: int = Field(0, ge=0)
    reserved_quantity: int = Field(0, ge=0)
    reorder_level: int = Field(0, ge=0)

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reserved_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)

class InventoryResponse(InventoryBase):
    id: UUID
    updated_at: datetime
    part_name: Optional[str] = None
    part_code: Optional[str] = None
    site_name: Optional[str] = None

    class Config:
        from_attributes = True
