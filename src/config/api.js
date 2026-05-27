import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL as ENV_API_URL } from '@env';

// Get API URL from environment variable
const API_URL = ENV_API_URL || 'https://backend.leats.in';

console.log('📡 API URL configured:', API_URL);

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Error getting token from AsyncStorage:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors and logging
api.interceptors.response.use(
  (response) => {
    // Success - no logging needed for production
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - Clear auth data
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['token', 'user', 'fcm_token']);
        console.log('🔓 Auth data cleared due to 401 error');
      } catch (e) {
        console.error('❌ Error clearing auth data:', e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
