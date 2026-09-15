import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token and Correlation ID
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Distributed Tracing Correlation ID
    if (!config.headers['X-Correlation-Id']) {
      config.headers['X-Correlation-Id'] = crypto.randomUUID
        ? crypto.randomUUID()
        : 'corr-' + Math.random().toString(36).substring(2, 11);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and 429 Rate Limiting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      useAuthStore.getState().logout();
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded (Redis Token Bucket active).');
    }
    return Promise.reject(error);
  }
);
