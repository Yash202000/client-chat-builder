import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { getApiUrl } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  companyId: number | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  setCompanyIdGlobaly: (companyId: number | null) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    return storedCompanyId ? parseInt(storedCompanyId, 10) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
    };

    // Let the browser set the Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(getApiUrl(url), { ...options, headers });

    if (response.status === 401) {
      setToken(null);
      setUser(null);
      setCompanyId(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('companyId');
      navigate('/login');
      throw new Error('Unauthorized');
    }

    return response;
  }, [navigate]);

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
        console.error("Failed to fetch user", error);
        setToken(null);
        setUser(null);
        setCompanyId(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('companyId');
      }
    }
    setIsLoading(false);
  }, [authFetch]);

  useEffect(() => {
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  // Session validation on page visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && token && user) {
        try {
          // Validate the session is still active when user returns to the page
          const response = await authFetch('/api/v1/users/me');
          if (!response.ok) {
            console.warn('Session validation failed on visibility change');
          }
        } catch (error) {
          console.error('Failed to validate session on visibility change:', error);
          // authFetch will handle 401 errors and redirect to login
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user, authFetch]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('accessToken', newToken);
    setIsLoading(true);
    fetchAndSetUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCompanyId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('companyId');
    navigate('/login');
  };

  const setCompanyIdGlobaly = (companyId: number | null) => {
    if (companyId) {
      setCompanyId(companyId);
      localStorage.setItem('companyId', companyId.toString());
    } else {
      localStorage.removeItem('companyId');
    }
    // window.location.reload();
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
    refetchUser: fetchAndSetUser
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
