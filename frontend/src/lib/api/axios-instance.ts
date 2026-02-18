import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

console.log('[Axios] API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows cookies to be sent/received
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('[Axios] Request to:', config.url, '- Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[Axios] Response from:', response.config.url, '- Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('[Axios] Response error:', error.config?.url, '- Status:', error.response?.status, '- Message:', error.message);
    
    const originalRequest = error.config;

    // Handle token refresh on 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Axios] 401 error, attempting token refresh...');
      originalRequest._retry = true;
      
      try {
        // Refresh token is now in HttpOnly cookie, no need to send in body
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {}, // Empty body - refresh token is sent via cookie
          { withCredentials: true } // Important: Send cookies with refresh request
        );
        
        console.log('[Axios] Token refresh successful');
        const { accessToken } = response.data.data;
        
        // Store new token in localStorage
        localStorage.setItem('accessToken', accessToken);
        
        // Also update the cookie for middleware SSR authentication
        // max-age=900 (15 min) matches JWT_ACCESS_EXPIRATION
        const isProduction = window.location.protocol === 'https:';
        document.cookie = `accessToken=${accessToken}; path=/; max-age=900; SameSite=Lax${isProduction ? '; Secure' : ''}`;
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[Axios] Token refresh failed:', refreshError);
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        // Clear the accessToken cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
