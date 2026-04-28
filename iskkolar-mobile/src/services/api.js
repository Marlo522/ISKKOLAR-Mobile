import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ───────────────────────────────────────────────────
// Change this to your machine's LAN IP when testing on a real device
// Android emulator: use 10.0.2.2 instead of localhost
const expoHost = Constants.expoConfig?.hostUri?.split(':')?.[0];
const BASE_URL = __DEV__
  ? `http://${expoHost || '192.168.1.5'}:5000/api`
  : 'https://your-production-url.com/api'; // MUST be HTTPS in prod

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for HTTPOnly cookies
  timeout: 15000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Note: No manual token handling here. Cookies are handled by the OS.
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    
    // Define auth-related requests that shouldn't trigger global logout on 401
    const isAuthRequest = 
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/resend-verification');

    if (status === 401 && !isAuthRequest) {
      // Clear local user data
      await AsyncStorage.removeItem('user');
      
      // In React Native, we can't use window.location.href.
      // We rely on the AuthContext or a navigation event to handle the UI shift.
      // For now, we can throw a specific error that the UI can catch, 
      // or use a custom event emitter if one is available.
    }
    
    // Map axios error to the expected format for the rest of the app
    const structuredError = {
      status: error.response?.status || 0,
      code: error.response?.data?.code || 'REQUEST_FAILED',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      errors: error.response?.data?.errors || [],
      data: error.response?.data?.data || null,
    };

    return Promise.reject(structuredError);
  }
);

export default api;

