import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export const LinkedInCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state') ?? '';

      if (!code) return;

      // Social Accounts flow — state starts with "social:"
      if (state.startsWith('social:')) {
        try {
          const response = await authFetch('/api/v1/social/auth/linkedin/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            toast({ title: 'LinkedIn connected!', description: 'Your account has been linked.' });
            queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
            navigate('/dashboard/social/accounts?connected=linkedin');
          } else {
            toast({ title: 'Error', description: 'Failed to connect LinkedIn account.', variant: 'destructive' });
            navigate('/dashboard/social/accounts');
          }
        } catch {
          toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
          navigate('/dashboard/social/accounts');
        }
        return;
      }

      // Legacy integration flow — opens in popup
      try {
        const response = await authFetch('/api/v1/proxy/linkedin/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/linkedin-callback`,
            grant_type: 'authorization_code',
          }),
        });

        if (response.ok) {
          toast({ title: 'Success', description: 'LinkedIn connected successfully.' });
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          if (window.opener) {
            window.opener.postMessage('linkedin-success', window.location.origin);
            window.close();
          } else {
            navigate('/settings');
          }
        } else {
          toast({ title: 'Error', description: 'Failed to get access token from LinkedIn.', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      }
    };

    handleLinkedInCallback();
  }, [location, navigate, authFetch, queryClient]);

  return <div>Processing LinkedIn callback...</div>;
};
