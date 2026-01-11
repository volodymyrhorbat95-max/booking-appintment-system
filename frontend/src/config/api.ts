import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ENV } from './env';

// ============================================
// AXIOS API CONFIGURATION
// Section 12.1: Speed - Request timeout and retry logic
// ============================================

// API URL from validated environment configuration (RULE: no hardcoded values)
const API_URL = ENV.apiUrl;

// ============================================
// CONFIGURATION CONSTANTS
// ============================================
const REQUEST_TIMEOUT = 30000; // 30 seconds (matches backend timeout)
const MAX_RETRIES = 3; // Maximum number of retries
const RETRY_DELAY_BASE = 1000; // Base delay for exponential backoff (1 second)

// Extend AxiosRequestConfig to include retry count
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

// ============================================
// CREATE AXIOS INSTANCE WITH OPTIMIZED SETTINGS
// ============================================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  // Request timeout (Section 12.1 - Speed)
  timeout: REQUEST_TIMEOUT
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking (useful for debugging)
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR WITH RETRY LOGIC
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosRequestConfig;

    // Don't retry if no config or if it's an aborted request
    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config._retryCount = config._retryCount || 0;

    // Handle 401 unauthorized - clear token (no retry)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Navigation will be handled by Redux
      return Promise.reject(error);
    }

    // Don't retry for client errors (4xx) except timeout and network errors
    const shouldRetry =
      // Network errors (no response)
      !error.response ||
      // Request timeout
      error.code === 'ECONNABORTED' ||
      // Server errors (5xx) - transient errors
      (error.response?.status && error.response.status >= 500) ||
      // Too many requests (429) - rate limited
      error.response?.status === 429;

    // Check if we should retry
    if (shouldRetry && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;

      // Calculate delay with exponential backoff
      // 1st retry: 1s, 2nd retry: 2s, 3rd retry: 4s
      const delay = RETRY_DELAY_BASE * Math.pow(2, config._retryCount - 1);

      // If rate limited (429), use Retry-After header if available
      const retryAfter = error.response?.headers?.['retry-after'];
      const actualDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

      // Log retry attempt in development
      if (import.meta.env.DEV) {
        console.log(
          `API retry attempt ${config._retryCount}/${MAX_RETRIES} after ${actualDelay}ms`,
          config.url
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, actualDelay));

      // Retry the request
      return api(config);
    }

    // If all retries exhausted, reject with enhanced error
    return Promise.reject(error);
  }
);

// ============================================
// HELPER FUNCTIONS FOR API CALLS
// ============================================

/**
 * Make a request with a custom timeout
 * Useful for long-running operations like file uploads
 */
export const apiWithTimeout = (timeoutMs: number) => {
  return axios.create({
    ...api.defaults,
    timeout: timeoutMs
  });
};

/**
 * Make a request without retry logic
 * Useful for non-idempotent operations like payments
 */
export const apiNoRetry = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: REQUEST_TIMEOUT
});

// Add auth interceptor to apiNoRetry
apiNoRetry.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiNoRetry.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
