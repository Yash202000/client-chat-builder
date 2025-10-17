import React from 'react';
import { Button } from './ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const GoogleAuth: React.FC = () => {
  const { authFetch, token } = useAuth();
  const { data: googleClientId, isLoading } = useQuery<string>({
    queryKey: ['google_client_id'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/google/client-id');
      if (!response.ok) {
        throw new Error('Failed to fetch Google Client ID');
      }
      const data = await response.json();
      return data.client_id;
    },
  });

  const handleLogin = () => {
    if (googleClientId && token) {
      // This is the callback URL you must have registered in your Google Cloud Console
      const redirectUri = 'http://localhost:8080/api/v1/google/callback';
      
      // Include all scopes for the services you want to access
      const scope = 'https://www.googleapis.com/auth/gmail.modify'; // Add calendar, drive, etc. scopes here separated by spaces
      
      const responseType = 'code';
      const accessType = 'offline'; // Required to get a refresh token
      const prompt = 'consent'; // Ensures the user is prompted for consent every time

      // We pass the user's JWT token in the state parameter to identify the user upon callback
      const state = token;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&access_type=${accessType}&prompt=${prompt}&state=${state}`;

      const popup = window.open(authUrl, 'google-auth', 'width=600,height=700');
      if (!popup) {
        alert('Please allow popups for this site to connect your Google account.');
      }
    }
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Connect Google Account'}
    </Button>
  );
};

export default GoogleAuth;