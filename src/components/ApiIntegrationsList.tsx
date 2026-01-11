import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Plug,
  PlusCircle,
  Trash,
  Edit,
  Webhook,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Bot,
  Workflow
} from "lucide-react";
import { useI18n } from '@/hooks/useI18n';
import { ApiIntegration, Agent } from "@/types";
import { CreateApiIntegrationModal } from "./CreateApiIntegrationModal";
import { EditApiIntegrationModal } from "./EditApiIntegrationModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiKeyBasic {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export const ApiIntegrationsList = () => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const { authFetch } = useAuth();

  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyBasic[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ApiIntegration | null>(null);
  const [deletingIntegration, setDeletingIntegration] = useState<ApiIntegration | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, apiKeysRes, agentsRes, workflowsRes] = await Promise.all([
        authFetch("/api/v1/api-integrations/"),
        authFetch("/api/v1/api-keys/"),
        authFetch("/api/v1/agents/"),
        authFetch("/api/v1/workflows/"),
      ]);

      if (integrationsRes.ok) {
        setIntegrations(await integrationsRes.json());
      }
      if (apiKeysRes.ok) {
        setApiKeys(await apiKeysRes.json());
      }
      if (agentsRes.ok) {
        setAgents(await agentsRes.json());
      }
      if (workflowsRes.ok) {
        setWorkflows(await workflowsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.fetchError', 'Failed to fetch API integrations'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deletingIntegration) return;

    try {
      const response = await authFetch(`/api/v1/api-integrations/${deletingIntegration.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIntegrations(integrations.filter(i => i.id !== deletingIntegration.id));
        toast({
          title: t('apiIntegrations.success', 'Success'),
          description: t('apiIntegrations.deletedSuccess', 'Integration deleted successfully'),
        });
        playSuccessSound();
      } else {
        toast({
          title: t('apiIntegrations.error', 'Error'),
          description: t('apiIntegrations.deletedError', 'Failed to delete integration'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete integration", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    } finally {
      setDeletingIntegration(null);
    }
  };

  const handleTestWebhook = async (integration: ApiIntegration) => {
    try {
      const response = await authFetch(`/api/v1/api-integrations/${integration.id}/test-webhook`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast({
          title: t('apiIntegrations.webhookTestSuccess', 'Webhook Test Successful'),
          description: data.message,
        });
        playSuccessSound();
      } else {
        toast({
          title: t('apiIntegrations.webhookTestFailed', 'Webhook Test Failed'),
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to test webhook", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.webhookTestError', 'Failed to test webhook'),
        variant: "destructive",
      });
    }
  };

  const getAgentName = (agentId?: number) => {
    if (!agentId) return null;
    const agent = agents.find(a => a.id === agentId);
    return agent?.name;
  };

  const getWorkflowName = (workflowId?: number) => {
    if (!workflowId) return null;
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name;
  };

  // Get API keys that don't have an integration yet
  const availableApiKeys = apiKeys.filter(
    key => !integrations.some(i => i.api_key_id === key.id)
  );

  return (
    <>
      <Card dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between dark:border-slate-700">
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Plug className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              {t('apiIntegrations.title', 'API Integrations')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('apiIntegrations.subtitle', 'Manage API integrations for third-party systems')}
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            disabled={availableApiKeys.length === 0}
          >
            <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('apiIntegrations.create', 'Create Integration')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8">
              <Plug className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('apiIntegrations.noIntegrations', 'No API integrations configured')}
              </p>
              {availableApiKeys.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {t('apiIntegrations.createApiKeyFirst', 'Create an API key first in the Developer tab')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold dark:text-white">{integration.name}</h4>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active
                            ? <><CheckCircle className="h-3 w-3 mr-1" />{t('apiIntegrations.active', 'Active')}</>
                            : <><XCircle className="h-3 w-3 mr-1" />{t('apiIntegrations.inactive', 'Inactive')}</>
                          }
                        </Badge>
                        {integration.sync_response ? (
                          <Badge variant="outline" className="dark:border-slate-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('apiIntegrations.sync', 'Sync')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="dark:border-slate-600">
                            <Webhook className="h-3 w-3 mr-1" />
                            {t('apiIntegrations.async', 'Async')}
                          </Badge>
                        )}
                      </div>

                      {integration.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{integration.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Key className="h-3.5 w-3.5" />
                          <span>{integration.api_key_name || integration.api_key_prefix}</span>
                        </div>

                        {integration.default_agent_id && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Bot className="h-3.5 w-3.5" />
                            <span>{getAgentName(integration.default_agent_id)}</span>
                          </div>
                        )}

                        {integration.default_workflow_id && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Workflow className="h-3.5 w-3.5" />
                            <span>{getWorkflowName(integration.default_workflow_id)}</span>
                          </div>
                        )}

                        {integration.webhook_enabled && integration.webhook_url && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Webhook className="h-3.5 w-3.5" />
                            <span>{t('apiIntegrations.webhookEnabled', 'Webhook enabled')}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {t('apiIntegrations.createdOn', 'Created')}: {new Date(integration.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {integration.webhook_enabled && integration.webhook_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(integration)}
                          className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                        >
                          <Webhook className="h-4 w-4 mr-1" />
                          {t('apiIntegrations.testWebhook', 'Test')}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingIntegration(integration)}
                        className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingIntegration(integration)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateApiIntegrationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchData}
        apiKeys={availableApiKeys}
        agents={agents}
        workflows={workflows}
      />

      {editingIntegration && (
        <EditApiIntegrationModal
          isOpen={true}
          onClose={() => setEditingIntegration(null)}
          onUpdated={fetchData}
          integration={editingIntegration}
          agents={agents}
          workflows={workflows}
        />
      )}

      <AlertDialog open={!!deletingIntegration} onOpenChange={() => setDeletingIntegration(null)}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              {t('apiIntegrations.deleteTitle', 'Delete Integration')}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              {t('apiIntegrations.deleteConfirm', 'Are you sure you want to delete this integration? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
