import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Integration } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { IntegrationDialog } from './IntegrationDialog';
import { Zap, Trash2, Edit } from 'lucide-react';

export const IntegrationsList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/integrations/');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await authFetch(`/api/v1/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete integration');
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Integration deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete integration.', variant: 'destructive' });
    },
  });

  const handleEdit = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedIntegration(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (integrationId: number) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      deleteMutation.mutate(integrationId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Channel Integrations
          </CardTitle>
          <CardDescription>Connect with external messaging channels</CardDescription>
        </div>
        <Button onClick={handleAddNew}>Add New</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {integrations && integrations.length > 0 ? (
              integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-gray-600">Type: {integration.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(integration)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(integration.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-500">No integrations configured.</p>
            )}
          </div>
        )}
      </CardContent>
      <IntegrationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        integration={selectedIntegration}
      />
    </Card>
  );
};
