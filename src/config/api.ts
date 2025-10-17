// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
