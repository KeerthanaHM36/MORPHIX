// Structured data for MORPHIX Live Field Operations (Bengaluru Region)
// Designed to be easily connected to backend APIs (e.g., GET /api/technicians/live, GET /api/service-requests/active)

export type TechnicianStatus = 'EN_ROUTE' | 'DELAYED' | 'ON_SITE' | 'AVAILABLE' | 'ON_BREAK';

export interface LiveTechnician {
  id: string;
  code: string;
  name: string;
  status: TechnicianStatus;
  statusLabel: string;
  serviceMachineId?: string;
  serviceMachineCode?: string;
  eta?: string;
  lat: number;
  lng: number;
  primarySkill: string;
  phone: string;
  avatarInitials: string;
  color: string;
  badgeBg: string;
}

export interface LiveMachineLocation {
  id: string;
  machineCode: string;
  machineName: string;
  serviceRequestId: string;
  issue: string;
  slaStatus: 'AT_RISK' | 'IN_PROGRESS' | 'OPEN';
  slaDeadline: string;
  priority: 'HIGH' | 'MEDIUM' | 'CRITICAL';
  assignedTechCode?: string;
  assignedTechName?: string;
  lat: number;
  lng: number;
  facilityName: string;
  address: string;
}

export interface LiveDepot {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  inventoryHighlights: string[];
  etaToActiveSites: string;
}

export interface LiveRoute {
  id: string;
  techCode: string;
  targetMachineCode: string;
  status: TechnicianStatus;
  color: string;
  dashArray?: string;
  coordinates: [number, number][];
}

// Map initial configuration (Configurable for dynamic backend region assignment)
export const BENGALURU_MAP_CONFIG = {
  center: [12.9716, 77.5946] as [number, number], // Bengaluru Central
  defaultZoom: 12,
  minZoom: 10,
  maxZoom: 18,
};

// Depots / Warehouses in Bengaluru
export const LIVE_DEPOTS: LiveDepot[] = [
  {
    id: 'DEPOT-BLR-01',
    name: 'Bangalore Central Depot',
    type: 'Regional Central Warehouse & Spares Depot',
    lat: 13.0238,
    lng: 77.5501, // Yeshwanthpur Industrial Corridor
    address: 'Plot 42, Tumkur Road, Yeshwanthpur Industrial Area, Bengaluru',
    inventoryHighlights: [
      'P-104 Hydraulic Pump Assembly (4 in stock)',
      'CNC Spindle Bearings Set (8 in stock)',
      'Siemens S7-1500 PLC Modules (12 in stock)',
    ],
    etaToActiveSites: '1.5 hrs',
  },
];

// Active Machines / Service Breakdown Locations in Bengaluru
export const LIVE_MACHINES: LiveMachineLocation[] = [
  {
    id: 'MACH-104',
    machineCode: 'M-104',
    machineName: 'M-104 3500-Ton Hydraulic Stamping Press',
    serviceRequestId: 'SR-1042',
    issue: 'Spindle motor failure & high hydraulic vibration',
    slaStatus: 'AT_RISK',
    slaDeadline: 'Today, 8:00 PM',
    priority: 'HIGH',
    assignedTechCode: 'T-08',
    assignedTechName: 'Priya S.',
    lat: 13.0285,
    lng: 77.5186, // Peenya Industrial Area Phase 1
    facilityName: 'Apex Peenya Advanced Stamping Plant',
    address: 'Peenya Industrial Estate 2nd Stage, Bengaluru',
  },
  {
    id: 'MACH-087',
    machineCode: 'M-087',
    machineName: 'M-087 5-Axis CNC Precision Milling Center',
    serviceRequestId: 'SR-1038',
    issue: 'Axis-Y linear guideway lubrication degradation',
    slaStatus: 'IN_PROGRESS',
    slaDeadline: 'Today, 11:30 PM',
    priority: 'MEDIUM',
    assignedTechCode: 'T-21',
    assignedTechName: 'Arjun M.',
    lat: 12.8425,
    lng: 77.6740, // Electronic City Phase 1
    facilityName: 'Apex Electronic City Precision Complex',
    address: 'Electronics City Phase 1, Hosur Road, Bengaluru',
  },
  {
    id: 'MACH-203',
    machineCode: 'M-203',
    machineName: 'M-203 Heavy Hydraulic Forming Press',
    serviceRequestId: 'SR-1047',
    issue: 'High-pressure proportional valve seal leak',
    slaStatus: 'IN_PROGRESS',
    slaDeadline: 'Tomorrow, 10:00 AM',
    priority: 'MEDIUM',
    assignedTechCode: 'T-04',
    assignedTechName: 'Sneha P.',
    lat: 12.9865,
    lng: 77.7312, // Whitefield Industrial Export Zone
    facilityName: 'Apex Whitefield Heavy Fabrication Complex',
    address: 'EPIP Industrial Zone, Whitefield, Bengaluru',
  },
];

// Field Technicians active across Bengaluru
export const LIVE_TECHNICIANS: LiveTechnician[] = [
  {
    id: 'TECH-08',
    code: 'T-08',
    name: 'Priya S.',
    status: 'EN_ROUTE',
    statusLabel: 'En route • 24 min',
    serviceMachineId: 'MACH-104',
    serviceMachineCode: 'M-104',
    eta: '24 min',
    lat: 13.0080,
    lng: 77.5450, // Along Outer Ring Road / Rajajinagar heading to Peenya
    primarySkill: 'Hydraulics & Spindle Bearings (Level 5)',
    phone: '+91-98450-28101',
    avatarInitials: 'PS',
    color: '#0284c7', // Blue
    badgeBg: '#e0f2fe',
  },
  {
    id: 'TECH-12',
    code: 'T-12',
    name: 'Rahul K.',
    status: 'DELAYED',
    statusLabel: 'Delayed (Traffic)',
    serviceMachineId: 'MACH-104',
    serviceMachineCode: 'M-104',
    eta: '45 min',
    lat: 13.0420,
    lng: 77.5895, // Near Hebbal Junction bottleneck
    primarySkill: 'High-Voltage Electrical & Drives (Level 4)',
    phone: '+91-98450-28102',
    avatarInitials: 'RK',
    color: '#ef4444', // Red
    badgeBg: '#fee2e2',
  },
  {
    id: 'TECH-21',
    code: 'T-21',
    name: 'Arjun M.',
    status: 'ON_SITE',
    statusLabel: 'On-site',
    serviceMachineId: 'MACH-087',
    serviceMachineCode: 'M-087',
    lat: 12.8435,
    lng: 77.6725, // Inside Electronic City plant
    primarySkill: 'CNC Kinematics & Precision Alignment (Level 5)',
    phone: '+91-98450-28103',
    avatarInitials: 'AM',
    color: '#10b981', // Green
    badgeBg: '#d1fae5',
  },
  {
    id: 'TECH-04',
    code: 'T-04',
    name: 'Sneha P.',
    status: 'EN_ROUTE',
    statusLabel: 'En route • 18 min',
    serviceMachineId: 'MACH-203',
    serviceMachineCode: 'M-203',
    eta: '18 min',
    lat: 12.9610,
    lng: 77.7020, // Along HAL Old Airport / Varthur Road heading to Whitefield
    primarySkill: 'Hydraulics & Pressure Valves (Level 4)',
    phone: '+91-98450-28104',
    avatarInitials: 'SP',
    color: '#f59e0b', // Orange
    badgeBg: '#fef3c7',
  },
  {
    id: 'TECH-16',
    code: 'T-16',
    name: 'Karthik R.',
    status: 'AVAILABLE',
    statusLabel: 'Available',
    lat: 13.0230,
    lng: 77.5515, // At Bangalore Central Depot
    primarySkill: 'PLC & SCADA Automation (Level 5)',
    phone: '+91-98450-28105',
    avatarInitials: 'KR',
    color: '#6366f1', // Purple/Neutral
    badgeBg: '#e0e7ff',
  },
  {
    id: 'TECH-31',
    code: 'T-31',
    name: 'Neha V.',
    status: 'ON_BREAK',
    statusLabel: 'On break',
    lat: 13.0245,
    lng: 77.5475, // At Depot Rest Area
    primarySkill: 'Robotics & Servos (Level 4)',
    phone: '+91-98450-28106',
    avatarInitials: 'NV',
    color: '#64748b', // Neutral
    badgeBg: '#f1f5f9',
  },
];

// Realistic road waypoints across Bengaluru corridors (not straight lines)
export const LIVE_ROUTES: LiveRoute[] = [
  // 1. T-08 (Priya S.) en route to M-104 (Peenya Industrial Estate) via Outer Ring Road
  {
    id: 'ROUTE-T08-M104',
    techCode: 'T-08',
    targetMachineCode: 'M-104',
    status: 'EN_ROUTE',
    color: '#0284c7', // Blue
    coordinates: [
      [13.0080, 77.5450], // Current location (Rajajinagar/Mahalakshmi)
      [13.0115, 77.5410],
      [13.0160, 77.5350],
      [13.0205, 77.5290],
      [13.0240, 77.5235],
      [13.0285, 77.5186], // M-104 Peenya Plant
    ],
  },
  // 2. T-12 (Rahul K.) delayed in Hebbal / Bellary road traffic heading towards Peenya
  {
    id: 'ROUTE-T12-M104',
    techCode: 'T-12',
    targetMachineCode: 'M-104',
    status: 'DELAYED',
    color: '#ef4444', // Red
    dashArray: '6, 6', // Dashed line for delayed/congested route
    coordinates: [
      [13.0420, 77.5895], // Current location (Hebbal flyover)
      [13.0400, 77.5750],
      [13.0360, 77.5580],
      [13.0310, 77.5400],
      [13.0285, 77.5186], // M-104 Peenya Plant
    ],
  },
  // 3. T-21 (Arjun M.) active on-site connection at M-087 in Electronic City
  {
    id: 'ROUTE-T21-M087',
    techCode: 'T-21',
    targetMachineCode: 'M-087',
    status: 'ON_SITE',
    color: '#10b981', // Green
    coordinates: [
      [12.8435, 77.6725],
      [12.8430, 77.6732],
      [12.8425, 77.6740],
    ],
  },
  // 4. T-04 (Sneha P.) en route to M-203 in Whitefield via Marathahalli - Varthur corridor
  {
    id: 'ROUTE-T04-M203',
    techCode: 'T-04',
    targetMachineCode: 'M-203',
    status: 'EN_ROUTE',
    color: '#f59e0b', // Orange
    coordinates: [
      [12.9610, 77.7020], // Current location (Near Kundalahalli gate)
      [12.9675, 77.7120],
      [12.9740, 77.7215],
      [12.9810, 77.7280],
      [12.9865, 77.7312], // M-203 Whitefield Complex
    ],
  },
];
