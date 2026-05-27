import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL as ENV_API_URL } from '@env';

// Get API URL from environment variable
const API_URL = ENV_API_URL || 'https://backend.leats.in';

console.log('📡 API URL configured:', API_URL);

/**
 * Axios Instance - Centralized HTTP client for all API calls
 * Matches frontend lib/axios.ts pattern for consistency
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout (matches frontend)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * - Adds Authorization token to all requests
 * - Logs requests in development
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Error getting token from AsyncStorage:', error);
    }

    // Development logging
    if (__DEV__) {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles 401 Unauthorized errors (clears auth data)
 * - Handles network errors
 * - Logs responses in development
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Development logging
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Clear auth data
    if (error.response?.status === 401) {
      try {
        // Don't clear during logout process
        const isLogoutRequest = originalRequest?.url?.includes('/logout');
        
        if (!isLogoutRequest) {
          await AsyncStorage.multiRemove(['token', 'user', 'fcm_token']);
          console.log('🔓 Auth data cleared due to 401 error');
        }
      } catch (e) {
        console.error('❌ Error clearing auth data:', e);
      }
    }

    // Development logging for errors
    if (__DEV__) {
      console.log(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_URL };