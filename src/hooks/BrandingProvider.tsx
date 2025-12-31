
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';

interface BrandingContextType {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  companyName: string;
  isLoading: boolean;
}

const defaultBranding: BrandingContextType = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  logoUrl: null,
  companyName: 'AgentConnect',
  isLoading: true,
};

const BrandingContext = createContext<BrandingContextType>(defaultBranding);

export const BrandingProvider = ({ children }) => {
  const { companyId, authFetch } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['companySettings', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/company-settings/`);
      if (!response.ok) {
        throw new Error('Failed to fetch company settings');
      }
      return response.json();
    },
    enabled: !!companyId,
    retry: 2,
    // Don't throw errors to the ErrorBoundary, just log them
    throwOnError: false,
    // Use default settings if the query fails
    placeholderData: null,
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
    }
  }, [settings]);

  const brandingValue = useMemo<BrandingContextType>(() => ({
    primaryColor: settings?.primary_color || defaultBranding.primaryColor,
    secondaryColor: settings?.secondary_color || defaultBranding.secondaryColor,
    logoUrl: settings?.logo_url || null,
    companyName: settings?.company_name || defaultBranding.companyName,
    isLoading,
  }), [settings, isLoading]);

  return (
    <BrandingContext.Provider value={brandingValue}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  return useContext(BrandingContext);
};
