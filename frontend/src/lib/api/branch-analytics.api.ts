import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// Types
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

export interface DailyTrend {
  date: string;
  totalAppointments: number;
  completed: number;
  revenue: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  totalRevenue: number;
  avgAppointmentsPerDay: number;
  dailyBreakdown: DailyTrend[];
}

export interface ServiceStats {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  revenue: number;
}

export interface DoctorPerformance {
  doctorId: string;
  doctorFirstName: string;
  doctorLastName: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  revenue: number;
}

export interface MonthlyStats {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  totalRevenue: number;
  completionRate: number;
  noShowRate: number;
  avgAppointmentsPerDay: number;
  topServices: ServiceStats[];
  doctorPerformance: DoctorPerformance[];
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
}

// API Methods
export const analyticsApi = {
  // Get daily stats
  getDailyStats: async (): Promise<DailyStats> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/branch/daily`);
    return response.data?.data ?? response.data;
  },

  // Get weekly stats
  getWeeklyStats: async (): Promise<WeeklyStats> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/branch/weekly`);
    return response.data?.data ?? response.data;
  },

  // Get monthly stats
  getMonthlyStats: async (params?: AnalyticsQueryParams): Promise<MonthlyStats> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS}/branch/monthly`, { params });
    return response.data?.data ?? response.data;
  },
};
