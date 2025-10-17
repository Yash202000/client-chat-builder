import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateCredentialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialCreated: (credentialId: number) => void;
}

export const CreateCredentialDialog: React.FC<CreateCredentialDialogProps> = ({
  isOpen,
  onClose,
  onCredentialCreated,
}) => {
  const [name, setName] = useState('');
  const [service, setService] = useState('');
  const [credentialsJson, setCredentialsJson] = useState('');
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: { name: string; service: string; credentials: Record<string, any> }) => {
      const response = await authFetch(`/api/v1/credentials/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create credential');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Credential created successfully!');
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      onCredentialCreated(data.id);
      onClose();
      setName('');
      setService('');
      setCredentialsJson('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    try {
      const parsedCredentials = JSON.parse(credentialsJson);
      createCredentialMutation.mutate({ name, service, credentials: parsedCredentials });
    } catch (e) {
      toast.error('Invalid JSON for credentials.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Credential</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="service" className="text-right">Service</Label>
            <Input id="service" value={service} onChange={(e) => setService(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="credentials" className="text-right">Credentials (JSON)</Label>
            <Textarea id="credentials" value={credentialsJson} onChange={(e) => setCredentialsJson(e.target.value)} className="col-span-3" rows={5} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createCredentialMutation.isPending}>
            {createCredentialMutation.isPending ? 'Creating...' : 'Create Credential'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
