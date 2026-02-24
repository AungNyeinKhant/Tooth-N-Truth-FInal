import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// Types
export interface Slot {
  id: string;
  branchId: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  bufferTime: number;
  isActive: boolean;
  isBooked?: boolean; // For available slots - true if slot is already booked
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface CreateSlotData {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  bufferTime?: number;
  isActive?: boolean;
}

export interface UpdateSlotData {
  startTime?: string;
  endTime?: string;
  bufferTime?: number;
  isActive?: boolean;
}

export interface BulkSlotData {
  doctorId: string;
  days: number[];
  startTime: string;
  endTime: string;
  bufferTime?: number;
  isActive?: boolean;
}

export interface SlotQuery {
  doctorId?: string;
  dayOfWeek?: number;
  page?: number;
  limit?: number;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

// Helper to extract list data from response
const extractList = (response: any): { items: Slot[]; total: number } => {
  const payload = response.data?.data;
  if (payload?.data && Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: payload.meta?.total ?? payload.data.length,
    };
  }
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  return { items: [], total: 0 };
};

// Helper to extract single item from response
const extractItem = (response: any): Slot => {
  return response.data?.data ?? response.data;
};

export const slotsApi = {
  // Get all slots with filters
  getSlots: async (query: SlotQuery = {}) => {
    const params = new URLSearchParams();
    if (query.doctorId) params.append('doctorId', query.doctorId);
    if (query.dayOfWeek !== undefined) params.append('dayOfWeek', String(query.dayOfWeek));
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const response = await apiClient.get(
      `${API_ENDPOINTS.SLOTS}?${params.toString()}`
    );
    return extractList(response);
  },

  // Get single slot
  getSlot: async (id: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.SLOTS}/${id}`);
    return extractItem(response);
  },

  // Get doctors for dropdown
  getDoctors: async () => {
    const response = await apiClient.get(`${API_ENDPOINTS.SLOTS}/doctors`);
    return response.data?.data ?? response.data;
  },

  // Create slot
  createSlot: async (data: CreateSlotData) => {
    const response = await apiClient.post(API_ENDPOINTS.SLOTS, data);
    return extractItem(response);
  },

  // Update slot
  updateSlot: async (id: string, data: UpdateSlotData) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.SLOTS}/${id}`, data);
    return extractItem(response);
  },

  // Delete slot
  deleteSlot: async (id: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.SLOTS}/${id}`);
    return response.data;
  },

  // Bulk create slots
  bulkCreateSlots: async (data: BulkSlotData) => {
    const response = await apiClient.post(`${API_ENDPOINTS.SLOTS}/bulk`, data);
    return response.data?.data ?? response.data;
  },

  // Get available slots for a specific date (for booking)
  getAvailableSlots: async (date: string) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.SLOTS}/available?date=${date}`
    );
    return response.data?.data ?? response.data;
  },

  // Get available slots for patients (public endpoint)
  getPublicAvailableSlots: async (date: string, branchId: string) => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.SLOTS}/public/available?date=${date}&branchId=${branchId}`
    );
    return response.data?.data ?? response.data;
  },
};

// Day names helper
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
