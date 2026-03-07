import apiClient from './axios-instance';
import { API_ENDPOINTS } from '../constants';

// Types
export interface PatientProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  googleCalendarConnected: boolean;
  calendarSyncEnabled: boolean;
  lastCalendarSyncAt?: string;
}

export interface PatientStats {
  upcomingCount: number;
  pastVisitsCount: number;
  nextAppointment: {
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    doctorName: string;
    serviceName: string;
    branchName: string;
  } | null;
}

export interface PatientAppointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  doctorName: string;
  serviceName: string;
  branchName: string;
}

export interface PaginatedAppointments {
  data: PatientAppointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// API Functions

/**
 * Get current patient's profile
 */
export async function getMyProfile(): Promise<PatientProfile> {
  const response = await apiClient.get(`${API_ENDPOINTS.PATIENTS}/me`);
  return response.data.data;
}

/**
 * Update current patient's profile
 */
export async function updateMyProfile(data: Partial<PatientProfile>): Promise<{ message: string }> {
  const response = await apiClient.patch(`${API_ENDPOINTS.PATIENTS}/me`, data);
  return response.data.data;
}

/**
 * Get patient dashboard stats
 */
export async function getMyStats(): Promise<PatientStats> {
  const response = await apiClient.get(`${API_ENDPOINTS.PATIENTS}/me/stats`);
  return response.data.data;
}

/**
 * Get upcoming appointments
 */
export async function getMyUpcomingAppointments(limit: number = 5): Promise<PatientAppointment[]> {
  const response = await apiClient.get(`${API_ENDPOINTS.PATIENTS}/me/appointments/upcoming`, {
    params: { limit },
  });
  return response.data.data;
}

/**
 * Get past appointments (paginated)
 */
export async function getMyPastAppointments(
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedAppointments> {
  const response = await apiClient.get(`${API_ENDPOINTS.PATIENTS}/me/appointments/past`, {
    params: { page, limit },
  });
  return response.data.data;
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/api/upload/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

/**
 * Delete profile image
 */
export async function deleteProfileImage(): Promise<{ message: string }> {
  const response = await apiClient.delete('/api/upload/profile-image');
  return response.data.data;
}
