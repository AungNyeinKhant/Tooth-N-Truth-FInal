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

export const appointmentsApi = {
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
