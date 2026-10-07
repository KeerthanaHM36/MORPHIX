# MORPHIX — Industrial Resilience OS
> *"See the disruption. Simulate the future. Orchestrate the recovery."*

MORPHIX (**Multi-objective Resilient Planning, Orchestration & Intelligence eXecution**) is an industrial equipment service-management and operational resilience platform. Traditional maintenance systems only manage static activities (*Request → Dispatch → Execute → Close*). MORPHIX manages the consequences of operational change:

$$\text{Sense} \longrightarrow \text{Model} \longrightarrow \text{Predict} \longrightarrow \text{Simulate} \longrightarrow \text{Optimize} \longrightarrow \text{Orchestrate} \longrightarrow \text{Verify} \longrightarrow \text{Learn}$$

---

## 1. System Architecture

- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0 (ORM), Pydantic v2, PyJWT, Native Bcrypt, Alembic, WebSockets.
- **Frontend**: React 18, TypeScript, Vite, React Router 6, Axios, Custom Industrial Command-Center Theme.
- **Database**: PostgreSQL 18 (Existing database named `MORPHIX`).
- **Intelligence Layer**:
  - Deterministic Multi-Objective Technician Matching Engine (Skills, Experience, GPS, Availability, Workload).
  - SLA Predictive Monitoring & Countdown Engine.
  - Resilience Exception Detection Engine.
  - Autonomous Multi-Option Recovery Engine.
  - Counterfactual "What-If" Simulation Engine.

---

## 2. PostgreSQL Database: 22 Core Tables

The application connects directly to the existing `MORPHIX` PostgreSQL database without recreating or altering table schemas:

1. `users` — RBAC user accounts (`ADMIN`, `MANAGER`, `DISPATCHER`, `TECHNICIAN`, `VIEWER`).
2. `organizations` — Customer/Industrial enterprises.
3. `sites` — Geographic manufacturing facilities and complexes.
4. `machines` — Industrial machinery (`M-104` Stamping Press, CNC Mills, Robotic Cells).
5. `technicians` — Field service technicians linked to users.
6. `skills` — Technical competencies (Hydraulics, Electrical, Mechanical, PLC, Robotics).
7. `technician_skills` — Many-to-many skill proficiencies (1 to 5) and certifications.
8. `technician_availability` — Working shift availability schedules.
9. `spare_parts` — Master catalog of industrial parts (`P-104` Hydraulic Pump).
10. `inventory` — On-site spare part inventory quantities and reserved buffers.
11. `service_requests` — Work order lifecycle (`OPEN`, `APPROVED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`).
12. `service_request_skills` — Technical skill requirements for work orders.
13. `service_request_parts` — Required parts specification.
14. `assignments` — Technician dispatches and scheduling windows.
15. `service_tasks` — Step-by-step checklist protocols (Lockout/Tagout, diagnostics, testing).
16. `service_evidence` — Proof of completion (photos, vibration reports, documents).
17. `exceptions` — Operational disruptions (`TECHNICIAN_UNAVAILABLE`, `PART_UNAVAILABLE`, `SLA_RISK`).
18. `recovery_plans` — Candidate AI recovery plans scored by delay, travel, and SLA buffer.
19. `simulation_scenarios` — Isolated "What-If" disruption scenarios.
20. `simulation_events` — Discrete simulated shocks (dropouts, part shortages, travel delays).
21. `notifications` — Live operator alerts and dispatch notices.
22. `audit_logs` — Immutable audit trail with old/new state deltas.

All 20 performance indexes (`idx_users_email`, `idx_machines_status`, `idx_service_requests_sla`, etc.) and Alembic baseline stamping (`9106573caafb`) are fully initialized.

---

## 3. Quick Start & Running Locally

### Prerequisites
- Python 3.10+ (Python 3.14 supported)
- Node.js 18+ and npm
- PostgreSQL 18 running on `localhost:5432` with existing `MORPHIX` database.

### Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Configuration file `backend/.env` is already configured:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:12345678910@localhost:5432/MORPHIX
   JWT_SECRET_KEY=morphix-super-secure-jwt-secret-key-production-ready-2026
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=uploads
   ENVIRONMENT=development
   PROJECT_NAME=MORPHIX — Industrial Resilience OS
   ```
3. Run the backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *FastAPI documentation is live at [http://localhost:8000/docs](http://localhost:8000/docs).*

### Frontend Setup
1. Open terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend is live at [http://localhost:5173/](http://localhost:5173/).*

---

## 4. Default Operator Credentials

All accounts share the default password: **`Password123!`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Manager** | `manager@morphix.io` | Approves work orders, verifies completion evidence, monitors resilience |
| **Dispatcher** | `dispatcher@morphix.io` | Matches technicians, dispatches jobs, applies AI recovery plans |
| **Technician (T1)** | `t1@morphix.io` | Views daily assignments, executes task checklist, uploads completion proof |
| **Administrator** | `admin@morphix.io` | Full system access, audit logs, configuration |
| **Viewer** | `viewer@morphix.io` | Read-only executive dashboard overview |

*(The login screen includes 1-click role switcher buttons for rapid testing).*

---

## 5. End-to-End Demo Workflow Guide

### Primary Workflow: Work Order Lifecycle
1. **Login**: Sign in as `manager@morphix.io` at [http://localhost:5173/login](http://localhost:5173/login).
2. **Dashboard Overview**: View live KPIs: Open Requests, Critical Requests, Technicians Available, Active Assignments, SLA at Risk, and Active Disruptions.
3. **Inspect Flagship Work Order**:
   - Navigate to **Service Requests** and inspect **`SR-1001`** (*M-104 Hydraulic Pressure Failure & Pump Cavitation*).
   - View machine diagnostics, 4-hour SLA countdown, and required skill: *Hydraulic Systems (Min Level: 4/5)* and part *P-104 Hydraulic Pump Assembly*.
4. **AI Technician Matching**:
   - Click **"Find Qualified Technicians"**.
   - Notice the ranking engine computes a composite score:
     $$\text{Score} = 0.30 \cdot \text{Skill} + 0.20 \cdot \text{Experience} + 0.20 \cdot \text{Proximity} + 0.15 \cdot \text{Availability} + 0.15 \cdot \text{Workload}$$
   - Technician **T1** (Marcus Cole) ranks #1 with **94.5% match score** (5/5 Hydraulic certification, 9.5 yrs experience, 4.2 km away).
5. **Execution Protocol & Evidence**:
   - Advance execution checklist steps (Lockout/Tagout, disassemble suction line, install pump, flush circuit, baseline dry cycle).
   - Upload completion proof (photo, document, or report).
   - Manager reviews and clicks **"✓ Approve Proof"** ➔ Service request transitions to **`COMPLETED`**.

---

### The MORPHIX Differentiation: Live Disruption & Autonomous Recovery

This demonstrates MORPHIX's core capability: **When reality changes, what should the organization do next?**

1. **Inject Disruption**:
   - In the top navigation bar, click the red button: **`⚡ Simulate T1 Disruption`** (or go to **Exceptions & Recovery** and trigger disruption on T1).
   - Technician **T1** is marked `UNAVAILABLE` due to vehicle breakdown.
2. **Sense & Detect**:
   - MORPHIX automatically senses that T1 holds an active assignment for critical job **`SR-1001`**.
   - Creates a **`CRITICAL`** exception in `exceptions` table: *"Technician T1 unavailable for SR-1001"*.
   - Emits alerts to Dispatchers and Managers.
3. **Model & Synthesize**:
   - The Autonomous Recovery Engine evaluates backup technicians and generates 3 candidate recovery plans:
     - **Option A**: *Immediate Reassignment to T2 (Samantha Rivera)* — Skill match 92%, +15 min delay, SLA Safe.
     - **Option B**: *Reschedule with Backup Tech T3 (Derrick Vance)* — +45 min delay.
     - **Option C**: *Standby for T1 Replacement Transport* — +90 min delay, SLA enters At-Risk zone.
4. **Orchestrate & Apply**:
   - In the Command Dashboard or Exceptions center, click **"✓ Apply Plan Now"** on Option A.
   - MORPHIX orchestrates the operational changes:
     - Old assignment updated to `REASSIGNED` and T1 workload decremented.
     - New assignment created for T2 and workload adjusted.
     - Exception marked **`RESOLVED`**.
     - Notification dispatched to T2.
     - Audit log immutably recorded in `audit_logs`.

---

### Counterfactual "What-If" Simulation Lab
1. Navigate to **Simulation Lab** ([http://localhost:5173/simulation](http://localhost:5173/simulation)).
2. Select or create a scenario (e.g., *Blizzard Multi-Technician Dropout*).
3. Click **"▶ Execute Isolated Simulation"**.
4. Review the side-by-side comparison:
   - **Current Production State** vs. **Counterfactual Simulated State**.
   - Disrupted assignments count, cascading SLA risk percentage, and pre-computed recommended recovery dispatches without modifying live database tables.

---

## 6. Automated Verification Tests

To re-run the backend integration test suite against the live database:
```bash
python backend/app/tests/test_all_flows.py
```
Outputs:
```text
[PASS] Health check passed
[PASS] Manager login passed
[PASS] Dashboard metrics passed
[PASS] Technician matching passed. Top candidate: Marcus Cole (T1) (Score: 94.03)
[PASS] Disruption trigger created exception: 'Technician T1 unavailable for SR-1001' [Severity: CRITICAL]
[PASS] Recovery engine generated candidate plans
[PASS] Orchestrated recovery plan applied successfully
[PASS] Exception confirmed RESOLVED in database
[PASS] Counterfactual simulation succeeded
ALL 5 CORE TEST SUITES PASSED PERFECTLY!
```
