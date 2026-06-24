import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const LinkedInCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState('Connecting LinkedIn...');

  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');
      const state = params.get('state') ?? '';

      if (error) {
        toast({ title: 'LinkedIn denied', description: 'You cancelled the LinkedIn authorization.', variant: 'destructive' });
        navigate(state.startsWith('social:') ? '/dashboard/social/accounts' : '/dashboard/settings');
        return;
      }

      if (!code) {
        toast({ title: 'Error', description: 'No authorization code received from LinkedIn.', variant: 'destructive' });
        navigate('/dashboard/settings');
        return;
      }

      // Social Accounts flow — state starts with "social:"
      if (state.startsWith('social:')) {
        try {
          setStatusMessage('Linking your LinkedIn account...');
          const response = await authFetch('/api/v1/social/auth/linkedin/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            toast({ title: 'LinkedIn connected!', description: 'Your account has been linked.' });
            queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth_complete', platform: 'linkedin' }, window.location.origin);
              window.close();
            } else {
              navigate('/dashboard/social/accounts?connected=linkedin');
            }
          } else {
            const err = await response.json().catch(() => ({}));
            toast({ title: 'Error', description: err.detail || 'Failed to connect LinkedIn account.', variant: 'destructive' });
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth_error', platform: 'linkedin' }, window.location.origin);
              window.close();
            } else {
              navigate('/dashboard/social/accounts');
            }
          }
        } catch {
          toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth_error', platform: 'linkedin' }, window.location.origin);
            window.close();
          } else {
            navigate('/dashboard/social/accounts');
          }
        }
        return;
      }

      // Legacy integration flow — may open in popup
      try {
        setStatusMessage('Completing LinkedIn integration...');
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
            navigate('/dashboard/settings');
          }
        } else {
          const err = await response.json().catch(() => ({}));
          toast({ title: 'Error', description: err.detail || 'Failed to connect LinkedIn.', variant: 'destructive' });
          navigate('/dashboard/settings');
        }
      } catch {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        navigate('/dashboard/settings');
      }
    };

    handleLinkedInCallback();
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{statusMessage}</p>
    </div>
  );
};
