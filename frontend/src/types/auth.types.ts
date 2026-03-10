export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'BRANCH_MANAGER' | 'ADMIN';
  isActive: boolean;
  profileImage?: string;
  googleId?: string | null;
  googleEmail?: string | null;
  createdAt: string;
  branchId?: string;
  branchManager?: {
    branchId: string;
    branch: {
      name: string;
    };
  };
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  user?: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
}
