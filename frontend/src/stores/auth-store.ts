import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthState, LoginCredentials, RegisterData } from "@/types";
import apiClient from "@/lib/api/axios-instance";
import { API_ENDPOINTS } from "@/lib/constants";

// Helper function to get redirect URL based on user role
const getRedirectUrl = (role: string): string => {
  switch (role) {
    case "PATIENT":
      return "/";

    case "BRANCH_MANAGER":
      return "/branch-manager/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/";
  }
};

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<string>;
  register: (data: RegisterData) => Promise<string>;

  logout: () => Promise<void>;

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
          const response = await apiClient.post(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials,
          );
          const { accessToken, user } = response.data.data;

          // Store only access token in localStorage
          // Refresh token is now in HttpOnly cookie (handled by backend)
          localStorage.setItem("accessToken", accessToken);

          // Also set cookie for middleware SSR authentication
          document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

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
            error: error.response?.data?.message || "Login failed",
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Register the user (auto-login happens on backend)
          const response = await apiClient.post(
            API_ENDPOINTS.AUTH.REGISTER,
            data,
          );
          const { accessToken, user } = response.data.data;

          // Store only access token in localStorage
          // Refresh token is now in HttpOnly cookie (handled by backend)
          localStorage.setItem("accessToken", accessToken);

          // Also set cookie for middleware SSR authentication
          document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;

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
            error: error.response?.data?.message || "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call backend logout to clear HttpOnly cookie
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          // Even if backend fails, proceed with client-side logout
          console.error("Logout error:", error);
        }

        localStorage.removeItem("accessToken");

        // Clear the authentication cookie
        document.cookie =
          "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("accessToken");
        console.log("[AuthStore] checkAuth - token exists:", !!token);
        
        if (!token) {
          console.log("[AuthStore] checkAuth - no token, setting unauthenticated");
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          console.log("[AuthStore] checkAuth - calling /api/auth/me");
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          console.log("[AuthStore] checkAuth - success:", response.data.data);

          // Ensure cookie is set for SSR
          document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax`;

          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("[AuthStore] checkAuth - error:", error.message);
          localStorage.removeItem("accessToken");
          document.cookie =
            "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
        return user ? getRedirectUrl(user.role) : "/";
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
