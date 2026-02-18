import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';
import { BranchQuery, PaginatedBranches } from '@/types';

export interface CreateManagerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateBranchData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  isActive?: boolean;
  manager?: CreateManagerData;
}

export interface UpdateBranchData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export const branchesApi = {
  getAll: (query?: BranchQuery) => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.BRANCHES}?${queryString}` : API_ENDPOINTS.BRANCHES;
    
    return apiClient.get<PaginatedBranches>(url);
  },
  getById: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}`),
  getServices: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}/services`),
  getDoctors: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}/doctors`),
  create: (data: CreateBranchData) => apiClient.post(API_ENDPOINTS.BRANCHES, data),
  update: (id: string, data: UpdateBranchData) => apiClient.patch(`${API_ENDPOINTS.BRANCHES}/${id}`, data),
  delete: (id: string) => apiClient.delete(`${API_ENDPOINTS.BRANCHES}/${id}`),
};
