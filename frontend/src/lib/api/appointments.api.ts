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
