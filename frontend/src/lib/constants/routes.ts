export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Patient
  PATIENT: {
    DASHBOARD: '/dashboard',
    APPOINTMENTS: '/appointments',
    BOOK: '/book',
    MEDICAL_HISTORY: '/medical-history',
    PROFILE: '/profile',
  },
  
  // Branch Manager
  MANAGER: {
    DASHBOARD: '/dashboard',
    APPOINTMENTS: '/appointments',
    DOCTORS: '/doctors',
    SCHEDULES: '/schedules',
    WALK_INS: '/walk-ins',
    SERVICES: '/services',
    ANALYTICS: '/analytics',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/dashboard',
    BRANCHES: '/branches',
    MANAGERS: '/managers',
    SERVICES: '/services',
    USERS: '/users',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
  },
};
