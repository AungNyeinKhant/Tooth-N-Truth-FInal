import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedServices {
  data: Service[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ServiceQuery {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  isActive?: boolean;
}

export const servicesApi = {
  getAll: (query?: ServiceQuery) => {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.SERVICES}?${queryString}` : API_ENDPOINTS.SERVICES;
    
    return apiClient.get<PaginatedServices>(url);
  },
  
  getById: (id: string) => apiClient.get<Service>(`${API_ENDPOINTS.SERVICES}/${id}`),
  
  create: (data: CreateServiceData) => apiClient.post<Service>(API_ENDPOINTS.SERVICES, data),
  
  update: (id: string, data: UpdateServiceData) => 
    apiClient.patch<Service>(`${API_ENDPOINTS.SERVICES}/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`${API_ENDPOINTS.SERVICES}/${id}`),
};
