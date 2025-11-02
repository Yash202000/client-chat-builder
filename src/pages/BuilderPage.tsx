
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentBuilder } from "@/components/AgentBuilder";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent } from "@/types";
import { toast } from "@/hooks/use-toast";
import { History, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Comments } from "@/components/Comments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

const BuilderPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const companyId = localStorage.getItem("companyId");
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ['agents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/agents/`);
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      return response.json();
    },
    enabled: !agentId,
  });

  const { data: agent, isLoading, isError } = useQuery<Agent>({
    queryKey: ['agent', agentId, companyId],
    queryFn: async () => {
      if (!agentId) return null;
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agent");
      }
      return response.json();
    },
    enabled: !!agentId,
  });

  const { data: agentHistory, isLoading: isLoadingHistory } = useQuery<Agent[]>({
    queryKey: ['agentHistory', agent?.name, companyId],
    queryFn: async () => {
      if (!agent?.name || !companyId) return [];
      const response = await authFetch(`/api/v1/agents/?name=${agent.name}&company_id=${companyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agent history");
      }
      return response.json();
    },
    enabled: !!agent?.name && !!companyId,
  });

  const createNewVersionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await authFetch(`/api/v1/agents/${id}/new-version`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create new version");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentHistory'] });
      toast({ title: t('builder.newVersionCreated') });
    },
    onError: (error) => {
      toast({ title: t('builder.failedCreateVersion'), description: error.message, variant: "destructive" });
    },
  });

  const activateVersionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await authFetch(`/api/v1/agents/${id}/activate-version`, {
        method: "PUT",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to activate version");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentHistory'] });
      queryClient.invalidateQueries({ queryKey: ['agent', data.id.toString()] });
      toast({ title: t('builder.versionActivated', { version: data.version_number }) });
      setIsHistoryDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: t('builder.failedActivateVersion'), description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('builder.loadingAgent')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('builder.errorLoadingAgent')}</h3>
          <p className="text-muted-foreground">{t('builder.errorLoadingAgentDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className={`flex justify-between items-start `}>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {t('builder.title')}
          </h2>
          <p className="text-muted-foreground text-lg">{t('builder.subtitle')}</p>
        </div>
        <div className={`flex gap-2`}>
          {agentId && agent && (
            <Button
              variant="outline"
              onClick={() => createNewVersionMutation.mutate(agent.id)}
              disabled={createNewVersionMutation.isPending}
              className="btn-hover-lift"
            >
              <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {createNewVersionMutation.isPending ? t('builder.creating') : t('builder.newVersion')}
            </Button>
          )}
          {agentId && (
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(true)}
              className="btn-hover-lift"
            >
              <History className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('builder.history')}
            </Button>
          )}
          {!agentId && (
            <Button
              onClick={() => setIsCreateAgentDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white btn-hover-lift"
            >
              <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('builder.createNewAgent')}
            </Button>
          )}
        </div>
      </div>

      {agentId && agent ? (
        <>
          <AgentBuilder
            agent={agent}
            onSave={() => { /* Handle save, e.g., navigate back or show toast */ }}
            onCancel={() => { /* Handle cancel, e.g., navigate back */ }}
          />
        </>
      ) : !agentId && (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 card-shadow">
          <div className="text-center p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-6">
              <span className="text-4xl">🤖</span>
            </div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">{t('builder.selectAgent')}</h3>
            <p className="mb-6 text-lg text-muted-foreground">{t('builder.selectAgentDesc')}</p>
            {isLoadingAgents ? (
              <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className={`text-muted-foreground ${isRTL ? 'mr-3' : 'ml-3'}`}>{t('builder.loadingAgents')}</p>
              </div>
            ) : (
              <Select onValueChange={(value) => navigate(`/dashboard/builder/${value}`)}>
                <SelectTrigger className="w-[320px] h-12">
                  <SelectValue placeholder={t('builder.selectAnAgent')} />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />

      {/* Enhanced Version History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold dark:text-white">
              {t('builder.versionHistory')}
            </DialogTitle>
            <p className="text-muted-foreground">
              {t('builder.manageVersionsFor', { name: agent?.name })}
            </p>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-3"></div>
                <p className="text-muted-foreground">{t('builder.loadingHistory')}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="font-semibold dark:text-gray-300">{t('builder.version')}</TableHead>
                    <TableHead className="font-semibold dark:text-gray-300">{t('builder.status')}</TableHead>
                    <TableHead className="font-semibold dark:text-gray-300">{t('builder.createdAt')}</TableHead>
                    <TableHead className="font-semibold dark:text-gray-300">{t('builder.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentHistory?.map((version) => (
                    <TableRow key={version.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-medium dark:text-white">
                        <div className={`flex items-center gap-2 `}>
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                            v{version.version_number}
                          </div>
                          {t('builder.version')} {version.version_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {version.status === "active" ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className={`w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                            {t('builder.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {t('builder.inactive')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`text-sm text-muted-foreground`}>
                        {new Date(version.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {version.status !== "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateVersionMutation.mutate(version.id)}
                            disabled={activateVersionMutation.isPending}
                            className="btn-hover-lift bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                          >
                            {activateVersionMutation.isPending ? t('builder.activating') : t('builder.activate')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuilderPage;
