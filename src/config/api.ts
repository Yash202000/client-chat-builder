// API Configuration
// Prioritize runtime config (window._env_) for Docker deployments, fallback to build-time env for local dev
const getBackendUrl = (): string => {
  if (typeof window !== 'undefined' && window._env_?.VITE_BACKEND_URL) {
    return window._env_.VITE_BACKEND_URL;
  }
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getBackendUrl();

// Get WebSocket URL based on API base URL
export const getWebSocketUrl = (): string => {
  const apiUrl = new URL(API_BASE_URL);
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${apiUrl.host}`;
};

// Get HTTP API URL
export const getApiUrl = (): string => {
  return API_BASE_URL;
};
