
import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';

const BrandingContext = createContext(null);

export const BrandingProvider = ({ children }) => {
  const { companyId, authFetch } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ['companySettings', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/company-settings/`);
      if (!response.ok) {
        throw new Error('Failed to fetch company settings');
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      if (settings.primary_color) {
        root.style.setProperty('--primary-color', settings.primary_color);
      }
      if (settings.secondary_color) {
        root.style.setProperty('--secondary-color', settings.secondary_color);
      }
      if (settings.logo_url) {
        // You can use this URL in your components
      }
    }
  }, [settings]);

  return (
    <BrandingContext.Provider value={null}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  return useContext(BrandingContext);
};
