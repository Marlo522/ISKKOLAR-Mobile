import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ─── CONFIG ───────────────────────────────────────────────────
// Change this to your machine's LAN IP when testing on a real device
// Android emulator: use 10.0.2.2 instead of localhost
// iOS simulator: localhost works fine
const expoHost = Constants.expoConfig?.hostUri?.split(':')?.[0];
const BASE_URL = __DEV__
  ? `http://${expoHost || '192.168.1.3'}:5000/api`
  : 'https://your-production-url.com/api';

// ─── CORE FETCH WRAPPER ───────────────────────────────────────
const api = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('token');
  const isAuthEndpoint =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/signup') ||
    endpoint.startsWith('/auth/forgot-password') ||
    endpoint.startsWith('/auth/reset-password');

  const isFormData = options.body instanceof FormData;

  const headers = {
    // Don't set Content-Type for FormData — fetch sets it automatically with boundary
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && !isAuthEndpoint ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Throw the full backend error shape so callers can read .errors, .code, .message
      throw { status: response.status, ...data };
    }

    return data;
  } catch (err) {
    // Re-throw structured errors as-is; wrap network errors
    if (err.status) throw err;
    throw { status: 0, message: 'Network error. Check your connection.' };
  }
};

export default api;
