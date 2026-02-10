import apiClient from '../axios-instance';
import { API_ENDPOINTS } from '../constants';

export const branchesApi = {
  getAll: () => apiClient.get(API_ENDPOINTS.BRANCHES),
  getById: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}`),
  getServices: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}/services`),
  getDoctors: (id: string) => apiClient.get(`${API_ENDPOINTS.BRANCHES}/${id}/doctors`),
};
