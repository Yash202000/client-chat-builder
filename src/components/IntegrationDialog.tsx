import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Integration } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface IntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration | null;
}

export const IntegrationDialog: React.FC<IntegrationDialogProps> = ({ isOpen, onClose, integration }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('whatsapp');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const { authFetch } = useAuth();
  const { playSuccessSound } = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setType(integration.type);
      // Note: We don't receive credentials from the backend for security reasons.
      // The user must re-enter them on edit.
      setCredentials({});
    } else {
      // Reset form for new integration
      setName('');
      setType('whatsapp');
      setCredentials({});
    }
  }, [integration, isOpen]);

  const mutation = useMutation({
    mutationFn: (newIntegration: any) => {
      const url = integration
        ? `/api/v1/integrations/${integration.id}`
        : '/api/v1/integrations/';
      const method = integration ? 'PUT' : 'POST';

      return authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration),
      });
    },
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save integration');
      }
      toast({ title: 'Success', variant: 'success', description: `Integration ${integration ? 'updated' : 'created'} successfully.` });
      playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    const payload: any = { name, type, credentials };
    if (integration) {
      // For PUT, only send fields that are being changed
      const updatedPayload: any = { name, type };
      // Only include credentials if they have been entered
      if (Object.values(credentials).some(v => v)) {
        updatedPayload.credentials = credentials;
      }
      mutation.mutate(updatedPayload);
    } else {
      mutation.mutate(payload);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const renderCredentialFields = () => {
    const webhookUrlBase = `${window.location.origin}/api/v1/webhooks`;

    const webhookInfoBoxClasses = "space-y-3 p-4 border rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200/80 dark:border-slate-700/60";
    const labelClasses = "dark:text-gray-300 font-medium";
    const inputClasses = "dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl";
    const readOnlyInputClasses = "dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono text-xs rounded-lg";

    switch (type) {
      case 'whatsapp':
        return (
          <>
            <div className={webhookInfoBoxClasses}>
              <h4 className="font-medium text-sm dark:text-white flex items-center gap-2">
                <div className="p-1 rounded-md bg-green-100 dark:bg-green-900/30">
                  <svg className="h-3.5 w-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                Webhook Configuration
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="webhook_url" className="text-xs dark:text-gray-300">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/whatsapp`} className={readOnlyInputClasses} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="verify_token" className="text-xs dark:text-gray-300">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" className={readOnlyInputClasses} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number_id" className={labelClasses}>Phone Number ID</Label>
              <Input
                id="phone_number_id"
                value={credentials.phone_number_id || ''}
                onChange={(e) => handleCredentialChange('phone_number_id', e.target.value)}
                placeholder="Your WhatsApp Phone Number ID from Meta"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token" className={labelClasses}>Access Token</Label>
              <Input
                id="access_token"
                type="password"
                value={credentials.access_token || ''}
                onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                placeholder="Your WhatsApp Permanent Access Token"
                className={inputClasses}
              />
            </div>
          </>
        );
      case 'messenger':
        return (
          <>
            <div className={webhookInfoBoxClasses}>
              <h4 className="font-medium text-sm dark:text-white flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                Webhook Configuration
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="webhook_url" className="text-xs dark:text-gray-300">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/messenger`} className={readOnlyInputClasses} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="verify_token" className="text-xs dark:text-gray-300">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" className={readOnlyInputClasses} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_id" className={labelClasses}>Page ID</Label>
              <Input
                id="page_id"
                value={credentials.page_id || ''}
                onChange={(e) => handleCredentialChange('page_id', e.target.value)}
                placeholder="Your Facebook Page ID"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_access_token" className={labelClasses}>Page Access Token</Label>
              <Input
                id="page_access_token"
                type="password"
                value={credentials.page_access_token || ''}
                onChange={(e) => handleCredentialChange('page_access_token', e.target.value)}
                placeholder="Your Facebook Page Access Token"
                className={inputClasses}
              />
            </div>
          </>
        );
      case 'instagram':
        return (
          <>
            <div className={webhookInfoBoxClasses}>
              <h4 className="font-medium text-sm dark:text-white flex items-center gap-2">
                <div className="p-1 rounded-md bg-pink-100 dark:bg-pink-900/30">
                  <svg className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                Webhook Configuration
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="webhook_url" className="text-xs dark:text-gray-300">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/instagram`} className={readOnlyInputClasses} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="verify_token" className="text-xs dark:text-gray-300">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" className={readOnlyInputClasses} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_id" className={labelClasses}>Page ID</Label>
              <Input
                id="page_id"
                value={credentials.page_id || ''}
                onChange={(e) => handleCredentialChange('page_id', e.target.value)}
                placeholder="Your Instagram Page ID"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token" className={labelClasses}>Access Token</Label>
              <Input
                id="access_token"
                type="password"
                value={credentials.access_token || ''}
                onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                placeholder="Your Instagram Access Token"
                className={inputClasses}
              />
            </div>
          </>
        );
      case 'gmail':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="client_id" className={labelClasses}>Client ID</Label>
              <Input
                id="client_id"
                value={credentials.client_id || ''}
                onChange={(e) => handleCredentialChange('client_id', e.target.value)}
                placeholder="Your Google Cloud Client ID"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_secret" className={labelClasses}>Client Secret</Label>
              <Input
                id="client_secret"
                type="password"
                value={credentials.client_secret || ''}
                onChange={(e) => handleCredentialChange('client_secret', e.target.value)}
                placeholder="Your Google Cloud Client Secret"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect_uri" className={labelClasses}>Redirect URI</Label>
              <Input
                id="redirect_uri"
                value={credentials.redirect_uri || ''}
                onChange={(e) => handleCredentialChange('redirect_uri', e.target.value)}
                placeholder="Your Google Cloud Redirect URI"
                className={inputClasses}
              />
            </div>
          </>
        );
      case 'telegram':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bot_token" className={labelClasses}>Bot Token</Label>
              <Input
                id="bot_token"
                type="password"
                value={credentials.bot_token || ''}
                onChange={(e) => handleCredentialChange('bot_token', e.target.value)}
                placeholder="Your Telegram Bot Token"
                className={inputClasses}
              />
            </div>
          </>
        );
      case 'linkedin':
        return (
          <>
            <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200/80 dark:border-indigo-700/60">
              <Label className={labelClasses}>Connect to LinkedIn</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Click the button below to authorize access to your LinkedIn account.</p>
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
                onClick={async () => {
                  try {
                    const response = await authFetch('/api/v1/config/linkedin-client-id');
                    if (!response.ok) {
                      throw new Error('Failed to fetch LinkedIn Client ID');
                    }
                    const { client_id } = await response.json();

                    const redirectUri = `${window.location.origin}/linkedin-callback`;
                    const scope = "openid profile email"; // Updated to OIDC scopes
                    const state = "DCEeFWf45A53sdfKef424"; // Should be a random, unique string
                    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${client_id}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

                    const width = 600, height = 600;
                    const left = (window.innerWidth / 2) - (width / 2);
                    const top = (window.innerHeight / 2) - (height / 2);

                    window.open(linkedInAuthUrl, 'LinkedIn', `width=${width},height=${height},top=${top},left=${left}`);
                  } catch (error) {
                    toast({ title: 'Error', description: 'Could not initiate LinkedIn connection.', variant: 'destructive' });
                  }
                }}
              >
                Connect with LinkedIn
              </Button>
            </div>
          </>
        );
      case 'google_calendar':
        return (
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/80 dark:border-amber-700/60">
            <Label className={labelClasses}>Connect to Google Calendar</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">Click the button below to authorize access to your Google Calendar.</p>
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all"
              onClick={async () => {
                try {
                  const response = await authFetch('/api/v1/config/google-client-id');
                  if (!response.ok) {
                    throw new Error('Failed to fetch Google Client ID');
                  }
                  const { client_id } = await response.json();

                  const redirectUri = `${window.location.origin}/api/v1/calendar/google/callback`;
                  const scope = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email";
                  const state = "some_random_state_string"; // Should be a random, unique string
                  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

                  const width = 600, height = 600;
                  const left = (window.innerWidth / 2) - (width / 2);
                  const top = (window.innerHeight / 2) - (height / 2);

                  window.open(googleAuthUrl, 'Google', `width=${width},height=${height},top=${top},left=${left}`);
                } catch (error) {
                  toast({ title: 'Error', description: 'Could not initiate Google connection.', variant: 'destructive' });
                }
              }}
            >
              Connect with Google
            </Button>
          </div>
        );
      case 'm365_calendar':
        return (
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200/80 dark:border-cyan-700/60">
            <Label className={labelClasses}>Connect to Microsoft 365 Calendar</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">Click the button below to authorize access to your Microsoft 365 Calendar.</p>
            <Button
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
              onClick={async () => {
                try {
                  const response = await authFetch('/api/v1/config/m365-client-id');
                  if (!response.ok) {
                    throw new Error('Failed to fetch Microsoft 365 Client ID');
                  }
                  const { client_id } = await response.json();

                  const redirectUri = `${window.location.origin}/api/v1/teams-calendar/callback`;
                  const scope = "https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access";
                  const state = "some_random_state_string_m365"; // Should be a random, unique string
                  const m365AuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_mode=query`;

                  const width = 600, height = 600;
                  const left = (window.innerWidth / 2) - (width / 2);
                  const top = (window.innerHeight / 2) - (height / 2);

                  window.open(m365AuthUrl, 'Microsoft', `width=${width},height=${height},top=${top},left=${left}`);
                } catch (error) {
                  toast({ title: 'Error', description: 'Could not initiate Microsoft 365 connection.', variant: 'destructive' });
                }
              }}
            >
              Connect with Microsoft
            </Button>
          </div>
        );
      case 'twilio_voice':
        return (
          <>
            <div className={webhookInfoBoxClasses}>
              <h4 className="font-medium text-sm dark:text-white flex items-center gap-2">
                <div className="p-1 rounded-md bg-orange-100 dark:bg-orange-900/30">
                  <svg className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                Webhook Configuration
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Configure these URLs in your Twilio Console for your phone number.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="voice_webhook_url" className="text-xs dark:text-gray-300">Voice Webhook URL</Label>
                <Input id="voice_webhook_url" readOnly value={`${window.location.origin}/api/v1/twilio/webhook/voice`} className={readOnlyInputClasses} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status_callback_url" className="text-xs dark:text-gray-300">Status Callback URL</Label>
                <Input id="status_callback_url" readOnly value={`${window.location.origin}/api/v1/twilio/webhook/voice/status`} className={readOnlyInputClasses} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_sid" className={labelClasses}>Account SID</Label>
              <Input
                id="account_sid"
                value={credentials.account_sid || ''}
                onChange={(e) => handleCredentialChange('account_sid', e.target.value)}
                placeholder="Your Twilio Account SID (starts with AC)"
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth_token" className={labelClasses}>Auth Token</Label>
              <Input
                id="auth_token"
                type="password"
                value={credentials.auth_token || ''}
                onChange={(e) => handleCredentialChange('auth_token', e.target.value)}
                placeholder="Your Twilio Auth Token"
                className={inputClasses}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              After saving, go to Settings → Twilio Voice to configure phone numbers and assign agents.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className="dark:text-white text-xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {integration ? 'Edit Integration' : 'Add New Integration'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="dark:text-gray-300 font-medium">Integration Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl"
              placeholder="e.g., My WhatsApp Integration"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="dark:text-gray-300 font-medium">Type</Label>
            <Select value={type} onValueChange={setType} disabled={!!integration}>
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl">
                <SelectValue placeholder="Select integration type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                <SelectItem value="whatsapp" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">WhatsApp</SelectItem>
                <SelectItem value="messenger" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Messenger</SelectItem>
                <SelectItem value="instagram" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Instagram</SelectItem>
                <SelectItem value="gmail" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Gmail</SelectItem>
                <SelectItem value="telegram" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Telegram</SelectItem>
                <SelectItem value="linkedin" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">LinkedIn</SelectItem>
                <SelectItem value="google_calendar" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Google Calendar</SelectItem>
                <SelectItem value="m365_calendar" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Microsoft 365 Calendar</SelectItem>
                <SelectItem value="twilio_voice" className="dark:text-white dark:focus:bg-slate-700 rounded-lg">Twilio Voice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderCredentialFields()}
           {integration && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              For security, credentials are not displayed. Please re-enter them to make changes.
            </p>
          )}
        </div>
        <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60 gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </span>
            ) : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
