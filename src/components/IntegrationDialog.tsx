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
      toast({ title: 'Success', description: `Integration ${integration ? 'updated' : 'created'} successfully.` });
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
    const webhookUrlBase = `${window.location.origin}/api/v1/webhooks/channels`;
    switch (type) {
      case 'whatsapp':
        return (
          <>
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Webhook Configuration</h4>
              <p className="text-xs text-gray-600">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1">
                <Label htmlFor="webhook_url" className="text-xs">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/whatsapp`} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="verify_token" className="text-xs">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" /> 
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input
                id="phone_number_id"
                value={credentials.phone_number_id || ''}
                onChange={(e) => handleCredentialChange('phone_number_id', e.target.value)}
                placeholder="Your WhatsApp Phone Number ID from Meta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                value={credentials.access_token || ''}
                onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                placeholder="Your WhatsApp Permanent Access Token"
              />
            </div>
          </>
        );
      case 'messenger':
        return (
          <>
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Webhook Configuration</h4>
               <p className="text-xs text-gray-600">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1">
                <Label htmlFor="webhook_url" className="text-xs">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/messenger`} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="verify_token" className="text-xs">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_id">Page ID</Label>
              <Input
                id="page_id"
                value={credentials.page_id || ''}
                onChange={(e) => handleCredentialChange('page_id', e.target.value)}
                placeholder="Your Facebook Page ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_access_token">Page Access Token</Label>
              <Input
                id="page_access_token"
                type="password"
                value={credentials.page_access_token || ''}
                onChange={(e) => handleCredentialChange('page_access_token', e.target.value)}
                placeholder="Your Facebook Page Access Token"
              />
            </div>
          </>
        );
      case 'instagram':
        return (
          <>
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm">Webhook Configuration</h4>
               <p className="text-xs text-gray-600">
                Use these values in your Meta for Developers App configuration.
              </p>
              <div className="space-y-1">
                <Label htmlFor="webhook_url" className="text-xs">Webhook URL</Label>
                <Input id="webhook_url" readOnly value={`${webhookUrlBase}/instagram`} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="verify_token" className="text-xs">Verify Token</Label>
                <Input id="verify_token" readOnly value="YOUR_VERIFY_TOKEN" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page_id">Page ID</Label>
              <Input
                id="page_id"
                value={credentials.page_id || ''}
                onChange={(e) => handleCredentialChange('page_id', e.target.value)}
                placeholder="Your Instagram Page ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                value={credentials.access_token || ''}
                onChange={(e) => handleCredentialChange('access_token', e.target.value)}
                placeholder="Your Instagram Access Token"
              />
            </div>
          </>
        );
      case 'gmail':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                value={credentials.client_id || ''}
                onChange={(e) => handleCredentialChange('client_id', e.target.value)}
                placeholder="Your Google Cloud Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret</Label>
              <Input
                id="client_secret"
                type="password"
                value={credentials.client_secret || ''}
                onChange={(e) => handleCredentialChange('client_secret', e.target.value)}
                placeholder="Your Google Cloud Client Secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect_uri">Redirect URI</Label>
              <Input
                id="redirect_uri"
                value={credentials.redirect_uri || ''}
                onChange={(e) => handleCredentialChange('redirect_uri', e.target.value)}
                placeholder="Your Google Cloud Redirect URI"
              />
            </div>
          </>
        );
      case 'telegram':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bot_token">Bot Token</Label>
              <Input
                id="bot_token"
                type="password"
                value={credentials.bot_token || ''}
                onChange={(e) => handleCredentialChange('bot_token', e.target.value)}
                placeholder="Your Telegram Bot Token"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{integration ? 'Edit Integration' : 'Add New Integration'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Integration Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType} disabled={!!integration}>
              <SelectTrigger>
                <SelectValue placeholder="Select integration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderCredentialFields()}
           {integration && (
            <p className="text-xs text-yellow-600">
              For security, credentials are not displayed. Please re-enter them to make changes.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
