// Runtime environment configuration helper
// This file provides access to environment variables that can be configured at runtime

declare global {
  interface Window {
    _env_?: {
      VITE_BACKEND_URL: string;
      VITE_LIVEKIT_URL: string;
      VITE_VOICE_ENGINE_URL?: string;
    };
  }
}

// Helper function to get environment variables from runtime config or fallback to build-time env
export const getEnv = (key: 'VITE_BACKEND_URL' | 'VITE_LIVEKIT_URL' | 'VITE_VOICE_ENGINE_URL'): string => {
  // Try runtime config first (set by env-config.js)
  if (window._env_ && window._env_[key]) {
    return window._env_[key];
  }

  // Fallback to build-time environment variable (for local development)
  return import.meta.env[key] || '';
};

// Export configured URLs
export const BACKEND_URL = getEnv('VITE_BACKEND_URL');
export const LIVEKIT_URL = getEnv('VITE_LIVEKIT_URL');
export const VOICE_ENGINE_URL = getEnv('VITE_VOICE_ENGINE_URL') || BACKEND_URL;
