// API client utility
import { BACKEND_URL } from '@/config/env';

/**
 * Helper function to construct full API URLs
 * @param path - API endpoint path (e.g., '/api/v1/auth/login')
 * @returns Full URL with backend host
 */
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Remove trailing slash from backend URL if present
  const cleanBackendUrl = BACKEND_URL.endsWith('/')
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;

  return `${cleanBackendUrl}/${cleanPath}`;
};

/**
 * Wrapper around fetch that automatically uses the backend URL
 * @param path - API endpoint path
 * @param options - Fetch options
 * @returns Fetch promise
 */
export const apiFetch = (path: string, options?: RequestInit): Promise<Response> => {
  return fetch(getApiUrl(path), options);
};
