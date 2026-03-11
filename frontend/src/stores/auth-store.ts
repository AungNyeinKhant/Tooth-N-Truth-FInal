import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthState, LoginCredentials, RegisterData } from "@/types";
import apiClient from "@/lib/api/axios-instance";
import { API_ENDPOINTS } from "@/lib/constants";

// Helper function to get redirect URL based on user role
const getRedirectUrl = (role: string): string => {
  switch (role) {
    case "PATIENT":
      return "/dashboard";

    case "BRANCH_MANAGER":
      return "/branch-manager/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/";
  }
};

// Helper to set access token cookies
const setAccessTokenCookie = (token: string) => {
  const isProduction = window.location.protocol === 'https:';
  document.cookie = `accessToken=${token}; path=/; max-age=900; SameSite=Lax${isProduction ? '; Secure' : ''}`;
};

// Helper to clear access token cookies
const clearAccessTokenCookie = () => {
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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

          // Store access token in localStorage
          localStorage.setItem("accessToken", accessToken);
          
          // Set cookie for middleware SSR authentication
          setAccessTokenCookie(accessToken);

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

          // Store access token in localStorage
          localStorage.setItem("accessToken", accessToken);
          
          // Set cookie for middleware SSR authentication
          setAccessTokenCookie(accessToken);

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
          // Call backend logout to clear HttpOnly refresh token cookie
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
          console.error("Logout error:", error);
        }

        localStorage.removeItem("accessToken");
        clearAccessTokenCookie();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        let token = localStorage.getItem("accessToken");
        console.log("[AuthStore] checkAuth - token in localStorage:", !!token);
        
        // If no access token, try to refresh using refresh token cookie
        if (!token) {
          console.log("[AuthStore] No access token, attempting to refresh...");
          try {
            const refreshResponse = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
            const { accessToken: newToken, user: newUser } = refreshResponse.data.data;
            
            console.log("[AuthStore] Token refresh successful!");
            
            // Store new access token
            localStorage.setItem("accessToken", newToken);
            setAccessTokenCookie(newToken);
            
            set({
              user: newUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          } catch (refreshError: any) {
            console.log("[AuthStore] Token refresh failed:", refreshError.message);
            
            // Refresh failed - call backend logout to clear any stale cookies
            try {
              await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
            } catch (logoutError) {
              console.log("[AuthStore] Backend logout called");
            }
            
            clearAccessTokenCookie();
            set({ isAuthenticated: false, user: null, isLoading: false });
            return;
          }
        }

        set({ isLoading: true });
        try {
          console.log("[AuthStore] checkAuth - calling /api/auth/me");
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          console.log("[AuthStore] checkAuth - success:", response.data.data);

          // Ensure cookie is set for SSR
          setAccessTokenCookie(token);

          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error("[AuthStore] checkAuth - error:", error.message);
          
          // Token might be invalid - try to refresh
          if (error.response?.status === 401) {
            console.log("[AuthStore] 401 error, trying to refresh...");
            try {
              const refreshResponse = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
              const { accessToken: newToken, user: newUser } = refreshResponse.data.data;
              
              localStorage.setItem("accessToken", newToken);
              setAccessTokenCookie(newToken);
              
              set({
                user: newUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return;
            } catch (refreshError) {
              console.log("[AuthStore] Refresh failed, logging out...");
            }
          }
          
          // If all else fails, clear everything and call backend logout
          localStorage.removeItem("accessToken");
          clearAccessTokenCookie();
          
          try {
            await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
          } catch (logoutError) {}
          
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
