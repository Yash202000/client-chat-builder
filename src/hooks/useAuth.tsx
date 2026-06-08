import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { getApiUrl } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  companyId: number | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setCompanyIdGlobaly: (companyId: number | null) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_REFRESH_BEFORE_EXPIRY_MS = 60 * 60 * 1000; // refresh 1 hour before expiry

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    return storedCompanyId ? parseInt(storedCompanyId, 10) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setCompanyId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('companyId');
  }, []);

  // Attempt to refresh the token silently. Returns the new token or null on failure.
  const attemptTokenRefresh = useCallback(async (): Promise<string | null> => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) return null;
    try {
      const response = await fetch(getApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        localStorage.setItem('accessToken', data.access_token);
        return data.access_token;
      }
    } catch {
      // network error — leave token as-is, will fail on next real request
    }
    return null;
  }, []);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}, isRetry = false): Promise<Response> => {
    const currentToken = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
    };

    // Let the browser set the Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Super admin company context override
    const storedCompanyId = localStorage.getItem('companyId');
    if (storedCompanyId) {
      headers['X-Company-ID'] = storedCompanyId;
    }

    const response = await fetch(getApiUrl(url), { ...options, headers });

    if (response.status === 401 && !isRetry) {
      // Try to refresh once before giving up
      const newToken = await attemptTokenRefresh();
      if (newToken) {
        return authFetch(url, options, true);
      }
      clearAuth();
      navigate('/login');
      throw new Error('Unauthorized');
    }

    // Handle license errors (403 with error_type: "license_error")
    if (response.status === 403) {
      try {
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        if (errorData.error_type === 'license_error') {
          sessionStorage.setItem('licenseError', JSON.stringify({
            status: errorData.license_status,
            message: errorData.detail,
            contact: errorData.contact,
          }));
          navigate('/license-error');
          throw new Error('License error');
        }
      } catch (e) {
        if ((e as Error).message === 'License error') throw e;
      }
    }

    return response;
  }, [navigate, attemptTokenRefresh, clearAuth]);

  const fetchAndSetUser = useCallback(async () => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      try {
        const response = await authFetch('/api/v1/users/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (userData.company_id) {
            setCompanyId(userData.company_id);
            localStorage.setItem('companyId', userData.company_id.toString());
          }
        } else {
          throw new Error('Invalid token');
        }
      } catch (error) {
        if ((error as Error).message === 'License error') {
          setIsLoading(false);
          return;
        }
        console.error("Failed to fetch user", error);
        clearAuth();
      }
    }
    setIsLoading(false);
  }, [authFetch, clearAuth]);

  useEffect(() => {
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  // Proactive token refresh: schedule a refresh 1 hour before expiry
  useEffect(() => {
    if (!token) return;

    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const refreshAt = expiry - TOKEN_REFRESH_BEFORE_EXPIRY_MS;
    const delay = refreshAt - Date.now();

    if (delay <= 0) {
      // Token already past refresh window — try immediately
      attemptTokenRefresh();
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      attemptTokenRefresh();
    }, delay);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [token, attemptTokenRefresh]);

  // Re-validate session when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && token && user) {
        try {
          await authFetch('/api/v1/users/me');
        } catch (error) {
          console.error('Failed to validate session on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, user, authFetch]);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('accessToken', newToken);
    setIsLoading(true);
    await fetchAndSetUser();
  };

  const logout = () => {
    clearAuth();
    queryClient.clear(); // wipe all cached data so next user gets fresh state
    navigate('/login');
  };

  const setCompanyIdGlobaly = (companyId: number | null) => {
    if (companyId) {
      setCompanyId(companyId);
      localStorage.setItem('companyId', companyId.toString());
    } else {
      localStorage.removeItem('companyId');
    }
  };

  const value = {
    isAuthenticated: !!token && !!user,
    token,
    user,
    companyId,
    isLoading,
    login,
    logout,
    authFetch,
    setCompanyIdGlobaly,
    refetchUser: fetchAndSetUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
