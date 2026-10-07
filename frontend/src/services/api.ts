import axios from 'axios';
import { 
  User, Organization, Site, Machine, Skill, Technician, 
  SparePart, Inventory, ServiceRequest, Assignment, 
  ServiceTask, ServiceEvidence, ExceptionRecord, 
  RecoveryPlan, DashboardData, NotificationItem, AuditLogItem 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('morphix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('morphix_token');
      localStorage.removeItem('morphix_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const dashboardAPI = {
  getDashboard: async () => {
    const res = await api.get<DashboardData>('/dashboard');
    return res.data;
  },
};

export const serviceRequestsAPI = {
  list: async (params?: any) => {
    const res = await api.get<ServiceRequest[]>('/service-requests', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<ServiceRequest>(`/service-requests/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<ServiceRequest>('/service-requests', data);
    return res.data;
  },
  approve: async (id: string) => {
    const res = await api.post<ServiceRequest>(`/service-requests/${id}/approve`);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch<ServiceRequest>(`/service-requests/${id}`, data);
    return res.data;
  },
};

export const assignmentsAPI = {
  list: async (params?: any) => {
    const res = await api.get<Assignment[]>('/assignments', { params });
    return res.data;
  },
  match: async (serviceRequestId: string) => {
    const res = await api.get<any[]>(`/assignments/match/${serviceRequestId}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<Assignment>('/assignments', data);
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch<Assignment>(`/assignments/${id}`, data);
    return res.data;
  },
  optimize: async (requestIds?: string[]) => {
    const res = await api.post<any[]>('/assignments/optimize', { request_ids: requestIds });
    return res.data;
  },
};

export const techniciansAPI = {
  list: async (params?: any) => {
    const res = await api.get<Technician[]>('/technicians', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Technician>(`/technicians/${id}`);
    return res.data;
  },
  triggerUnavailable: async (id: string, reason?: string) => {
    const res = await api.post<ExceptionRecord[]>(`/technicians/${id}/trigger-unavailable`, null, {
      params: { reason },
    });
    return res.data;
  },
};

export const machinesAPI = {
  list: async (params?: any) => {
    const res = await api.get<Machine[]>('/machines', { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get<Machine>(`/machines/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<Machine>('/machines', data);
    return res.data;
  },
};

export const sitesAPI = {
  list: async () => {
    const res = await api.get<Site[]>('/sites');
    return res.data;
  },
};

export const skillsAPI = {
  list: async () => {
    const res = await api.get<Skill[]>('/skills');
    return res.data;
  },
};

export const sparePartsAPI = {
  list: async () => {
    const res = await api.get<SparePart[]>('/spare-parts');
    return res.data;
  },
};

export const inventoryAPI = {
  list: async (params?: any) => {
    const res = await api.get<Inventory[]>('/inventory', { params });
    return res.data;
  },
};

export const tasksAPI = {
  list: async (params?: any) => {
    const res = await api.get<ServiceTask[]>('/tasks', { params });
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await api.patch<ServiceTask>(`/tasks/${id}`, data);
    return res.data;
  },
};

export const evidenceAPI = {
  list: async (params?: any) => {
    const res = await api.get<ServiceEvidence[]>('/evidence', { params });
    return res.data;
  },
  upload: async (formData: FormData) => {
    const res = await api.post<ServiceEvidence>('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  verify: async (id: string, isVerified: boolean, notes?: string) => {
    const res = await api.post<ServiceEvidence>(`/evidence/${id}/verify`, {
      is_verified: isVerified,
      notes,
    });
    return res.data;
  },
};

export const exceptionsAPI = {
  list: async (params?: any) => {
    const res = await api.get<ExceptionRecord[]>('/exceptions', { params });
    return res.data;
  },
  getPlans: async (id: string) => {
    const res = await api.get<RecoveryPlan[]>(`/exceptions/${id}/plans`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<ExceptionRecord>('/exceptions', data);
    return res.data;
  },
};

export const recoveryAPI = {
  list: async (params?: any) => {
    const res = await api.get<RecoveryPlan[]>('/recovery', { params });
    return res.data;
  },
  apply: async (planId: string, notes?: string) => {
    const res = await api.post<RecoveryPlan>('/recovery/apply', { plan_id: planId, notes });
    return res.data;
  },
};

export const simulationAPI = {
  list: async () => {
    const res = await api.get<any[]>('/simulations');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post<any>('/simulations', data);
    return res.data;
  },
  run: async (scenarioId: string) => {
    const res = await api.post<any>(`/simulations/${scenarioId}/run`);
    return res.data;
  },
};

export const notificationsAPI = {
  list: async () => {
    const res = await api.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post('/notifications/read-all');
    return res.data;
  },
};

export const auditLogsAPI = {
  list: async (params?: any) => {
    const res = await api.get<AuditLogItem[]>('/audit-logs', { params });
    return res.data;
  },
};

export default api;
