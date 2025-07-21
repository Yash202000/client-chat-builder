import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  companyId: string | null;
  login: (token: string, companyId: number) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [companyId, setCompanyId] = useState<string | null>(localStorage.getItem('companyId'));
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedCompanyId = localStorage.getItem('companyId');
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedCompanyId) {
      setCompanyId(storedCompanyId);
    }
  }, []);

  const login = (newToken: string, newCompanyId: number) => {
    setToken(newToken);
    setCompanyId(newCompanyId.toString());
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('companyId', newCompanyId.toString());
  };

  const logout = () => {
    setToken(null);
    setCompanyId(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('companyId');
    navigate('/login');
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    return response;
  };

  const value = {
    isAuthenticated: !!token,
    token,
    companyId,
    login,
    logout,
    authFetch,
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
