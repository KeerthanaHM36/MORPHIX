import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, Date, Time, 
    DateTime, ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# ==============================================================================
# 1. USER MODEL
# ==============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(30), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    technician = relationship("Technician", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_requests = relationship("ServiceRequest", foreign_keys="ServiceRequest.created_by", back_populates="creator")
    created_scenarios = relationship("SimulationScenario", foreign_keys="SimulationScenario.created_by", back_populates="creator")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


# ==============================================================================
# 2. ORGANIZATION MODEL
# ==============================================================================
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    sites = relationship("Site", back_populates="organization", cascade="all, delete-orphan")


# ==============================================================================
# 3. SITE MODEL
# ==============================================================================
class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    contact_name = Column(String(150), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    organization = relationship("Organization", back_populates="sites")
    machines = relationship("Machine", back_populates="site", cascade="all, delete-orphan")
    inventory_items = relationship("Inventory", back_populates="site", cascade="all, delete-orphan")
    service_requests = relationship("ServiceRequest", back_populates="site")


# ==============================================================================
# 4. MACHINE MODEL
# ==============================================================================
class Machine(Base):
    __tablename__ = "machines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_code = Column(String(100), nullable=False)
    name = Column(String(200), nullable=False)
    machine_type = Column(String(100), nullable=True)
    manufacturer = Column(String(150), nullable=True)
    model_number = Column(String(150), nullable=True)
    serial_number = Column(String(150), nullable=True)
    installation_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="OPERATIONAL", index=True)
    criticality = Column(String(30), nullable=False, default="MEDIUM", index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    site = relationship("Site", back_populates="machines")
    service_requests = relationship("ServiceRequest", back_populates="machine", cascade="all, delete-orphan")


# ==============================================================================
# 5. TECHNICIAN MODEL
# ==============================================================================
class Technician(Base):
    __tablename__ = "technicians"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(100), unique=True, nullable=False)
    specialization = Column(String(150), nullable=True)
    experience_years = Column(Numeric(4, 1), nullable=False, default=0)
    current_latitude = Column(Numeric(10, 7), nullable=True)
    current_longitude = Column(Numeric(10, 7), nullable=True)
    availability_status = Column(String(30), nullable=False, default="AVAILABLE", index=True)
    current_workload = Column(Integer, nullable=False, default=0)
    max_daily_jobs = Column(Integer, nullable=False, default=8)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="technician")
    technician_skills = relationship("TechnicianSkill", back_populates="technician", cascade="all, delete-orphan")
    availabilities = relationship("TechnicianAvailability", back_populates="technician", cascade="all, delete-orphan")
    assignments = relationship("Assignment", foreign_keys="Assignment.technician_id", back_populates="technician")
    proposed_recoveries = relationship("RecoveryPlan", foreign_keys="RecoveryPlan.proposed_technician_id", back_populates="proposed_technician")


# ==============================================================================
# 6. SKILL MODEL
# ==============================================================================
class Skill(Base):
    __tablename__ = "skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    technician_skills = relationship("TechnicianSkill", back_populates="skill", cascade="all, delete-orphan")
    service_request_skills = relationship("ServiceRequestSkill", back_populates="skill", cascade="all, delete-orphan")


# ==============================================================================
# 7. TECHNICIAN_SKILLS MODEL (M2M)
# ==============================================================================
class TechnicianSkill(Base):
    __tablename__ = "technician_skills"

    technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    proficiency_level = Column(Integer, nullable=False, default=1)
    certified = Column(Boolean, nullable=False, default=False)
    certification_expiry = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    technician = relationship("Technician", back_populates="technician_skills")
    skill = relationship("Skill", back_populates="technician_skills")


# ==============================================================================
# 8. TECHNICIAN_AVAILABILITY MODEL
# ==============================================================================
class TechnicianAvailability(Base):
    __tablename__ = "technician_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="CASCADE"), nullable=False, index=True)
    availability_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(30), nullable=False, default="AVAILABLE")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    technician = relationship("Technician", back_populates="availabilities")


# ==============================================================================
# 9. SPARE_PART MODEL
# ==============================================================================
class SparePart(Base):
    __tablename__ = "spare_parts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    part_code = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    manufacturer = Column(String(150), nullable=True)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    is_critical = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    inventory_items = relationship("Inventory", back_populates="spare_part", cascade="all, delete-orphan")
    service_request_parts = relationship("ServiceRequestPart", back_populates="spare_part", cascade="all, delete-orphan")


# ==============================================================================
# 10. INVENTORY MODEL
# ==============================================================================
class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    spare_part_id = Column(UUID(as_uuid=True), ForeignKey("spare_parts.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    site = relationship("Site", back_populates="inventory_items")
    spare_part = relationship("SparePart", back_populates="inventory_items")


# ==============================================================================
# 11. SERVICE_REQUEST MODEL (CORE)
# ==============================================================================
class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_code = Column(String(100), unique=True, nullable=False)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    request_type = Column(String(50), nullable=False, default="CORRECTIVE")
    priority = Column(String(30), nullable=False, default="MEDIUM", index=True)
    status = Column(String(40), nullable=False, default="OPEN", index=True)
    requested_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    sla_deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    estimated_duration_minutes = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    machine = relationship("Machine", back_populates="service_requests")
    site = relationship("Site", back_populates="service_requests")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_requests")
    required_skills = relationship("ServiceRequestSkill", back_populates="service_request", cascade="all, delete-orphan")
    required_parts = relationship("ServiceRequestPart", back_populates="service_request", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="service_request", cascade="all, delete-orphan")
    tasks = relationship("ServiceTask", back_populates="service_request", cascade="all, delete-orphan")
    evidence_items = relationship("ServiceEvidence", back_populates="service_request", cascade="all, delete-orphan")
    exceptions = relationship("ExceptionRecord", back_populates="service_request", cascade="all, delete-orphan")
    recovery_plans = relationship("RecoveryPlan", back_populates="service_request", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="service_request")


# ==============================================================================
# 12. SERVICE_REQUEST_SKILLS MODEL
# ==============================================================================
class ServiceRequestSkill(Base):
    __tablename__ = "service_request_skills"

    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    minimum_proficiency = Column(Integer, nullable=False, default=1)
    is_required = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="required_skills")
    skill = relationship("Skill", back_populates="service_request_skills")


# ==============================================================================
# 13. SERVICE_REQUEST_PARTS MODEL
# ==============================================================================
class ServiceRequestPart(Base):
    __tablename__ = "service_request_parts"

    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), primary_key=True)
    spare_part_id = Column(UUID(as_uuid=True), ForeignKey("spare_parts.id", ondelete="CASCADE"), primary_key=True)
    required_quantity = Column(Integer, nullable=False)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="required_parts")
    spare_part = relationship("SparePart", back_populates="service_request_parts")


# ==============================================================================
# 14. ASSIGNMENT MODEL (CORE DISPATCH)
# ==============================================================================
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_status = Column(String(30), nullable=False, default="ASSIGNED")
    scheduled_start = Column(DateTime(timezone=True), nullable=True, index=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    travel_distance_km = Column(Numeric(10, 2), nullable=True)
    travel_duration_minutes = Column(Integer, nullable=True)
    assignment_score = Column(Numeric(6, 2), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="assignments")
    technician = relationship("Technician", foreign_keys=[technician_id], back_populates="assignments")
    assigner = relationship("User", foreign_keys=[assigned_by])
    tasks = relationship("ServiceTask", back_populates="assignment")
    evidence_items = relationship("ServiceEvidence", back_populates="assignment")
    exceptions = relationship("ExceptionRecord", back_populates="assignment")


# ==============================================================================
# 15. SERVICE_TASK MODEL
# ==============================================================================
class ServiceTask(Base):
    __tablename__ = "service_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    task_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="PENDING")
    sequence_number = Column(Integer, nullable=False, default=1)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="tasks")
    assignment = relationship("Assignment", back_populates="tasks")


# ==============================================================================
# 16. SERVICE_EVIDENCE MODEL
# ==============================================================================
class ServiceEvidence(Base):
    __tablename__ = "service_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    evidence_type = Column(String(50), nullable=False)
    file_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    is_verified = Column(Boolean, nullable=False, default=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="evidence_items")
    assignment = relationship("Assignment", back_populates="evidence_items")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    verifier = relationship("User", foreign_keys=[verified_by])


# ==============================================================================
# 17. EXCEPTION MODEL (CORE RESILIENCE)
# ==============================================================================
class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=True)
    exception_type = Column(String(50), nullable=False)
    severity = Column(String(30), nullable=False, index=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="OPEN", index=True)
    detected_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    detected_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    service_request = relationship("ServiceRequest", back_populates="exceptions")
    assignment = relationship("Assignment", back_populates="exceptions")
    detector = relationship("User", foreign_keys=[detected_by])
    recovery_plans = relationship("RecoveryPlan", back_populates="exception", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="exception")


# ==============================================================================
# 18. RECOVERY_PLAN MODEL (CORE RESILIENCE)
# ==============================================================================
class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exception_id = Column(UUID(as_uuid=True), ForeignKey("exceptions.id", ondelete="CASCADE"), nullable=False)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    plan_name = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    strategy_type = Column(String(50), nullable=False)
    proposed_technician_id = Column(UUID(as_uuid=True), ForeignKey("technicians.id", ondelete="SET NULL"), nullable=True)
    proposed_start = Column(DateTime(timezone=True), nullable=True)
    proposed_end = Column(DateTime(timezone=True), nullable=True)
    estimated_travel_distance_km = Column(Numeric(10, 2), nullable=True)
    estimated_delay_minutes = Column(Integer, nullable=True)
    score = Column(Numeric(8, 3), nullable=True)
    status = Column(String(30), nullable=False, default="PROPOSED")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    exception = relationship("ExceptionRecord", back_populates="recovery_plans")
    service_request = relationship("ServiceRequest", back_populates="recovery_plans")
    proposed_technician = relationship("Technician", foreign_keys=[proposed_technician_id], back_populates="proposed_recoveries")


# ==============================================================================
# 19. SIMULATION_SCENARIO MODEL
# ==============================================================================
class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    scenario_type = Column(String(50), nullable=False)
    base_service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), nullable=False, default="DRAFT")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_scenarios")
    base_request = relationship("ServiceRequest", foreign_keys=[base_service_request_id])
    events = relationship("SimulationEvent", back_populates="scenario", cascade="all, delete-orphan")


# ==============================================================================
# 20. SIMULATION_EVENT MODEL
# ==============================================================================
class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("simulation_scenarios.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_time = Column(DateTime(timezone=True), nullable=True)
    target_entity_type = Column(String(50), nullable=False)
    target_entity_id = Column(UUID(as_uuid=True), nullable=True)
    event_data = Column(JSONB, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    scenario = relationship("SimulationScenario", back_populates="events")


# ==============================================================================
# 21. NOTIFICATION MODEL
# ==============================================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=True)
    exception_id = Column(UUID(as_uuid=True), ForeignKey("exceptions.id", ondelete="CASCADE"), nullable=True)
    notification_type = Column(String(50), nullable=False)
    title = Column(String(250), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    service_request = relationship("ServiceRequest", back_populates="notifications")
    exception = relationship("ExceptionRecord", back_populates="notifications")


# ==============================================================================
# 22. AUDIT_LOG MODEL
# ==============================================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    ip_address = Column(INET, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
