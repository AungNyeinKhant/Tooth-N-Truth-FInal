import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export interface AdminStats {
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
}

export const analyticsApi = {
  getAdminStats: () => apiClient.get<AdminStats>(`${API_ENDPOINTS.ANALYTICS}/admin/stats`),
};
