import apiClient from '../axios-instance';
import { API_ENDPOINTS } from '../constants';

export const doctorsApi = {
  getAll: (branchId?: string) => apiClient.get(API_ENDPOINTS.DOCTORS, { params: { branchId } }),
  getById: (id: string) => apiClient.get(`${API_ENDPOINTS.DOCTORS}/${id}`),
  getSchedules: (id: string) => apiClient.get(`${API_ENDPOINTS.DOCTORS}/${id}/schedules`),
  getAvailableSlots: (id: string, date: string, serviceId: string) =>
    apiClient.get(`${API_ENDPOINTS.DOCTORS}/${id}/available-slots`, {
      params: { date, serviceId },
    }),
};
