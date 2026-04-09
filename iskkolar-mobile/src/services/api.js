import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─── CONFIG ───────────────────────────────────────────────────
// Change this to your machine's LAN IP when testing on a real device
// Android emulator: use 10.0.2.2 instead of localhost
// iOS simulator: localhost works fine
const expoHost = Constants.expoConfig?.hostUri?.split(':')?.[0];
const BASE_URL = __DEV__
  ? `http://${expoHost || '192.168.1.6'}:5000/api`
  : 'https://your-production-url.com/api'; // MUST be HTTPS in prod

// Critical Production Security Constraint
if (!__DEV__ && !BASE_URL.startsWith('https://')) {
  console.warn("⚠️ SECURITY WARNING: You are attempting to make a production request over insecure HTTP.");
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2; // For safe methods (GET)

// Recursive network request wrapper with Retry & Timeout functionality
const executeWithRetry = async (url, config, retriesLeft = MAX_RETRIES) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), config.timeout || DEFAULT_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });
    // Request finished before timeout, clear the abort trigger
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    
    const isNetworkError = error.name === 'AbortError' || error.message.includes('Network request failed');
    
    // Only safely retry GET requests to prevent things like double-charges or duplicate database rows
    const isSafeMethod = !config.method || config.method.toUpperCase() === 'GET';
    
    // Exponential backoff logic
    if (isNetworkError && isSafeMethod && retriesLeft > 0) {
      const waitMs = (MAX_RETRIES - retriesLeft + 1) * 1000;
      await new Promise(res => setTimeout(res, waitMs));
      return executeWithRetry(url, config, retriesLeft - 1);
    }
    throw error;
  }
};

// ─── CORE FETCH WRAPPER ───────────────────────────────────────
const api = async (endpoint, options = {}) => {
  // 1. JWT Storage - SecureStore uses encrypted keychain/keystore.
  const token = await SecureStore.getItemAsync('secure_token');
  
  const isAuthEndpoint =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/signup') ||
    endpoint.startsWith('/auth/forgot-password') ||
    endpoint.startsWith('/auth/reset-password');

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && !isAuthEndpoint ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await executeWithRetry(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // 2. Intercept Refresh Tokens Here (Future Validation Feature)
      if (response.status === 401 && !isAuthEndpoint) {
        // TODO: Integrate silent asynchronous fetch to /auth/refresh here.
        // If a new secure_token is provided, await SecureStore.setItemAsync() and recursively call executeWithRetry()
      }

      // 3. Sanitized error block. Prevents passing unhandled strings. 
      // Always shapes the error cleanly so UI hooks uniformly extract .message securely 
      throw { 
        status: response.status, 
        code: data?.code || "REQUEST_FAILED",
        message: data?.message || "An unexpected error occurred processing your request.",
        errors: data?.errors || [],
        data: data?.data || null
      };
    }

    return data;
  } catch (err) {
    // Evaluate aborted/timed-out requests
    if (err.name === 'AbortError') {
      throw { status: 408, message: 'Request timed out. Please check your connection and try again.' };
    }
    // Re-throw previously structured backend errors cleanly
    if (err.status) throw err;
    
    // Fallback wrapper for absolute network dropouts
    throw { status: 0, message: 'Network error. Please ensure you are connected to the internet.' };
  }
};

export default api;
