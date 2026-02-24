export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  BRANCHES: '/api/branches',
  SERVICES: '/api/services',
  DOCTORS: '/api/doctors',
  USERS: '/api/users',
  APPOINTMENTS: '/api/appointments',
  PATIENTS: '/api/patients',
  ANALYTICS: '/api/analytics',
  SLOTS: '/api/slots',
  WALKINS: '/api/walkins',
};
