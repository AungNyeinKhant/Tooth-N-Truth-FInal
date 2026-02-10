import apiClient from '../axios-instance';
import { API_ENDPOINTS } from '../constants';

export const servicesApi = {
  getAll: () => apiClient.get(API_ENDPOINTS.SERVICES),
  getById: (id: string) => apiClient.get(`${API_ENDPOINTS.SERVICES}/${id}`),
};
