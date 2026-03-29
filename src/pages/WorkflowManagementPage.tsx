import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Permission } from "@/components/Permission";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Edit, Copy, PlusCircle, Trash2, WorkflowIcon, Upload, Download, LayoutTemplate, Layers, Search, GitBranch, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import CreateWorkflowDialog from '@/components/CreateWorkflowDialog';
import WorkflowTemplateModal from '@/components/WorkflowTemplateModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const WorkflowManagementPage = () => {
  const { t, isRTL } = useI18n();
  const [workflows, setWorkflows] = useState([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agents, setAgents] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [subworkflowUsage, setSubworkflowUsage] = useState<Record<number, {id: number, name: string}[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const fetchSubworkflowUsage = useCallback(async () => {
    try {
      const response = await authFetch('/api/v1/workflows/subworkflow-usage/all');
      if (response.ok) {
        const data = await response.json();
        setSubworkflowUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch subworkflow usage');
    }
  }, [authFetch]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      toast.error(t("workflows.toasts.loadFailed"));
    }
  }, [authFetch, t]);

  useEffect(() => {
    fetchWorkflows();
    fetchSubworkflowUsage();
  }, [fetchWorkflows, fetchSubworkflowUsage]);

  const handleCreateWorkflow = async ({ name, description }) => {
    const newWorkflowPayload = { name, description, agent_ids: [] };
    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflowPayload),
      });
      if (!response.ok) throw new Error('Creation failed');
      toast.success(t("workflows.toasts.workflowCreated", { name }));
      fetchWorkflows(); // Refresh the list
    } catch (error) {
      toast.error(t("workflows.toasts.creationFailed", { message: error.message }));
    }
  };

  const createWorkflowVersion = async (workflowId) => {
    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/versions`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to create new version');
      toast.success(t("workflows.toasts.versionCreated"));
      fetchWorkflows();
    } catch (error) {
      toast.error(t("workflows.toasts.versionCreateFailed", { message: error.message }));
    }
  };

  const activateWorkflowVersion = async (versionId) => {
    try {
      const response = await authFetch(`/api/v1/workflows/versions/${versionId}/activate`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to activate version');
      toast.success(t("workflows.toasts.versionActivated"));
      fetchWorkflows();
    } catch (error) {
      toast.error(t("workflows.toasts.versionActivateFailed", { message: error.message }));
    }
  };

  const deactivateWorkflowVersion = async (versionId) => {
    try {
      const response = await authFetch(`/api/v1/workflows/versions/${versionId}/deactivate`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to deactivate version');
      toast.success(t("workflows.toasts.versionDeactivated"));
      fetchWorkflows();
    } catch (error) {
      toast.error(t("workflows.toasts.versionDeactivateFailed", { message: error.message }));
    }
  };

  const deleteWorkflow = async (workflowId) => {
    if (window.confirm(t("workflows.deleteConfirm"))) {
        try {
            await authFetch(`/api/v1/workflows/${workflowId}`, { method: 'DELETE' });
            toast.success(t("workflows.toasts.workflowDeleted"));
            fetchWorkflows();
        } catch (error) {
            toast.error(t("workflows.toasts.deletionFailed"));
        }
    }
  };

  // Export workflow as JSON file
  const handleExport = async (workflowId: number, workflowName: string) => {
    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/export`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, '_')}_workflow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t("workflows.toasts.exportSuccess") || "Workflow exported successfully");
    } catch (error) {
      toast.error(t("workflows.toasts.exportFailed") || "Failed to export workflow");
    }
  };

  // Fetch agents for import dialog
  const fetchAgents = async () => {
    try {
      const response = await authFetch('/api/v1/agents/');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      setImportData(data);
    } catch (error) {
      toast.error(t("workflows.toasts.invalidFile") || "Invalid JSON file");
      setImportFile(null);
      setImportData(null);
    }
  };

  // Open import dialog
  const openImportDialog = () => {
    fetchAgents();
    setImportDialogOpen(true);
  };

  // Close import dialog and reset state
  const closeImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportData(null);
    setSelectedAgentId("");
  };

  // Import workflow
  const handleImport = async () => {
    if (!importData || !selectedAgentId) {
      toast.error(t("workflows.toasts.selectAgent") || "Please select an agent");
      return;
    }

    setIsImporting(true);
    try {
      const response = await authFetch('/api/v1/workflows/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: parseInt(selectedAgentId),
          workflow_data: importData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Import failed');
      }

      toast.success(t("workflows.toasts.importSuccess") || "Workflow imported successfully");
      closeImportDialog();
      fetchWorkflows();
    } catch (error: any) {
      toast.error(error.message || t("workflows.toasts.importFailed") || "Failed to import workflow");
    } finally {
      setIsImporting(false);
    }
  };

  const activeVersionCount = workflows.reduce((acc, w) => acc + (w.versions || []).filter(v => v.is_active).length, 0);
  const totalVersionCount = workflows.reduce((acc, w) => acc + (w.versions || []).length, 0);
  const filteredWorkflows = workflows.filter(w =>
    w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: i * 0.045 },
    }),
  };

  return (
    <>
      <CreateWorkflowDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateWorkflow}
      />
      <WorkflowTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      />

      <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── Stats + actions bar ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Stat pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
              <WorkflowIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground tabular-nums">{workflows.length}</span>
              <span className="text-xs text-muted-foreground">{t("workflows.totalWorkflows")}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{activeVersionCount}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500">{t("workflows.activeVersions")}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
              <GitBranch className="h-3 w-3 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-400 tabular-nums">{totalVersionCount}</span>
              <span className="text-xs text-violet-600 dark:text-violet-500">{t("workflows.totalVersions")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search workflows…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-48 text-sm bg-background border-border"
              />
            </div>
            <Permission permission="workflow:create">
              <Button onClick={openImportDialog} variant="outline" size="sm" className="h-9 gap-1.5 border-border text-muted-foreground hover:text-foreground">
                <Upload className="h-3.5 w-3.5" />
                {t("workflows.importWorkflow") || "Import"}
              </Button>
            </Permission>
            <Permission permission="workflow:create">
              <Button onClick={() => setTemplateModalOpen(true)} variant="outline" size="sm" className="h-9 gap-1.5 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30">
                <LayoutTemplate className="h-3.5 w-3.5" />
                {t("workflowTemplates.newFromTemplate") || "From Template"}
              </Button>
            </Permission>
            <Permission permission="workflow:create">
              <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                <PlusCircle className="h-4 w-4" />
                {t("workflows.createWorkflow")}
              </Button>
            </Permission>
          </div>
        </div>

        {/* ── Workflow cards ──────────────────────────────────────────────── */}
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
              <WorkflowIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">{t("workflows.noWorkflowsYet")}</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">{t("workflows.getStartedMessage")}</p>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" variant="outline" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              {t("workflows.createFirstWorkflow")}
            </Button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No workflows match</p>
            <p className="text-xs text-muted-foreground">"{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredWorkflows.map((workflow, i) => {
                const activeCount = (workflow.versions || []).filter(v => v.is_active).length;
                const versionCount = (workflow.versions || []).length;
                const usedBy = subworkflowUsage[workflow.id] || [];

                return (
                  <motion.div
                    key={workflow.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                  >
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`wf-${workflow.id}`} className="border-0">
                        <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-border/70 hover:shadow-sm hover:shadow-black/5 dark:hover:shadow-black/20">

                          {/* Left accent bar — active = emerald, inactive = blue/indigo */}
                          <div className={cn(
                            'h-0.5 w-full bg-gradient-to-r',
                            activeCount > 0 ? 'from-amber-400 to-orange-500' : 'from-muted to-muted'
                          )} />

                          {/* Card header / accordion trigger */}
                          <AccordionTrigger className="px-4 py-3.5 hover:no-underline [&>svg]:hidden w-full text-left group/trigger">
                            <div className="flex items-center justify-between w-full gap-4">
                              {/* Left: icon + name + description */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                                  activeCount > 0
                                    ? 'bg-amber-500/10 border border-amber-500/20'
                                    : 'bg-muted border border-border'
                                )}>
                                  <WorkflowIcon className={cn('h-4 w-4', activeCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate leading-tight group-hover/trigger:text-primary transition-colors">
                                    {workflow.name}
                                  </p>
                                  {workflow.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">{workflow.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Right: meta badges + actions + chevron */}
                              <div className="flex items-center gap-2.5 flex-shrink-0">
                                {usedBy.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800" title={`Used by: ${usedBy.map(w => w.name).join(', ')}`}>
                                    <Layers className="h-2.5 w-2.5" />
                                    {usedBy.length} parent{usedBy.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <GitBranch className="h-3.5 w-3.5" />
                                  <span className="tabular-nums">{versionCount}</span>
                                </div>
                                {activeCount > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {t("workflows.active")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                    <Circle className="h-2.5 w-2.5" />
                                    {t("workflows.inactive")}
                                  </span>
                                )}

                                {/* Inline actions */}
                                <div className="flex items-center gap-0.5 border-l border-border pl-2.5 ml-0.5">
                                  <Permission permission="workflow:read">
                                    <button
                                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleExport(workflow.id, workflow.name); }}
                                      title="Export"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  </Permission>
                                  <Permission permission="workflow:delete">
                                    <button
                                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); deleteWorkflow(workflow.id); }}
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </Permission>
                                </div>

                                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                              </div>
                            </div>
                          </AccordionTrigger>

                          {/* Versions panel */}
                          <AccordionContent className="border-t border-border">
                            <div className="px-4 py-3.5 bg-muted/20">
                              {/* Versions header */}
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("workflows.versions")}</span>
                                <Permission permission="workflow:update">
                                  <button
                                    onClick={() => createWorkflowVersion(workflow.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                                  >
                                    <Copy className="h-3 w-3" />
                                    {t("workflows.createNewVersion")}
                                  </button>
                                </Permission>
                              </div>

                              {/* Versions table */}
                              <div className="rounded-lg border border-border overflow-hidden bg-card">
                                {/* Header row */}
                                <div className="grid grid-cols-[72px_1fr_110px_160px] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/50">
                                  <span>Ver.</span>
                                  <span>Description</span>
                                  <span>Status</span>
                                  <span className="text-right">Actions</span>
                                </div>
                                {[workflow, ...(workflow.versions || [])]
                                  .sort((a, b) => b.version - a.version)
                                  .map((version, idx, arr) => (
                                    <div
                                      key={version.id}
                                      className={cn(
                                        'grid grid-cols-[72px_1fr_110px_160px] items-center px-4 py-2.5 transition-colors hover:bg-muted/40',
                                        idx < arr.length - 1 && 'border-b border-border'
                                      )}
                                    >
                                      {/* Version pill */}
                                      <div>
                                        <span className={cn(
                                          'inline-flex items-center justify-center h-5 px-2 rounded text-[10px] font-bold tabular-nums font-mono',
                                          version.is_active
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        )}>
                                          v{version.version}
                                        </span>
                                      </div>

                                      {/* Description */}
                                      <span className="text-xs text-muted-foreground truncate pr-3">
                                        {version.description || <em className="text-muted-foreground/50 not-italic">{t("workflows.noDescription")}</em>}
                                      </span>

                                      {/* Status */}
                                      <div>
                                        {version.is_active ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            {t("workflows.active")}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Circle className="h-2.5 w-2.5" />
                                            {t("workflows.inactive")}
                                          </span>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Permission permission="workflow:update">
                                          <button
                                            onClick={() => navigate(`/dashboard/workflows/${version.id}`)}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                                          >
                                            <Edit className="h-3 w-3" />
                                            {t("workflows.edit")}
                                          </button>
                                        </Permission>
                                        {version.is_active ? (
                                          <Permission permission="workflow:update">
                                            <button
                                              onClick={() => deactivateWorkflowVersion(version.id)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-800 transition-colors"
                                            >
                                              {t("workflows.deactivate")}
                                            </button>
                                          </Permission>
                                        ) : (
                                          <Permission permission="workflow:update">
                                            <button
                                              onClick={() => activateWorkflowVersion(version.id)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                            >
                                              {t("workflows.activate")}
                                            </button>
                                          </Permission>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </AccordionContent>
                        </div>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Import Workflow Dialog ──────────────────────────────────────── */}
      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Upload className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              {t("workflows.importWorkflow") || "Import Workflow"}
            </DialogTitle>
            <DialogDescription>
              {t("workflows.importDescription") || "Upload a workflow JSON file to import it into your workspace."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="workflow-file" className="text-sm font-medium">
                {t("workflows.selectFile") || "Workflow File"}
              </Label>
              <input
                id="workflow-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-muted file:text-foreground hover:file:bg-muted/70 cursor-pointer"
              />
            </div>

            {importData && (
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex-shrink-0">Name</span>
                    <span className="text-foreground font-medium">{importData.workflow?.name || "Unknown"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-20 flex-shrink-0">Description</span>
                    <span className="text-foreground">{importData.workflow?.description || "—"}</span>
                  </div>
                  {importData.required_tools?.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Tools</span>
                      <span className="text-foreground">{importData.required_tools.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="agent-select" className="text-sm font-medium">
                {t("workflows.selectAgent") || "Assign to Agent"}
              </Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder={t("workflows.selectAgentPlaceholder") || "Select an agent…"} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeImportDialog}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importData || !selectedAgentId || isImporting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isImporting ? (t("common.importing") || "Importing…") : (t("workflows.import") || "Import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowManagementPage;
