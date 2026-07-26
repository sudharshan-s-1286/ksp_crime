import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds (some multi-agent pipelines can take time)
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ksp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic for transient errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;
    
    // Check if we should retry this request
    if (!config || !config.retryCount === undefined) {
      config.retryCount = 0;
    }
    
    const MAX_RETRIES = 3;
    const isTransientError = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (isTransientError && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;
      const backoffDelay = Math.pow(2, config.retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
      
      console.warn(`Request failed (${error.message}). Retrying in ${backoffDelay}ms... (Attempt ${config.retryCount} of ${MAX_RETRIES})`);
      
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return apiClient(config);
    }

    // Format the error message gracefully for UI consumption
    const errorMessage = 
      (error.response?.data as any)?.error_message || 
      (error.response?.data as any)?.detail || 
      error.message || 
      'An unexpected network error occurred.';
      
    return Promise.reject(new Error(errorMessage));
  }
);
