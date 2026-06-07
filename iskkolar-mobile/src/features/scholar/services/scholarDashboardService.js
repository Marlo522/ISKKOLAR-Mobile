import axios from 'axios';
import Constants from 'expo-constants';

let sharedApi = null;

try {
  sharedApi = require('../../../services/api').default;
} catch {
  sharedApi = null;
}

let authTokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = typeof getter === 'function' ? getter : null;
};

const getAuthToken = async () => {
  if (authTokenGetter) {
    return authTokenGetter();
  }

  if (typeof globalThis?.getAuthToken === 'function') {
    return globalThis.getAuthToken();
  }

  if (globalThis?.auth && typeof globalThis.auth.getToken === 'function') {
    return globalThis.auth.getToken();
  }

  return null;
};

const getBaseUrl = () => {
  const configuredBaseUrl = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return 'http://192.168.1.2:5000/api';
};

const createFallbackClient = () => {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(async (config) => {
    const token = await getAuthToken();

    if (!token) {
      return config;
    }

    const authorization = String(token).startsWith('Bearer ') ? token : `Bearer ${token}`;

    return {
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: authorization,
      },
    };
  });

  return client;
};

const getClient = () => sharedApi || createFallbackClient();

const normalizeError = (error) => {
  const payload = error?.response?.data || error;
  return payload?.message || payload || error?.message || 'Failed to load scholar application history.';
};

/**
 * Load the current scholar application history for React Native screens.
 *
 * Example:
 * ```js
 * const [applicationItems, setApplicationItems] = useState([]);
 * const [loading, setLoading] = useState(true);
 * const [error, setError] = useState(null);
 *
 * useEffect(() => {
 *   let mounted = true;
 *
 *   const loadHistory = async () => {
 *     try {
 *       setLoading(true);
 *       const response = await getScholarApplicationHistory();
 *       if (mounted) {
 *         setApplicationItems(response?.data?.applicationItems || response?.applicationItems || []);
 *         setError(null);
 *       }
 *     } catch (err) {
 *       if (mounted) {
 *         setError(err?.message || 'Failed to load applications.');
 *       }
 *     } finally {
 *       if (mounted) setLoading(false);
 *     }
 *   };
 *
 *   loadHistory();
 *   return () => {
 *     mounted = false;
 *   };
 * }, []);
 * ```
 *
 * @returns {Promise<any>} The raw response payload from `GET /scholarships/dashboard/applications-history`.
 */
export const getScholarApplicationHistory = async () => {
  try {
    const client = getClient();
    const response = await client.get('/scholarships/dashboard/applications-history');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};
