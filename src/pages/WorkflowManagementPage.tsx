import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Permission } from "@/components/Permission";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit, Copy, PlusCircle, Trash2, WorkflowIcon, Sparkles, Upload, Download, LayoutTemplate, Layers, Search, GitBranch, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
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

      <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Top header bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <WorkflowIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                    {t("workflows.title")}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("workflows.subtitle")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Permission permission="workflow:create">
                  <Button
                    onClick={openImportDialog}
                    variant="outline"
                    className="h-9 px-4 text-sm border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    {t("workflows.importWorkflow") || "Import"}
                  </Button>
                </Permission>
                <Permission permission="workflow:create">
                  <Button
                    onClick={() => setTemplateModalOpen(true)}
                    variant="outline"
                    className="h-9 px-4 text-sm border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <LayoutTemplate className="h-4 w-4 mr-1.5" />
                    {t("workflowTemplates.newFromTemplate") || "From Template"}
                  </Button>
                </Permission>
                <Permission permission="workflow:create">
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-9 px-4 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md shadow-blue-500/30"
                  >
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    {t("workflows.createWorkflow")}
                  </Button>
                </Permission>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("workflows.totalWorkflows"), value: workflows.length, sub: "Total workflows", icon: WorkflowIcon, gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", accent: "bg-blue-500" },
              { label: t("workflows.activeVersions"), value: activeVersionCount, sub: "Currently deployed", icon: CheckCircle2, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20", accent: "bg-emerald-500" },
              { label: t("workflows.totalVersions"), value: totalVersionCount, sub: "Across all workflows", icon: GitBranch, gradient: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/20", accent: "bg-purple-500" },
            ].map(({ label, value, sub, icon: Icon, gradient, shadow, accent }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ${shadow}`}>
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${accent}`} />
                  <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow list */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{t("workflows.allWorkflows")}</span>
                {workflows.length > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">{workflows.length}</span>
                )}
              </div>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                  <WorkflowIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("workflows.noWorkflowsYet")}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-5">{t("workflows.getStartedMessage")}</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  size="sm"
                  className="h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md shadow-blue-500/30"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  {t("workflows.createFirstWorkflow")}
                </Button>
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No workflows match <span className="font-medium">"{searchQuery}"</span></p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWorkflows.map((workflow) => {
                  const activeCount = (workflow.versions || []).filter(v => v.is_active).length;
                  const versionCount = (workflow.versions || []).length;
                  const usedBy = subworkflowUsage[workflow.id] || [];

                  return (
                    <AccordionItem
                      value={`item-${workflow.id}`}
                      key={workflow.id}
                      className="border-0 group"
                    >
                      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors [&>svg]:hidden">
                        <div className="flex items-center justify-between w-full gap-4">
                          {/* Left: icon + info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                              <WorkflowIcon className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{workflow.name}</p>
                              {workflow.description && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-sm">{workflow.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Right: meta + actions */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {usedBy.length > 0 && (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded"
                                title={`Used by: ${usedBy.map(w => w.name).join(', ')}`}
                              >
                                <Layers className="h-3 w-3" />
                                {usedBy.length} parent{usedBy.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <GitBranch className="h-3.5 w-3.5" />
                              <span>{versionCount} {versionCount === 1 ? t("workflows.version") : t("workflows.versionsPlural")}</span>
                            </div>
                            {activeCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t("workflows.active")}
                              </span>
                            )}
                            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                              <Permission permission="workflow:read">
                                <button
                                  aria-label="Export workflow"
                                  className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); handleExport(workflow.id, workflow.name); }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </Permission>
                              <Permission permission="workflow:delete">
                                <button
                                  aria-label="Delete workflow"
                                  className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); deleteWorkflow(workflow.id); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </Permission>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="pt-3">
                          {/* Versions header */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("workflows.versions")}</span>
                            <Permission permission="workflow:update">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => createWorkflowVersion(workflow.id)}
                                className="h-7 text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                              >
                                <Copy className="h-3 w-3 mr-1.5" />
                                {t("workflows.createNewVersion")}
                              </Button>
                            </Permission>
                          </div>

                          {/* Versions table */}
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                            {/* Table header */}
                            <div className="grid grid-cols-[80px_1fr_120px_180px] text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                              <span>Version</span>
                              <span>Description</span>
                              <span>Status</span>
                              <span className="text-right">Actions</span>
                            </div>
                            {[workflow, ...workflow.versions]
                              .sort((a, b) => b.version - a.version)
                              .map((version, idx, arr) => (
                                <div
                                  key={version.id}
                                  className={`grid grid-cols-[80px_1fr_120px_180px] items-center px-4 py-3 ${idx < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center justify-center h-6 w-10 rounded text-xs font-bold tabular-nums ${version.is_active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                      v{version.version}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate pr-4">
                                    {version.description || <span className="text-slate-300 dark:text-slate-600 italic">{t("workflows.noDescription")}</span>}
                                  </span>
                                  <div>
                                    {version.is_active ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {t("workflows.active")}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                        <Circle className="h-3 w-3" />
                                        {t("workflows.inactive")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Permission permission="workflow:update">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/dashboard/workflows/${version.id}`)}
                                        className="h-6 px-2.5 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        {t("workflows.edit")}
                                      </Button>
                                    </Permission>
                                    {version.is_active ? (
                                      <Permission permission="workflow:update">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => deactivateWorkflowVersion(version.id)}
                                          className="h-6 px-2.5 text-xs border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                        >
                                          {t("workflows.deactivate")}
                                        </Button>
                                      </Permission>
                                    ) : (
                                      <Permission permission="workflow:update">
                                        <Button
                                          size="sm"
                                          onClick={() => activateWorkflowVersion(version.id)}
                                          className="h-6 px-2.5 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/30 border-0"
                                        >
                                          {t("workflows.activate")}
                                        </Button>
                                      </Permission>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>

      {/* Import Workflow Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t("workflows.importWorkflow") || "Import Workflow"}</DialogTitle>
            <DialogDescription className="dark:text-slate-400 text-sm">
              {t("workflows.importDescription") || "Upload a workflow JSON file to import it into your workspace."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="workflow-file" className="text-sm dark:text-slate-300">
                {t("workflows.selectFile") || "Workflow File"}
              </Label>
              <input
                id="workflow-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            {importData && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t("workflows.preview") || "Preview"}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">Name</span><span className="text-slate-700 dark:text-slate-200 font-medium">{importData.workflow?.name || "Unknown"}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">Description</span><span className="text-slate-700 dark:text-slate-200">{importData.workflow?.description || "—"}</span></div>
                  {importData.required_tools?.length > 0 && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">Tools</span><span className="text-slate-700 dark:text-slate-200">{importData.required_tools.join(", ")}</span></div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="agent-select" className="text-sm dark:text-slate-300">
                {t("workflows.selectAgent") || "Assign to Agent"}
              </Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <SelectValue placeholder={t("workflows.selectAgentPlaceholder") || "Select an agent..."} />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={closeImportDialog} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importData || !selectedAgentId || isImporting}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900"
            >
              {isImporting ? (t("common.importing") || "Importing...") : (t("workflows.import") || "Import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowManagementPage;
