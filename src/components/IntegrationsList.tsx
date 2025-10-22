import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Integration } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { IntegrationDialog } from './IntegrationDialog';
import { Zap, Trash2, Edit } from 'lucide-react';
import GoogleAuth from './GoogleAuth';

export const IntegrationsList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data === 'linkedin-success' || event.data === 'google-success') {
        queryClient.invalidateQueries({ queryKey: ['integrations'] });
        toast({ title: 'Success', variant: 'success', description: 'Integration connected successfully.' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [queryClient]);

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
      toast({ title: 'Success', variant: 'success', description: 'Integration deleted successfully.' });
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
    <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            Channel Integrations
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Connect with external messaging channels</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <GoogleAuth />
          <Button onClick={handleAddNew} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white btn-hover-lift">
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
              <span>Loading integrations...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations && integrations.length > 0 ? (
              integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-semibold dark:text-white">{integration.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type: <span className="capitalize">{integration.type}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(integration)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(integration.id)} className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No integrations configured yet. Click "Add New" to get started.</p>
              </div>
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
