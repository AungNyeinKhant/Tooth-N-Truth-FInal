import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// ==================== Admin Stats Types ====================

export interface AdminStats {
  // Basic counts
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointmentsToday: number;
  
  // This month's metrics
  totalAppointmentsThisMonth: number;
  totalRevenueThisMonth: number;
  newPatientsThisMonth: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  
  // Rates (percentages)
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  
  // Comparisons (vs last month)
  revenueChange: number;
  revenueChangePercent: number;
  appointmentsChange: number;
  appointmentsChangePercent: number;
  patientsChange: number;
  patientsChangePercent: number;
}

export interface RevenueTrend {
  month: string;
  year: number;
  revenue: number;
  appointments: number;
}

export interface RevenueTrendResponse {
  data: RevenueTrend[];
  totalRevenue: number;
  avgMonthlyRevenue: number;
}

export interface BranchAppointment {
  branchId: string;
  branchName: string;
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
}

export interface AppointmentsByBranchResponse {
  branches: BranchAppointment[];
  totalAppointments: number;
  topBranch: BranchAppointment | null;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  appointmentCount: number;
  revenue: number;
}

export interface TopServicesResponse {
  services: TopService[];
  totalRevenue: number;
}

export interface PatientGrowth {
  month: string;
  year: number;
  newPatients: number;
  totalPatients: number;
}

export interface PatientGrowthResponse {
  data: PatientGrowth[];
  totalNewPatients: number;
  growthRate: number;
}

// ==================== Branch Manager Stats Types ====================

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

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  totalRevenue: number;
  avgAppointmentsPerDay: number;
  dailyBreakdown: {
    date: string;
    totalAppointments: number;
    completed: number;
    revenue: number;
  }[];
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

// ==================== API Methods ====================

export const analyticsApi = {
  // Admin endpoints
  getAdminStats: () => apiClient.get<{ data: AdminStats }>(`${API_ENDPOINTS.ANALYTICS}/admin/stats`),
  getRevenueTrend: () => apiClient.get<{ data: RevenueTrendResponse }>(`${API_ENDPOINTS.ANALYTICS}/admin/revenue-trend`),
  getAppointmentsByBranch: () => apiClient.get<{ data: AppointmentsByBranchResponse }>(`${API_ENDPOINTS.ANALYTICS}/admin/appointments-by-branch`),
  getTopServices: (limit?: number) => apiClient.get<{ data: TopServicesResponse }>(
    `${API_ENDPOINTS.ANALYTICS}/admin/top-services${limit ? `?limit=${limit}` : ''}`
  ),
  getPatientGrowth: () => apiClient.get<{ data: PatientGrowthResponse }>(`${API_ENDPOINTS.ANALYTICS}/admin/patient-growth`),

  // Branch manager endpoints
  getDailyStats: () => apiClient.get<{ data: DailyStats }>(`${API_ENDPOINTS.ANALYTICS}/branch/daily`),
  getWeeklyStats: () => apiClient.get<{ data: WeeklyStats }>(`${API_ENDPOINTS.ANALYTICS}/branch/weekly`),
  getMonthlyStats: (params?: { startDate?: string; endDate?: string; doctorId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    const query = queryParams.toString();
    return apiClient.get<{ data: MonthlyStats }>(
      `${API_ENDPOINTS.ANALYTICS}/branch/monthly${query ? `?${query}` : ''}`
    );
  },
};
