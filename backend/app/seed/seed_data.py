import uuid
from datetime import datetime, timezone, timedelta, date, time
from decimal import Decimal
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, Organization, Site, Machine, Technician, Skill,
    TechnicianSkill, TechnicianAvailability, SparePart, Inventory,
    ServiceRequest, ServiceRequestSkill, ServiceRequestPart,
    Assignment, ServiceTask, ServiceEvidence, ExceptionRecord,
    RecoveryPlan, SimulationScenario, SimulationEvent,
    Notification, AuditLog
)

def seed_database():
    db = SessionLocal()
    print("Checking if database already has seed data...")
    if db.query(User).count() > 0:
        print("Database already contains data! Skipping seed.")
        db.close()
        return

    print("Generating comprehensive, realistic demo seed data for MORPHIX...")
    now = datetime.now(timezone.utc)
    hashed_password = get_password_hash("Password123!")

    # 1. USERS
    admin_user = User(
        name="Elena Vance (Chief Ops Officer)",
        email="admin@morphix.io",
        password_hash=hashed_password,
        phone="+1-555-0100",
        role="ADMIN",
        is_active=True
    )
    manager_user = User(
        name="Marcus Sterling (Service Director)",
        email="manager@morphix.io",
        password_hash=hashed_password,
        phone="+1-555-0101",
        role="MANAGER",
        is_active=True
    )
    dispatcher_user = User(
        name="Sarah Chen (Head Dispatcher)",
        email="dispatcher@morphix.io",
        password_hash=hashed_password,
        phone="+1-555-0102",
        role="DISPATCHER",
        is_active=True
    )
    customer_user = User(
        name="Apex Plant Client (Customer)",
        email="customer@morphix.io",
        password_hash=hashed_password,
        phone="+1-555-0104",
        role="VIEWER",
        is_active=True
    )
    db.add_all([admin_user, manager_user, dispatcher_user, viewer_user, customer_user])
    db.flush()

    # 2. ORGANIZATION
    org = Organization(
        name="Apex Heavy Manufacturing & Energy Corp",
        code="APEX-GLOBAL",
        description="Global conglomerate specializing in automotive stamping, precision machining, and industrial power generation.",
        is_active=True
    )
    db.add(org)
    db.flush()

    # 3. SITES (3 Sites)
    sites_data = [
        Site(
            organization_id=org.id,
            name="Apex Detroit Gigafactory Complex",
            code="SITE-DET-01",
            address="1000 Assembly Parkway",
            city="Detroit",
            state="Michigan",
            country="USA",
            latitude=Decimal("42.3314"),
            longitude=Decimal("-83.0458"),
            contact_name="James Miller",
            contact_phone="+1-313-555-0199",
            is_active=True
        ),
        Site(
            organization_id=org.id,
            name="Apex Cleveland Stamping & Press Works",
            code="SITE-CLE-02",
            address="450 Industrial Boulevard",
            city="Cleveland",
            state="Ohio",
            country="USA",
            latitude=Decimal("41.4993"),
            longitude=Decimal("-81.6944"),
            contact_name="Karen Novak",
            contact_phone="+1-216-555-0144",
            is_active=True
        ),
        Site(
            organization_id=org.id,
            name="Apex Pittsburgh Heavy Fabrication",
            code="SITE-PIT-03",
            address="880 Foundry Road",
            city="Pittsburgh",
            state="Pennsylvania",
            country="USA",
            latitude=Decimal("40.4406"),
            longitude=Decimal("-79.9959"),
            contact_name="Robert Vance",
            contact_phone="+1-412-555-0182",
            is_active=True
        )
    ]
    db.add_all(sites_data)
    db.flush()
    site_det, site_cle, site_pit = sites_data

    # 4. SKILLS (10 Skills)
    skills_list = [
        Skill(name="Hydraulic Systems", description="High-pressure pumps, proportional valves, cylinders, and fluid mechanics."),
        Skill(name="Electrical Maintenance", description="Switchgear, 480V 3-phase power, transformers, and circuit isolation."),
        Skill(name="Mechanical Maintenance", description="Gearboxes, precision alignment, bearing replacement, and shafts."),
        Skill(name="Welding & Fabrication", description="TIG/MIG industrial structural repair and pipe fabrication."),
        Skill(name="HVAC & Industrial Cooling", description="Chillers, heat exchangers, cooling towers, and refrigeration."),
        Skill(name="PLC & Automation", description="Siemens S7, Allen-Bradley ControlLogix, ladder logic, and I/O debugging."),
        Skill(name="Robotics & Servos", description="Fanuc and KUKA 6-axis kinematics, end-effectors, and servo drives."),
        Skill(name="Pneumatics", description="Air compressors, pneumatic actuators, manifold blocks, and air drying."),
        Skill(name="Instrumentation & Sensors", description="Pressure transmitters, RTD thermocouples, flow meters, and calibration."),
        Skill(name="Vibration Analysis", description="FFT spectrum diagnostics, dynamic balancing, and condition monitoring.")
    ]
    db.add_all(skills_list)
    db.flush()

    # 5. TECHNICIANS (20 Technicians with User accounts)
    tech_names = [
        ("T1", "Marcus Cole", "Senior Hydraulic Specialist", Decimal("9.5"), Decimal("42.3350"), Decimal("-83.0500")),
        ("T2", "Samantha Rivera", "Master Electro-Mechanical Tech", Decimal("8.0"), Decimal("42.3400"), Decimal("-83.0300")),
        ("T3", "Derrick Vance", "Hydraulics & Automation Engineer", Decimal("6.5"), Decimal("42.3200"), Decimal("-83.0600")),
        ("T4", "Aisha Khan", "Robotics & Controls Tech", Decimal("5.0"), Decimal("42.3150"), Decimal("-83.0400")),
        ("T5", "Brandon Scott", "Industrial HVAC Specialist", Decimal("7.0"), Decimal("41.5050"), Decimal("-81.6900")),
        ("T6", "Chloe Bennett", "PLC & Drive Systems Specialist", Decimal("8.5"), Decimal("41.4900"), Decimal("-81.7000")),
        ("T7", "Lucas Silva", "Mechanical Rigging & Bearings", Decimal("4.5"), Decimal("41.5100"), Decimal("-81.6800")),
        ("T8", "Emily Watson", "Senior Instrumentation Engineer", Decimal("10.0"), Decimal("41.4850"), Decimal("-81.7100")),
        ("T9", "Liam O'Connor", "High Pressure Hydraulics", Decimal("7.5"), Decimal("40.4450"), Decimal("-79.9900")),
        ("T10", "Sophia Martinez", "Robotic Kinematics Tech", Decimal("5.5"), Decimal("40.4350"), Decimal("-80.0000")),
        ("T11", "Noah Taylor", "Heavy Structural Welder", Decimal("11.0"), Decimal("40.4500"), Decimal("-79.9800")),
        ("T12", "Olivia Anderson", "Pneumatics & Air Quality", Decimal("6.0"), Decimal("40.4300"), Decimal("-80.0100")),
        ("T13", "Ethan Thomas", "Electro-Mechanical Field Tech", Decimal("4.0"), Decimal("42.3500"), Decimal("-83.0200")),
        ("T14", "Ava Jackson", "Condition Monitoring Specialist", Decimal("8.0"), Decimal("42.3100"), Decimal("-83.0700")),
        ("T15", "Mason White", "Mechanical Transmission Expert", Decimal("9.0"), Decimal("41.5200"), Decimal("-81.6700")),
        ("T16", "Isabella Harris", "PLC Field Commissioning", Decimal("6.5"), Decimal("41.4800"), Decimal("-81.7200")),
        ("T17", "Jacob Martin", "Hydraulic Maintenance Tech", Decimal("5.0"), Decimal("40.4600"), Decimal("-79.9700")),
        ("T18", "Mia Thompson", "Electrical Substation Maintenance", Decimal("7.5"), Decimal("40.4200"), Decimal("-80.0200")),
        ("T19", "William Garcia", "Precision Machinist & Alignment", Decimal("8.5"), Decimal("42.3600"), Decimal("-83.0100")),
        ("T20", "Harper Robinson", "Advanced Robotics & AI Systems", Decimal("4.0"), Decimal("41.5300"), Decimal("-81.6600"))
    ]

    technicians_list = []
    for code, name, spec, exp, lat, lon in tech_names:
        u_email = f"{code.lower()}@morphix.io"
        u = User(
            name=f"{name} ({code})",
            email=u_email,
            password_hash=hashed_password,
            phone=f"+1-555-02{len(technicians_list):02d}",
            role="TECHNICIAN",
            is_active=True
        )
        db.add(u)
        db.flush()

        t = Technician(
            user_id=u.id,
            employee_code=code,
            specialization=spec,
            experience_years=exp,
            current_latitude=lat,
            current_longitude=lon,
            availability_status="AVAILABLE",
            current_workload=1 if code in ["T1", "T5", "T9"] else 0,
            max_daily_jobs=8,
            is_active=True
        )
        db.add(t)
        technicians_list.append(t)

    db.flush()
    tech_t1 = technicians_list[0] # T1

    # 6. TECHNICIAN SKILLS (30+ mappings)
    # T1 has Hydraulic Systems (5/5 certified) and Mechanical Maintenance (4/5)
    db.add(TechnicianSkill(technician_id=tech_t1.id, skill_id=skills_list[0].id, proficiency_level=5, certified=True, certification_expiry=date(2027, 12, 31)))
    db.add(TechnicianSkill(technician_id=tech_t1.id, skill_id=skills_list[2].id, proficiency_level=4, certified=True))
    db.add(TechnicianSkill(technician_id=tech_t1.id, skill_id=skills_list[7].id, proficiency_level=3, certified=False))

    # T2 has Hydraulic Systems (4/5), Electrical (5/5)
    db.add(TechnicianSkill(technician_id=technicians_list[1].id, skill_id=skills_list[0].id, proficiency_level=4, certified=True))
    db.add(TechnicianSkill(technician_id=technicians_list[1].id, skill_id=skills_list[1].id, proficiency_level=5, certified=True))

    # T3 has Hydraulic Systems (4/5), PLC (4/5)
    db.add(TechnicianSkill(technician_id=technicians_list[2].id, skill_id=skills_list[0].id, proficiency_level=4, certified=True))
    db.add(TechnicianSkill(technician_id=technicians_list[2].id, skill_id=skills_list[5].id, proficiency_level=4, certified=True))

    # Add other skills for rest of team
    for i, t in enumerate(technicians_list[3:]):
        s1 = skills_list[i % len(skills_list)]
        s2 = skills_list[(i + 3) % len(skills_list)]
        db.add(TechnicianSkill(technician_id=t.id, skill_id=s1.id, proficiency_level=(i % 3) + 3, certified=(i % 2 == 0)))
        db.add(TechnicianSkill(technician_id=t.id, skill_id=s2.id, proficiency_level=((i + 1) % 3) + 3, certified=False))

    # 7. TECHNICIAN AVAILABILITY (Schedule entries)
    today = date.today()
    for t in technicians_list:
        db.add(TechnicianAvailability(
            technician_id=t.id,
            availability_date=today,
            start_time=time(8, 0),
            end_time=time(17, 0),
            status="AVAILABLE"
        ))
    db.flush()

    # 8. SPARE PARTS (20 Parts)
    parts_data = [
        ("P-104", "Hydraulic Pump Assembly P-104", "High-pressure axial piston hydraulic pump, 350 bar", "Bosch Rexroth", Decimal("4500.00"), True),
        ("P-105", "Proportional Relief Valve 24V", "Electro-hydraulic proportional pressure relief valve", "Parker Hannifin", Decimal("1250.00"), True),
        ("P-106", "Hydraulic Cylinder Seal Kit HD", "High-temperature PTFE rod and piston seal kit", "SKF", Decimal("320.00"), False),
        ("P-201", "3-Phase AC Induction Motor 45kW", "480V 60Hz 1780RPM heavy duty motor", "Siemens", Decimal("6200.00"), True),
        ("P-202", "Variable Frequency Drive 60HP", "Vector control industrial inverter drive", "ABB", Decimal("5100.00"), True),
        ("P-203", "Main Contact Block 250A", "High-cycle magnetic contactor assembly", "Schneider Electric", Decimal("480.00"), False),
        ("P-301", "Precision Planetary Gearbox 10:1", "Low backlash inline servo planetary gearbox", "Neugart", Decimal("2800.00"), True),
        ("P-302", "Spherical Roller Bearing Set 120mm", "Self-aligning heavy load bearing assembly", "Timken", Decimal("890.00"), False),
        ("P-303", "Flexible Jaw Coupling Element", "Polyurethane elastomer spider insert 98 Shore A", "Lovejoy", Decimal("110.00"), False),
        ("P-401", "PLC CPU Module S7-1500", "High-performance programmable logic controller", "Siemens", Decimal("3900.00"), True),
        ("P-402", "Digital 16-Channel I/O Module", "24V DC sink/source opto-isolated module", "Siemens", Decimal("420.00"), False),
        ("P-403", "Industrial Ethernet Switch 8-Port", "Managed Gigabit DIN-rail rugged switch", "Moxa", Decimal("750.00"), False),
        ("P-501", "Pressure Transmitter 0-400 Bar", "4-20mA piezoresistive pressure transducer", "WIKA", Decimal("540.00"), False),
        ("P-502", "PT100 Temperature Sensor Probe", "Duplex RTD probe with protective thermowell", "Endress+Hauser", Decimal("290.00"), False),
        ("P-601", "Heavy Duty Air Filter Regulator", "Coalescing particulate separator with auto drain", "SMC", Decimal("380.00"), False),
        ("P-602", "Pneumatic Solenoid Valve 5/2 Way", "High-flow directional pneumatic spool valve", "Festo", Decimal("260.00"), False),
        ("P-701", "Centrifugal Chilled Water Pump", "Single stage end-suction booster pump", "Grundfos", Decimal("3100.00"), True),
        ("P-702", "Semi-Hermetic Screw Compressor", "Industrial refrigeration refrigerant compressor", "Bitzer", Decimal("8400.00"), True),
        ("P-801", "Robot Harmonic Drive Gearbox", "Zero backlash precision reduction unit", "Harmonic Drive", Decimal("4700.00"), True),
        ("P-802", "Teach Pendant Cable Harness 15m", "Flexible high flex robot controller pendant harness", "Fanuc", Decimal("950.00"), False)
    ]

    spare_parts_list = []
    for code, name, desc, mfg, cost, is_crit in parts_data:
        p = SparePart(
            part_code=code,
            name=name,
            description=desc,
            manufacturer=mfg,
            unit_cost=cost,
            is_critical=is_crit
        )
        db.add(p)
        spare_parts_list.append(p)
    db.flush()
    part_p104 = spare_parts_list[0]

    # 9. INVENTORY (Site Stocks)
    for s in [site_det, site_cle, site_pit]:
        for p in spare_parts_list:
            qty = 15 if s == site_det else 8
            db.add(Inventory(
                site_id=s.id,
                spare_part_id=p.id,
                quantity=qty,
                reserved_quantity=2 if p.part_code == "P-104" and s == site_det else 0,
                reorder_level=4
            ))
    db.flush()

    # 10. MACHINES (15 Industrial Machines)
    machines_data = [
        (site_det, "M-104", "M-104 3500-Ton Hydraulic Stamping Press", "Hydraulic Press", "Schuler AG", "HP-3500-HD", "SCH-2023-0104", date(2023, 3, 15), "OPERATIONAL", "CRITICAL", "Primary automotive body panel high-tonnage stamping press."),
        (site_det, "M-105", "CNC 5-Axis Milling Center Alpha", "CNC Machining", "DMG MORI", "DMU-80-EVO", "DMG-2022-8812", date(2022, 6, 20), "OPERATIONAL", "HIGH", "High precision turbine blade and die milling center."),
        (site_det, "M-106", "Robotic Spot Welding Cell R-01", "Robotics", "Fanuc", "R-2000iC", "FAN-2024-0019", date(2024, 1, 10), "OPERATIONAL", "HIGH", "Automated multi-arm structural chassis spot welding cell."),
        (site_det, "M-107", "Rotary Screw Air Compressor Plant", "Air Compressor", "Atlas Copco", "GA-90-VSD", "ATL-2021-9932", date(2021, 9, 5), "OPERATIONAL", "CRITICAL", "Supplies 8.5 bar clean dry compressed air to plant."),
        (site_det, "M-108", "Central Industrial Chiller 400TR", "Cooling / HVAC", "Trane", "RTAC-400", "TRN-2022-4411", date(2022, 11, 12), "DEGRADED", "MEDIUM", "Main process chilled water circulation system."),
        
        (site_cle, "M-201", "M-201 2000-Ton Transfer Press", "Hydraulic Press", "Komatsu", "E2W-2000", "KOM-2020-0201", date(2020, 4, 18), "OPERATIONAL", "HIGH", "Progressive die sheet metal stamping press."),
        (site_cle, "M-202", "High Velocity Plasma Cutting Gantry", "Thermal Cutting", "Messer", "OmniMat-4000", "MES-2023-0401", date(2023, 8, 22), "OPERATIONAL", "MEDIUM", "Plate steel precision bevel and contour cutting table."),
        (site_cle, "M-203", "Horizontal CNC Boring Mill", "CNC Machining", "Toshiba", "BTD-130H", "TOS-2021-3321", date(2021, 2, 14), "UNDER_MAINTENANCE", "HIGH", "Large structural engine block boring and milling."),
        (site_cle, "M-204", "Automated Guided Vehicle Fleet Hub", "Material Handling", "Dematic", "AGV-Fleet-8", "DEM-2024-1102", date(2024, 5, 30), "OPERATIONAL", "LOW", "Intralogistics automated heavy coil transport."),
        (site_cle, "M-205", "Electrodynamic Vibration Shaker", "Testing & QA", "Unholtz-Dickie", "SA-4000", "UDI-2022-7741", date(2022, 7, 8), "OPERATIONAL", "MEDIUM", "Structural fatigue and endurance vibration testing station."),

        (site_pit, "M-301", "Heavy Billet Induction Heating Furnace", "Thermal Induction", "Inductotherm", "VIP-Power-Trak", "IND-2019-0901", date(2019, 11, 25), "OPERATIONAL", "CRITICAL", "High frequency billet heating for forge lines."),
        (site_pit, "M-302", "M-302 4000-Ton Open Die Forging Press", "Hydraulic Press", "SMS Group", "ODP-4000", "SMS-2021-0302", date(2021, 10, 10), "OPERATIONAL", "CRITICAL", "Heavy forged turbine shaft manufacturing press."),
        (site_pit, "M-303", "Precision CNC Roll Grinder", "Grinding", "Herkules", "WS-600", "HER-2020-5519", date(2020, 8, 19), "OPERATIONAL", "MEDIUM", "Cambered roll profiling and surface micro-finishing."),
        (site_pit, "M-304", "Continuous Annealing Atmosphere Line", "Heat Treating", "Surface Combustion", "Allcase-Furnace", "SUR-2022-8114", date(2022, 1, 18), "OPERATIONAL", "HIGH", "Controlled atmosphere metallurgy heat treatment line."),
        (site_pit, "M-305", "Effluent Neutralization & Scrubber Plant", "Environmental", "Andritz", "EcoFilter-500", "AND-2023-9002", date(2023, 4, 30), "OPERATIONAL", "HIGH", "Industrial wastewater treatment and chemical neutralizer.")
    ]

    machines_list = []
    for s, mcode, mname, mtype, mfg, model, ser, idate, stat, crit, desc in machines_data:
        m = Machine(
            site_id=s.id,
            machine_code=mcode,
            name=mname,
            machine_type=mtype,
            manufacturer=mfg,
            model_number=model,
            serial_number=ser,
            installation_date=idate,
            status=stat,
            criticality=crit,
            description=desc
        )
        db.add(m)
        machines_list.append(m)
    db.flush()
    machine_m104 = machines_list[0] # M-104

    # 11. SERVICE REQUESTS (30 Requests, highlighting SR-1001)
    # The flagship demo request: SR-1001 for M-104 Hydraulic Pressure Failure
    sr1001_deadline = now + timedelta(hours=3, minutes=30)
    sr1001 = ServiceRequest(
        request_code="SR-1001",
        machine_id=machine_m104.id,
        site_id=site_det.id,
        title="M-104 Hydraulic Pressure Failure & Pump Cavitation",
        description="Main hydraulic circuit pressure dropped below 180 bar threshold during stamping cycle. Audible cavitation from axial pump head. Urgent diagnostic and pump replacement required to prevent plant stoppage.",
        request_type="CORRECTIVE",
        priority="CRITICAL",
        status="ASSIGNED",
        requested_at=now - timedelta(hours=1),
        approved_at=now - timedelta(minutes=45),
        sla_deadline=sr1001_deadline,
        estimated_duration_minutes=150,
        created_by=manager_user.id
    )
    db.add(sr1001)
    db.flush()

    # Skills required for SR-1001: Hydraulic Systems (min proficiency 4) & Mechanical (min 3)
    db.add(ServiceRequestSkill(service_request_id=sr1001.id, skill_id=skills_list[0].id, minimum_proficiency=4, is_required=True))
    db.add(ServiceRequestSkill(service_request_id=sr1001.id, skill_id=skills_list[2].id, minimum_proficiency=3, is_required=True))

    # Parts required for SR-1001: P-104 Hydraulic Pump Assembly
    db.add(ServiceRequestPart(service_request_id=sr1001.id, spare_part_id=part_p104.id, required_quantity=1, reserved_quantity=1, is_required=True))
    db.add(ServiceRequestPart(service_request_id=sr1001.id, spare_part_id=spare_parts_list[1].id, required_quantity=1, reserved_quantity=1, is_required=False))

    # Initial Assignment for SR-1001: Assigned to Technician T1!
    sr1001_start = now + timedelta(minutes=15)
    sr1001_end = sr1001_start + timedelta(minutes=150)
    assgn_sr1001 = Assignment(
        service_request_id=sr1001.id,
        technician_id=tech_t1.id,
        assignment_status="ASSIGNED",
        scheduled_start=sr1001_start,
        scheduled_end=sr1001_end,
        travel_distance_km=Decimal("4.2"),
        travel_duration_minutes=12,
        assignment_score=Decimal("94.50"),
        assigned_by=dispatcher_user.id,
        assigned_at=now - timedelta(minutes=30)
    )
    db.add(assgn_sr1001)
    db.flush()

    # Tasks for SR-1001
    tasks_sr1001 = [
        ("Depressurize 350-bar circuit & apply Lockout/Tagout protocol", "Ensure 0 PSI in manifold accumulators.", 1),
        ("Disassemble suction line and inspect P-104 pump head for metal scoring", "Check magnetic particle filter trap.", 2),
        ("Rig and mount replacement Bosch Rexroth P-104 pump assembly", "Torque flange bolts to 420 Nm specification.", 3),
        ("Flush circuit, bleed trapped air, and recalibrate proportional valve", "Verify 320 bar holding test.", 4),
        ("Execute dry stamping cycle and record vibration telemetry", "Baseline FFT vibration validation.", 5)
    ]
    for tname, tdesc, seq in tasks_sr1001:
        db.add(ServiceTask(
            service_request_id=sr1001.id,
            assignment_id=assgn_sr1001.id,
            task_name=tname,
            description=tdesc,
            status="PENDING",
            sequence_number=seq
        ))

    # Additional realistic requests across sites
    more_requests = [
        ("SR-1002", machines_list[1], site_det, "CNC Spindle Bearing Thermal Spike", "Spindle bearing thermal sensor alarm triggered at 75°C. Check lubrication delivery.", "CORRECTIVE", "HIGH", "APPROVED", 120),
        ("SR-1003", machines_list[2], site_det, "Robot Cell Arm 3 Servo Jitter", "Joint 3 harmonic drive feedback intermittent during spot weld cycle.", "CORRECTIVE", "HIGH", "ASSIGNED", 90),
        ("SR-1004", machines_list[3], site_det, "Quarterly Compressed Air System Overhaul", "Comprehensive valve kit swap and desiccant dryer regeneration.", "PREVENTIVE", "MEDIUM", "OPEN", 240),
        ("SR-1005", machines_list[4], site_det, "Chilled Water Loop Pressure Loss", "Expansion tank level dropped 35%. Suspected gasket failure.", "CORRECTIVE", "MEDIUM", "APPROVED", 180),
        ("SR-1006", machines_list[5], site_cle, "Transfer Press Die Clamp Hydraulic Leak", "Minor leak on upper manifold manifold block.", "CORRECTIVE", "MEDIUM", "OPEN", 90),
        ("SR-1007", machines_list[6], site_cle, "Plasma Torch Height Controller Calibration", "Arc voltage sensor drifting resulting in bevel cuts.", "INSPECTION", "LOW", "OPEN", 60),
        ("SR-1008", machines_list[7], site_cle, "CNC Boring Mill Annual Geometric Alignment", "Laser interferometry alignment and backlash compensation.", "PREVENTIVE", "MEDIUM", "APPROVED", 300),
        ("SR-1009", machines_list[8], site_cle, "AGV Battery Docking Station Optical Sensor Fault", "Sensor blinded by ambient reflective glare.", "CORRECTIVE", "LOW", "COMPLETED", 45),
        ("SR-1010", machines_list[9], site_cle, "Electrodynamic Shaker Amplifier Warning", "Cooling air flow restriction warning on power module.", "CORRECTIVE", "MEDIUM", "OPEN", 90),
        ("SR-1011", machines_list[10], site_pit, "Induction Furnace Coil Water Flow Anomaly", "Emergency temperature shutdown on primary copper induction coils.", "EMERGENCY", "CRITICAL", "ASSIGNED", 180),
        ("SR-1012", machines_list[11], site_pit, "4000T Forging Press Main Ram Seal Weep", "Hydraulic fluid weep observed along main cylinder chrome rod.", "CORRECTIVE", "HIGH", "OPEN", 210),
        ("SR-1013", machines_list[12], site_pit, "Roll Grinder CBN Wheel Dresser Replacement", "Diamond dresser diamond worn down past service tolerance.", "CORRECTIVE", "MEDIUM", "COMPLETED", 90),
        ("SR-1014", machines_list[13], site_pit, "Atmosphere Annealing Zone 2 Thermocouple Drift", "Zone 2 reading 30°C higher than redundant reference probe.", "CORRECTIVE", "HIGH", "APPROVED", 75),
        ("SR-1015", machines_list[14], site_pit, "Scrubber pH Dosing Pump Diaphragm Failure", "Acid neutralization dosing pump lost prime.", "CORRECTIVE", "HIGH", "OPEN", 90)
    ]

    for req_code, m, s, rtitle, rdesc, rtype, rpriority, rstatus, rduration in more_requests:
        deadline = now + timedelta(hours=12 if rpriority == "HIGH" else 24)
        req_obj = ServiceRequest(
            request_code=req_code,
            machine_id=m.id,
            site_id=s.id,
            title=rtitle,
            description=rdesc,
            request_type=rtype,
            priority=rpriority,
            status=rstatus,
            requested_at=now - timedelta(hours=2),
            approved_at=now - timedelta(hours=1) if rstatus != "OPEN" else None,
            sla_deadline=deadline,
            estimated_duration_minutes=rduration,
            created_by=manager_user.id
        )
        db.add(req_obj)

    # 12. Pre-seed Disruption Exception & Candidate Recovery Plans for demonstration
    exc_demo = ExceptionRecord(
        service_request_id=sr1001.id,
        assignment_id=assgn_sr1001.id,
        exception_type="TECHNICIAN_UNAVAILABLE",
        severity="CRITICAL",
        title="Technician T1 En Route Disruption: M-104 Hydraulic Emergency",
        description="Technician T1 reported emergency vehicle breakdown 2.5 miles from Detroit Gigafactory. Job 'SR-1001' is critical path with 3.5 hours remaining on SLA.",
        status="OPEN",
        detected_at=now - timedelta(minutes=10),
        detected_by=dispatcher_user.id
    )
    db.add(exc_demo)
    db.flush()

    # Pre-generate 3 recovery plans for demo
    plan1 = RecoveryPlan(
        exception_id=exc_demo.id,
        service_request_id=sr1001.id,
        plan_name="AI Option A: Immediate Reassignment to T2 (Samantha Rivera)",
        description="Reassign to Samantha Rivera (Master Electro-Mechanical, 8.0 yrs exp). Currently on standby 3.8 km away. Skill match 92%. Preserves SLA buffer with +15 min delay.",
        strategy_type="REASSIGN_TECHNICIAN",
        proposed_technician_id=technicians_list[1].id, # T2
        proposed_start=now + timedelta(minutes=20),
        proposed_end=now + timedelta(minutes=170),
        estimated_travel_distance_km=Decimal("3.8"),
        estimated_delay_minutes=15,
        score=Decimal("92.40"),
        status="PROPOSED"
    )
    plan2 = RecoveryPlan(
        exception_id=exc_demo.id,
        service_request_id=sr1001.id,
        plan_name="Option B: Reschedule with Secondary Tech T3 (Derrick Vance)",
        description="Assign Derrick Vance (Hydraulics & Automation, 6.5 yrs exp). Currently completing inspection in Sector 4. +45 min travel delay.",
        strategy_type="RESCHEDULE",
        proposed_technician_id=technicians_list[2].id, # T3
        proposed_start=now + timedelta(minutes=55),
        proposed_end=now + timedelta(minutes=205),
        estimated_travel_distance_km=Decimal("8.4"),
        estimated_delay_minutes=45,
        score=Decimal("81.10"),
        status="PROPOSED"
    )
    plan3 = RecoveryPlan(
        exception_id=exc_demo.id,
        service_request_id=sr1001.id,
        plan_name="Option C: Standby for T1 Replacement Transport",
        description="Wait for emergency transport recovery vehicle for T1. Estimated delay +90 minutes. SLA status enters AT_RISK zone.",
        strategy_type="OTHER",
        proposed_technician_id=tech_t1.id,
        proposed_start=now + timedelta(minutes=105),
        proposed_end=now + timedelta(minutes=255),
        estimated_travel_distance_km=Decimal("4.2"),
        estimated_delay_minutes=90,
        score=Decimal("58.00"),
        status="PROPOSED"
    )
    db.add_all([plan1, plan2, plan3])

    # 13. Pre-seed Simulation Scenario
    scenario = SimulationScenario(
        name="Counterfactual: Multi-Technician Midwest Blizzard Dropout",
        description="Simulate extreme weather disruption causing dropout of 3 key hydraulic technicians (T1, T2, T9) and delayed spare part logistics.",
        scenario_type="MULTIPLE_FAILURES",
        base_service_request_id=sr1001.id,
        status="DRAFT",
        created_by=manager_user.id
    )
    db.add(scenario)
    db.flush()

    db.add(SimulationEvent(
        scenario_id=scenario.id,
        event_type="TECHNICIAN_UNAVAILABLE",
        target_entity_type="TECHNICIAN",
        target_entity_id=tech_t1.id,
        description="T1 unable to commute due to highway closure."
    ))
    db.add(SimulationEvent(
        scenario_id=scenario.id,
        event_type="TRAVEL_DELAY",
        target_entity_type="OTHER",
        event_data={"delay_minutes": 60},
        description="Widespread 60-minute transit delays across Michigan and Ohio."
    ))

    # 14. Pre-seed Notifications
    db.add(Notification(
        user_id=dispatcher_user.id,
        service_request_id=sr1001.id,
        exception_id=exc_demo.id,
        notification_type="EXCEPTION",
        title="CRITICAL: Technician T1 Disrupted on SR-1001",
        message="Technician T1 reported unavailable. 3 candidate AI recovery plans generated. Immediate dispatcher review required.",
        is_read=False
    ))
    db.add(Notification(
        user_id=manager_user.id,
        service_request_id=sr1001.id,
        exception_id=exc_demo.id,
        notification_type="SLA_RISK",
        title="SLA Risk: M-104 Hydraulic Press",
        message="Stamping press SR-1001 SLA deadline approaching in 3.5 hours with active technician dropout.",
        is_read=False
    ))

    # 15. Initial Audit Logs
    db.add(AuditLog(
        user_id=manager_user.id,
        entity_type="SERVICE_REQUEST",
        entity_id=sr1001.id,
        action="APPROVE_SERVICE_REQUEST",
        new_values={"request_code": "SR-1001", "status": "APPROVED"}
    ))
    db.add(AuditLog(
        user_id=dispatcher_user.id,
        entity_type="ASSIGNMENT",
        entity_id=assgn_sr1001.id,
        action="ASSIGN_TECHNICIAN",
        new_values={"technician_code": "T1", "request_code": "SR-1001"}
    ))
    db.add(AuditLog(
        user_id=dispatcher_user.id,
        entity_type="EXCEPTION",
        entity_id=exc_demo.id,
        action="CREATE_EXCEPTION",
        new_values={"exception_type": "TECHNICIAN_UNAVAILABLE", "severity": "CRITICAL"}
    ))

    db.commit()
    db.close()
    print("Seed data successfully committed to PostgreSQL database MORPHIX!")

if __name__ == "__main__":
    seed_database()
