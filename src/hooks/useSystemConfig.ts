import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface SystemConfig {
  managed_credentials: boolean;
  credentials_editable: boolean;
  deployment_mode: string;
}

/**
 * Hook to fetch system configuration
 * Returns deployment mode and credential management settings
 */
export const useSystemConfig = () => {
  const { authFetch } = useAuth();

  return useQuery<SystemConfig>({
    queryKey: ['systemConfig'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/system/config');
      if (!response.ok) {
        throw new Error('Failed to fetch system configuration');
      }
      return response.json();
    },
    staleTime: Infinity, // System config doesn't change during session
    retry: 1, // Only retry once on failure
  });
};
