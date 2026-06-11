import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ───────────────────────────────────────────────────
// Deployed backend on Render
const BASE_URL = 'http://192.168.1.3:5000/api';


const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s — allows Render free tier to cold-start (can take 20–50s)
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      }
    } catch (error) {
      console.warn('API Client: Failed to retrieve auth token:', error);
    }
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
    let errors = error.response?.data?.errors || [];
    if (errors && !Array.isArray(errors) && typeof errors === 'object') {
      errors = Object.entries(errors).map(([field, message]) => ({ field, message }));
    }

    const structuredError = {
      status: error.response?.status || 0,
      code: error.response?.data?.code || 'REQUEST_FAILED',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      errors,
      data: error.response?.data?.data || null,
    };

    return Promise.reject(structuredError);
  }
);

export default api;