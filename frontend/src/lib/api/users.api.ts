import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export type UserRole = 'ADMIN' | 'BRANCH_MANAGER' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  } | null;
  patient?: {
    id: string;
    dateOfBirth: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    medicalHistory?: string | null;
    allergies?: string | null;
  } | null;
}

export interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserQuery {
  search?: string;
  role?: UserRole;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ChangeRoleData {
  role: UserRole;
}

export interface ResetPasswordResponse {
  message: string;
  tempPassword: string;
}

export const usersApi = {
  getAll: (query?: UserQuery) => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.role) params.append('role', query.role);
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.USERS}?${queryString}` : API_ENDPOINTS.USERS;

    console.log('[Users API] Fetching:', url);
    return apiClient.get<PaginatedUsers>(url);
  },

  getById: (id: string) => {
    console.log('[Users API] Fetching by ID:', id);
    return apiClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`);
  },

  update: (id: string, data: UpdateUserData) => {
    console.log('[Users API] Updating user:', id, data);
    return apiClient.patch<User>(`${API_ENDPOINTS.USERS}/${id}`, data);
  },

  changeStatus: (id: string, isActive: boolean) => {
    console.log('[Users API] Changing status:', id, isActive);
    return apiClient.patch<User>(`${API_ENDPOINTS.USERS}/${id}/status`, { isActive });
  },

  changeRole: (id: string, role: UserRole) => {
    console.log('[Users API] Changing role:', id, role);
    return apiClient.patch<User>(`${API_ENDPOINTS.USERS}/${id}/role`, { role });
  },

  resetPassword: (id: string) => {
    console.log('[Users API] Resetting password:', id);
    return apiClient.post<ResetPasswordResponse>(`${API_ENDPOINTS.USERS}/${id}/reset-password`);
  },
};
