export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MANAGER' | 'DISPATCHER' | 'TECHNICIAN' | 'VIEWER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  is_active: boolean;
}

export interface Machine {
  id: string;
  site_id: string;
  site_name?: string;
  machine_code: string;
  name: string;
  machine_type?: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  installation_date?: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'UNDER_MAINTENANCE' | 'FAILED' | 'DECOMMISSIONED';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export interface TechnicianSkill {
  skill_id: string;
  skill_name?: string;
  proficiency_level: number;
  certified: boolean;
  certification_expiry?: string;
}

export interface Technician {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  employee_code: string;
  specialization?: string;
  experience_years: number;
  current_latitude?: number;
  current_longitude?: number;
  availability_status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE' | 'OFFLINE' | 'UNAVAILABLE';
  current_workload: number;
  max_daily_jobs: number;
  is_active: boolean;
  skills?: TechnicianSkill[];
}

export interface SparePart {
  id: string;
  part_code: string;
  name: string;
  description?: string;
  manufacturer?: string;
  unit_cost: number;
  is_critical: boolean;
}

export interface Inventory {
  id: string;
  site_id: string;
  spare_part_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  part_name?: string;
  part_code?: string;
  site_name?: string;
}

export interface ServiceRequest {
  id: string;
  request_code: string;
  machine_id: string;
  site_id: string;
  title: string;
  description?: string;
  request_type: 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY' | 'INSPECTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'PENDING_APPROVAL' | 'APPROVED' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  requested_at: string;
  approved_at?: string;
  sla_deadline?: string;
  estimated_duration_minutes?: number;
  created_by: string;
  machine_name?: string;
  machine_code?: string;
  site_name?: string;
  creator_name?: string;
  sla_status?: 'SAFE' | 'AT_RISK' | 'BREACHED';
  sla_remaining_minutes?: number;
  required_skills?: Array<{
    skill_id: string;
    skill_name?: string;
    minimum_proficiency: number;
    is_required: boolean;
  }>;
  required_parts?: Array<{
    spare_part_id: string;
    part_code?: string;
    part_name?: string;
    required_quantity: number;
    reserved_quantity: number;
    is_required: boolean;
  }>;
}

export interface Assignment {
  id: string;
  service_request_id: string;
  technician_id: string;
  assignment_status: 'ASSIGNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REASSIGNED';
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  travel_distance_km?: number;
  travel_duration_minutes?: number;
  assignment_score?: number;
  assigned_at: string;
  technician_name?: string;
  technician_code?: string;
  request_title?: string;
  request_code?: string;
}

export interface ServiceTask {
  id: string;
  service_request_id: string;
  assignment_id?: string;
  task_name: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  sequence_number: number;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface ServiceEvidence {
  id: string;
  service_request_id: string;
  assignment_id?: string;
  evidence_type: 'PHOTO' | 'VIDEO' | 'REPORT' | 'DOCUMENT' | 'NOTE';
  file_url?: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
  is_verified: boolean;
  uploader_name?: string;
  verifier_name?: string;
}

export interface ExceptionRecord {
  id: string;
  service_request_id?: string;
  assignment_id?: string;
  exception_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  detected_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  request_title?: string;
  request_code?: string;
}

export interface RecoveryPlan {
  id: string;
  exception_id: string;
  service_request_id: string;
  plan_name: string;
  description?: string;
  strategy_type: string;
  proposed_technician_id?: string;
  proposed_technician_name?: string;
  proposed_start?: string;
  proposed_end?: string;
  estimated_travel_distance_km?: number;
  estimated_delay_minutes?: number;
  score?: number;
  status: 'PROPOSED' | 'SELECTED' | 'APPLIED' | 'REJECTED' | 'EXPIRED';
  exception_title?: string;
}

export interface DashboardData {
  kpis: {
    open_service_requests: number;
    critical_requests: number;
    technicians_available: number;
    active_assignments: number;
    sla_at_risk: number;
    open_exceptions: number;
  };
  live_requests: Array<{
    id: string;
    request_code: string;
    title: string;
    priority: string;
    status: string;
    machine_name?: string;
    site_name?: string;
    sla_status: string;
    remaining_minutes?: number;
    sla_deadline?: string;
  }>;
  technician_roster: Array<{
    id: string;
    name: string;
    employee_code: string;
    specialization?: string;
    availability_status: string;
    current_workload: number;
    max_daily_jobs: number;
  }>;
  active_assignments: Array<{
    id: string;
    service_request_id: string;
    request_code: string;
    request_title: string;
    technician_name: string;
    status: string;
    scheduled_start?: string;
    score?: number;
  }>;
  critical_exceptions: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    exception_type: string;
    request_code?: string;
    detected_at?: string;
    description?: string;
  }>;
  active_recovery_plans: Array<{
    id: string;
    exception_id: string;
    plan_name: string;
    description?: string;
    strategy_type: string;
    proposed_technician_name?: string;
    score: number;
    estimated_delay_minutes?: number;
    estimated_travel_distance_km?: number;
    status: string;
  }>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  service_request_id?: string;
  exception_id?: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
  user_name?: string;
}
