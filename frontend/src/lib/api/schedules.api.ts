import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// Types
export interface Schedule {
  id: string;
  doctorId: string;
  branchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  isActive: boolean;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface CreateScheduleData {
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  bufferTime?: number;
  isActive?: boolean;
}

export interface UpdateScheduleData {
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  bufferTime?: number;
  isActive?: boolean;
}

export interface BulkScheduleData {
  doctorId: string;
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration?: number;
  bufferTime?: number;
  isActive?: boolean;
}

export interface ScheduleQuery {
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
const extractList = (response: any): { items: Schedule[]; total: number } => {
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
const extractItem = (response: any): Schedule => {
  return response.data?.data ?? response.data;
};

export const schedulesApi = {
  // Get all schedules with filters
  getSchedules: async (query: ScheduleQuery = {}) => {
    const params = new URLSearchParams();
    if (query.doctorId) params.append('doctorId', query.doctorId);
    if (query.dayOfWeek !== undefined) params.append('dayOfWeek', String(query.dayOfWeek));
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const response = await apiClient.get(
      `${API_ENDPOINTS.SCHEDULES}?${params.toString()}`
    );
    return extractList(response);
  },

  // Get single schedule
  getSchedule: async (id: string) => {
    const response = await apiClient.get(`${API_ENDPOINTS.SCHEDULES}/${id}`);
    return extractItem(response);
  },

  // Get doctors for dropdown
  getDoctors: async () => {
    const response = await apiClient.get(`${API_ENDPOINTS.SCHEDULES}/doctors`);
    return response.data?.data ?? response.data;
  },

  // Create schedule
  createSchedule: async (data: CreateScheduleData) => {
    const response = await apiClient.post(API_ENDPOINTS.SCHEDULES, data);
    return extractItem(response);
  },

  // Update schedule
  updateSchedule: async (id: string, data: UpdateScheduleData) => {
    const response = await apiClient.patch(`${API_ENDPOINTS.SCHEDULES}/${id}`, data);
    return extractItem(response);
  },

  // Delete schedule
  deleteSchedule: async (id: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.SCHEDULES}/${id}`);
    return response.data;
  },

  // Bulk create schedules
  bulkCreateSchedules: async (data: BulkScheduleData) => {
    const response = await apiClient.post(`${API_ENDPOINTS.SCHEDULES}/bulk`, data);
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
