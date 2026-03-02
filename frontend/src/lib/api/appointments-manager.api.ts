import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// Types
export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  cancelReason: string | null;
  isWalkIn: boolean;
  tokenNumber: string | null;
  checkInTime: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    };
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  branch: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: string | number;
  };
}

export interface AppointmentListResponse {
  data: Appointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryAppointmentsParams {
  status?: AppointmentStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RescheduleData {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
}

export interface UpdateStatusData {
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
}

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

export interface Patient {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

// Helper to extract list data from response
const extractList = (response: any): { items: any[]; total: number } => {
  const payload = response.data?.data;
  if (payload?.data && Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: payload.meta?.total ?? payload.data.length,
    };
  }
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  return { items: [], total: 0 };
};

// Helper to extract single item
const extractItem = (response: any): any => {
  return response.data?.data ?? response.data;
};

export const appointmentsApi = {
  // Get appointments for manager (branch-scoped)
  getManagerAppointments: async (params?: QueryAppointmentsParams): Promise<AppointmentListResponse> => {
    const response = await apiClient.get(`${API_ENDPOINTS.APPOINTMENTS}/manager`, { params });
    const payload = (response.data as any)?.data;
    return {
      data: Array.isArray(payload?.data) ? payload.data : [],
      meta: payload?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  // Search patients for manager
  searchPatients: async (phone?: string, name?: string): Promise<Patient[]> => {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (name) params.append('name', name);
    const response = await apiClient.get(`${API_ENDPOINTS.APPOINTMENTS}/manager/patients?${params.toString()}`);
    return response.data?.data ?? response.data ?? [];
  },

  // Reschedule appointment
  reschedule: async (id: string, data: RescheduleData): Promise<Appointment> => {
    const response = await apiClient.patch(`${API_ENDPOINTS.APPOINTMENTS}/${id}/reschedule`, data);
    return extractItem(response);
  },

  // Update appointment status
  updateStatus: async (id: string, data: UpdateStatusData): Promise<Appointment> => {
    const response = await apiClient.patch(`${API_ENDPOINTS.APPOINTMENTS}/${id}/status`, data);
    return extractItem(response);
  },

  // Create appointment for patient (manager)
  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await apiClient.post(`${API_ENDPOINTS.APPOINTMENTS}/manager-create`, data);
    return extractItem(response);
  },

  // Get single appointment
  getOne: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get(`${API_ENDPOINTS.APPOINTMENTS}/${id}`);
    return extractItem(response);
  },
};

// Status helpers
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-red-100 text-red-800',
};
