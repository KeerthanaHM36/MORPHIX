from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse, LoginRequest, TokenResponse
)
from app.schemas.entities import (
    OrganizationBase, OrganizationCreate, OrganizationUpdate, OrganizationResponse,
    SiteBase, SiteCreate, SiteUpdate, SiteResponse,
    MachineBase, MachineCreate, MachineUpdate, MachineResponse,
    SkillBase, SkillCreate, SkillResponse,
    TechnicianBase, TechnicianCreate, TechnicianUpdate, TechnicianResponse,
    TechnicianSkillMapping, TechnicianSkillResponse,
    AvailabilityBase, AvailabilityCreate, AvailabilityResponse,
    SparePartBase, SparePartCreate, SparePartUpdate, SparePartResponse,
    InventoryBase, InventoryCreate, InventoryUpdate, InventoryResponse
)
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestUpdate, ServiceRequestResponse,
    RequestSkillInput, RequestPartInput, ServiceRequestSkillResponse, ServiceRequestPartResponse
)
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    ServiceTaskCreate, ServiceTaskUpdate, ServiceTaskResponse,
    ServiceEvidenceCreate, EvidenceVerification, ServiceEvidenceResponse
)
from app.schemas.resilience import (
    ExceptionCreate, ExceptionUpdate, ExceptionResponse,
    RecoveryPlanCreate, RecoveryPlanResponse, ApplyRecoveryPlanRequest,
    SimulationScenarioCreate, SimulationScenarioResponse, SimulationEventCreate, SimulationEventResponse, SimulationRunResult
)
from app.schemas.operations import (
    NotificationCreate, NotificationResponse,
    AuditLogResponse, DashboardKPISummary, DashboardResponse
)
