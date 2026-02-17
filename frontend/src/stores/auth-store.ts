import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import apiClient from '@/lib/api/axios-instance';
import { API_ENDPOINTS } from '@/lib/constants';

// Helper function to get redirect URL based on user role
const getRedirectUrl = (role: string): string => {
  switch (role) {
    case 'PATIENT':
      return '/dashboard';
    case 'BRANCH_MANAGER':
      return '/branch-manager/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<string>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  getRedirectPath: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
          const { accessToken, refreshToken, user } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Also set cookie for middleware SSR authentication
          document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Strict`;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Return redirect URL based on role
          return getRedirectUrl(user.role);
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed',
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Register the user
          await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
          
          // Auto-login after successful registration
          try {
            const loginResponse = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
              email: data.email,
              password: data.password,
            });
            
            const { accessToken, refreshToken, user } = loginResponse.data.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // Also set cookie for middleware SSR authentication
            document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Strict`;
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Return redirect URL based on role
            return getRedirectUrl(user.role);
          } catch (loginError: any) {
            // Registration succeeded but auto-login failed
            set({
              isLoading: false,
              error: 'Registration successful! Please log in manually.',
            });
            throw new Error('Registration successful! Please log in manually.');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Clear the authentication cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          
          // Ensure cookie is set for SSR
          document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`;
          
          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      getRedirectPath: () => {
        const { user } = get();
        return user ? getRedirectUrl(user.role) : '/';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
