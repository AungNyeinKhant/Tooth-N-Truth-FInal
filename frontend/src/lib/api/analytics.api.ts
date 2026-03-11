import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export interface AdminStats {
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
}

export interface DailyStats {
  totalAppointments: number;
  confirmed: number;
  completed: number;
  noShow: number;
  cancelled: number;
  walkIns: number;
  totalRevenue: number;
  activeDoctors: number;
}

export const analyticsApi = {
  getAdminStats: () => apiClient.get<{ data: AdminStats; success: boolean }>(`${API_ENDPOINTS.ANALYTICS}/admin/stats`),
  getDailyStats: () => apiClient.get<{ data: DailyStats; success: boolean }>(`${API_ENDPOINTS.ANALYTICS}/branch/daily`),
};
