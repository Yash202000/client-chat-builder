import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Credential } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { ResourceSelector } from "@/components/ResourceSelector";
import { CreateCredentialDialog } from "@/components/CreateCredentialDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const AgentCredentialsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSelectExistingOpen, setIsSelectExistingOpen] = useState(false);

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
  });

  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null);

  useEffect(() => {
    if (agent) {
      setSelectedCredentialId(agent.credential_id);
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (credentialId: number | null) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(t("agents.credentialsPage.toasts.updateSuccess"));
    },
    onError: () => {
      toast.error(t("agents.credentialsPage.toasts.updateError"));
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedCredentialId);
  };

  const handleCredentialCreated = (newCredentialId: number) => {
    setSelectedCredentialId(newCredentialId);
    mutation.mutate(newCredentialId);
  };

  const handleRemoveCredential = () => {
    setSelectedCredentialId(null);
    mutation.mutate(null);
  };

  const handleSelectCredential = (ids: number[]) => {
    const newCredentialId = ids[0] || null;
    setSelectedCredentialId(newCredentialId);
    setIsSelectExistingOpen(false);
    mutation.mutate(newCredentialId);
  };

  if (isLoadingAgent) return <div>{t("agents.credentialsPage.loading")}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("agents.credentialsPage.title")}</h1>
        <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)}>
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t("agents.credentialsPage.backToAgentHub")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("agents.credentialsPage.assignedCredential")}</CardTitle>
          <CardDescription>{t("agents.credentialsPage.assignedCredentialDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedCredentialId ? (
            <div className="flex items-center justify-between p-4 border rounded-md bg-blue-50 dark:bg-blue-950">
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">{credentials?.find(c => c.id === selectedCredentialId)?.name}</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">{t("agents.credentialsPage.service", { service: credentials?.find(c => c.id === selectedCredentialId)?.service })}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleRemoveCredential}
                disabled={mutation.isPending}
              >
                {t("agents.credentialsPage.remove")}
              </Button>
            </div>
          ) : (
            <div className="p-4 border rounded-md text-center text-gray-500 dark:text-gray-400">
              {t("agents.credentialsPage.noCredentialAssigned")}
            </div>
          )}

          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={mutation.isPending}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("agents.credentialsPage.addChangeCredential")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsSelectExistingOpen(true)}>
                  {t("agents.credentialsPage.selectExisting")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                  {t("agents.credentialsPage.createNew")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {mutation.isPending && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                {t("agents.credentialsPage.saving")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <ResourceSelector
        resources={credentials || []}
        selectedIds={selectedCredentialId ? [selectedCredentialId] : []}
        onSelect={handleSelectCredential}
        title={t("agents.credentialsPage.selectCredential")}
        triggerButtonText={t("agents.credentialsPage.browseCredentials")}
        isLoading={isLoadingCredentials}
        allowMultiple={false}
        isOpen={isSelectExistingOpen}
        onClose={() => setIsSelectExistingOpen(false)}
      />

      <CreateCredentialDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCredentialCreated={handleCredentialCreated}
      />
    </div>
  );
};
