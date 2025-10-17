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

      if (code) {
        try {
          const response = await authFetch('/api/v1/proxy/linkedin/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirect_uri: `${window.location.origin}/linkedin-callback`,
              grant_type: 'authorization_code',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Now you have the access token, you can save it to the integration
            // This will likely involve another API call to your backend to create/update the integration
            // with the new credentials.
            
            // For now, we'll just show a success message
            toast({ title: 'Success', description: 'LinkedIn connected successfully.' });
            
            // Invalidate the integrations query to refetch the list
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            
            // Notify the main window and close the popup
            if (window.opener) {
              window.opener.postMessage('linkedin-success', window.location.origin);
              window.close();
            } else {
              // Fallback for cases where the popup is not opened by a script
              navigate('/settings');
            }
          } else {
            toast({ title: 'Error', description: 'Failed to get access token from LinkedIn.', variant: 'destructive' });
          }
        } catch (error) {
          toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        }
      }
    };

    handleLinkedInCallback();
  }, [location, navigate, authFetch, queryClient]);

  return <div>Processing LinkedIn callback...</div>;
};
