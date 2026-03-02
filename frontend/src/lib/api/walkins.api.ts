import apiClient from '@/lib/api/axios-instance';
import { API_ENDPOINTS } from '@/lib/constants/api';

const PATIENTS_ENDPOINT = '/api/patients';

// ==================== Types ====================

export type WalkInStatus = 'WAITING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WalkInPatient {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

export interface WalkInDoctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

export interface WalkInService {
  id: string;
  name: string;
  duration: number;
  price?: string | number;
}

export interface WalkInBranch {
  id: string;
  name: string;
}

export interface WalkIn {
  id: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes: string | null;
  cancelReason: string | null;
  isWalkIn: boolean;
  tokenNumber: string | null;
  checkInTime: string | null;
  createdAt: string;
  updatedAt: string;
  patient: WalkInPatient;
  doctor: WalkInDoctor;
  service: WalkInService;
  branch?: WalkInBranch;
  waitTime: number;
  displayStatus: WalkInStatus;
}

export interface CreateWalkInRequest {
  date: string; // YYYY-MM-DD format
  patientId?: string; // For returning patients
  firstName?: string; // For new patients
  lastName?: string; // For new patients
  phone?: string; // For new patients
  reason?: string;
  doctorId: string; // Required
  slotId?: string; // Optional - if provided, uses slot's time
  serviceId?: string;
}

// Patient search result
export interface PatientSearchResult {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

export interface UpdateWalkInStatusRequest {
  status: WalkInStatus;
  doctorId?: string;
  cancelReason?: string;
  notes?: string;
}

export interface ConvertToAppointmentRequest {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
}

export interface QueryWalkInsParams {
  status?: WalkInStatus;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WalkInsListResponse {
  data: WalkIn[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== API Functions ====================

/**
 * Create a new walk-in patient
 */
export async function createWalkIn(data: CreateWalkInRequest): Promise<WalkIn> {
  const response = await apiClient.post(API_ENDPOINTS.WALKINS, data);
  return response.data.data;
}

/**
 * Get walk-in queue for branch
 */
export async function getWalkInQueue(params?: QueryWalkInsParams): Promise<WalkInsListResponse> {
  const response = await apiClient.get(`${API_ENDPOINTS.WALKINS}/queue`, { params });
  const payload = (response.data as any)?.data;
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
  };
}

/**
 * Get single walk-in details
 */
export async function getWalkIn(id: string): Promise<WalkIn> {
  const response = await apiClient.get(`${API_ENDPOINTS.WALKINS}/${id}`);
  return response.data.data;
}

/**
 * Update walk-in status
 */
export async function updateWalkInStatus(
  id: string,
  data: UpdateWalkInStatusRequest
): Promise<WalkIn> {
  const response = await apiClient.patch(`${API_ENDPOINTS.WALKINS}/${id}/status`, data);
  return response.data.data;
}

/**
 * Convert walk-in to scheduled appointment
 */
export async function convertWalkInToAppointment(
  id: string,
  data: ConvertToAppointmentRequest
): Promise<WalkIn & { message: string }> {
  const response = await apiClient.post(`${API_ENDPOINTS.WALKINS}/${id}/convert`, data);
  return response.data.data;
}

/**
 * Search patients by phone number
 */
export async function searchPatientsByPhone(phone: string): Promise<PatientSearchResult[] | null> {
  if (!phone || phone.trim().length < 3) {
    return null;
  }
  try {
    const response = await apiClient.get(`${PATIENTS_ENDPOINT}/search?phone=${encodeURIComponent(phone.trim())}`);
    return response.data.data;
  } catch (error) {
    console.error('Error searching patients:', error);
    return null;
  }
}

// ==================== Helper Functions ====================

/**
 * Format wait time for display
 */
export function formatWaitTime(minutes: number): string {
  if (minutes < 1) return 'Just arrived';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Get wait time color class
 * Green: <15 min, Yellow: 15-30 min, Red: >30 min
 */
export function getWaitTimeColor(minutes: number): string {
  if (minutes < 15) return 'text-green-600 bg-green-100';
  if (minutes <= 30) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

/**
 * Get status badge color class
 */
export function getStatusColor(status: WalkInStatus): string {
  switch (status) {
    case 'WAITING':
      return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800';
    case 'IN_PROGRESS':
      return 'bg-orange-100 text-orange-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
