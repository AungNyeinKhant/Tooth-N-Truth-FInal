import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  schedules?: DoctorSchedule[];
}

export interface DoctorSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
}

export interface PaginatedDoctors {
  data: Doctor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DoctorQuery {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  branchId?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}

export interface CreateDoctorData {
  firstName: string;
  lastName: string;
  specialization: string;
  phone?: string;
  email?: string;
  bio?: string;
  branchId: string;
  isActive?: boolean;
}

export interface UpdateDoctorData {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  bio?: string;
  branchId?: string;
  isActive?: boolean;
}

export const doctorsApi = {
  getAll: (query?: DoctorQuery) => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.branchId) params.append('branchId', query.branchId);
    if (query?.specialization) params.append('specialization', query.specialization);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.DOCTORS}?${queryString}` : API_ENDPOINTS.DOCTORS;
    
    console.log('[Doctors API] Fetching:', url);
    return apiClient.get<PaginatedDoctors>(url);
  },
  
  getById: (id: string) => {
    console.log('[Doctors API] Fetching by ID:', id);
    return apiClient.get<Doctor>(`${API_ENDPOINTS.DOCTORS}/${id}`);
  },
  
  getSchedules: (id: string) => {
    console.log('[Doctors API] Fetching schedules for:', id);
    return apiClient.get<DoctorSchedule[]>(`${API_ENDPOINTS.DOCTORS}/${id}/schedules`);
  },
  
  getAvailableSlots: (doctorId: string, date: string, serviceId: string) => {
    console.log('[Doctors API] Fetching available slots:', { doctorId, date, serviceId });
    return apiClient.get<Array<{ startTime: string; endTime: string; isBooked?: boolean }>>(
      `${API_ENDPOINTS.DOCTORS}/${doctorId}/available-slots?date=${date}&serviceId=${serviceId}`
    );
  },
  
  create: (data: CreateDoctorData) => {
    console.log('[Doctors API] Creating doctor:', data);
    return apiClient.post<Doctor>(API_ENDPOINTS.DOCTORS, data);
  },
  
  update: (id: string, data: UpdateDoctorData) => {
    console.log('[Doctors API] Updating doctor:', id, data);
    return apiClient.patch<Doctor>(`${API_ENDPOINTS.DOCTORS}/${id}`, data);
  },
  
  delete: (id: string) => {
    console.log('[Doctors API] Deleting doctor:', id);
    return apiClient.delete(`${API_ENDPOINTS.DOCTORS}/${id}`);
  },
};
