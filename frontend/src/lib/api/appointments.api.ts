import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export interface CreateAppointmentData {
  branchId: string;
  doctorId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

// Types for patient appointments (medical records)
export interface PatientAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes: string | null;
  cancelReason: string | null;
  isWalkIn: boolean;
  tokenNumber: string | null;
  checkInTime: string | null;
  createdAt: string;
  updatedAt: string;
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
  };
  branch: {
    name: string;
    address: string;
  };
  service: {
    name: string;
    duration: number;
  };
}

export interface AdminAppointmentsQuery {
  status?: string;
  branchId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ManagerAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes: string | null;
  isWalkIn: boolean;
  tokenNumber: string | null;
  checkInTime: string | null;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
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
    price: number;
  };
}

export const appointmentsApi = {
  getAdmin: (query?: AdminAppointmentsQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.branchId) params.append('branchId', query.branchId);
    if (query?.doctorId) params.append('doctorId', query.doctorId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_ENDPOINTS.APPOINTMENTS}/admin?${queryString}` 
      : `${API_ENDPOINTS.APPOINTMENTS}/admin`;
    
    return apiClient.get(url);
  },
  getManager: (query?: { status?: string; date?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.date) params.append('date', query.date);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.APPOINTMENTS}/manager?${queryString}`
      : `${API_ENDPOINTS.APPOINTMENTS}/manager`;
    return apiClient.get<{ data: { data: ManagerAppointment[]; total: number } }>(url);
  },
  getAll: (params?: { status?: string; date?: string }) =>
    apiClient.get(API_ENDPOINTS.APPOINTMENTS, { params }),
  getMyAppointments: () => apiClient.get(`${API_ENDPOINTS.APPOINTMENTS}/my-appointments`),
  getById: (id: string) => apiClient.get(`${API_ENDPOINTS.APPOINTMENTS}/${id}`),
  create: (data: CreateAppointmentData) => apiClient.post(API_ENDPOINTS.APPOINTMENTS, data),
  update: (id: string, data: Partial<CreateAppointmentData>) =>
    apiClient.patch(`${API_ENDPOINTS.APPOINTMENTS}/${id}`, data),
  cancel: (id: string, reason: string) =>
    apiClient.patch(`${API_ENDPOINTS.APPOINTMENTS}/${id}/cancel`, { reason }),
};
