
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentBuilder } from "@/components/AgentBuilder";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent } from "@/types";
import { toast } from "@/hooks/use-toast";
import { History, PlusCircle, Workflow, Paintbrush } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Comments } from "@/components/Comments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { motion } from 'framer-motion';

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
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          <p className="text-sm text-muted-foreground">{t('builder.loadingAgent')}</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{t('builder.errorLoadingAgent')}</h3>
          <p className="text-sm text-muted-foreground">{t('builder.errorLoadingAgentDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Workflow className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">
              {agentId && agent ? agent.name : t('builder.title')}
            </h1>
            {agentId && agent ? (
              <p className="text-xs text-muted-foreground font-mono">
                agent #{agentId} · v{agent.version_number ?? 1}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('builder.subtitle')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agentId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/dashboard/designer?agentId=${agentId}`)}
              className="h-8 px-3 text-xs border-violet-500/30 text-violet-500 hover:bg-violet-500/10 hover:border-violet-500/50"
            >
              <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
              {t('builder.design')}
            </Button>
          )}
          {agentId && agent && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => createNewVersionMutation.mutate(agent.id)}
              disabled={createNewVersionMutation.isPending}
              className="h-8 px-3 text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              {createNewVersionMutation.isPending ? t('builder.creating') : t('builder.newVersion')}
            </Button>
          )}
          {agentId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(true)}
              className="h-8 px-3 text-xs"
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              {t('builder.history')}
            </Button>
          )}
          {!agentId && (
            <Button
              size="sm"
              onClick={() => setIsCreateAgentDialogOpen(true)}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              {t('builder.createNewAgent')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06 }}
        className="flex-1 min-h-0"
      >
        {agentId && agent ? (
          <AgentBuilder
            agent={agent}
            onSave={() => {}}
            onCancel={() => {}}
          />
        ) : !agentId && (
          <div className="flex flex-col items-center justify-center h-full rounded-xl border border-border bg-card">
            <div className="text-center p-8 max-w-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
                <Workflow className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">{t('builder.selectAgent')}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t('builder.selectAgentDesc')}</p>
              {isLoadingAgents ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                  <p className="text-sm text-muted-foreground">{t('builder.loadingAgents')}</p>
                </div>
              ) : (
                <Select onValueChange={(value) => navigate(`/dashboard/builder/${value}`)}>
                  <SelectTrigger className="w-72 h-9 text-sm bg-background border-border">
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
      </motion.div>

      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />

      {/* Version History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              {t('builder.versionHistory')}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {t('builder.manageVersionsFor', { name: agent?.name })}
            </p>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('builder.version')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('builder.status')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('builder.createdAt')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('builder.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentHistory?.map((version, i) => (
                    <motion.tr
                      key={version.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.04 }}
                      className="border-border hover:bg-muted/40 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                            v{version.version_number}
                          </span>
                          <span className="text-sm text-muted-foreground">{t('builder.version')} {version.version_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {version.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {t('builder.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted border border-border text-muted-foreground">
                            {t('builder.inactive')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(version.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {version.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateVersionMutation.mutate(version.id)}
                            disabled={activateVersionMutation.isPending}
                            className="h-7 px-2.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            {activateVersionMutation.isPending ? t('builder.activating') : t('builder.activate')}
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
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
