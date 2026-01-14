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
import { Edit, Copy, PlusCircle, Trash2, WorkflowIcon, Sparkles, Upload, Download, LayoutTemplate, Layers } from 'lucide-react';
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
import CreateWorkflowDialog from '@/components/CreateWorkflowDialog'; // Assuming this component exists
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
      <div className={`container mx-auto p-6 max-w-7xl text-left`}>
        {/* Modern Header */}
        <div className="mb-8">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4`}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <WorkflowIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {t("workflows.title")}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  {t("workflows.subtitle")}
                </p>
              </div>
            </div>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Permission permission="workflow:create">
                <Button
                  onClick={openImportDialog}
                  variant="outline"
                  className={`border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("workflows.importWorkflow") || "Import"}
                </Button>
              </Permission>
              <Permission permission="workflow:create">
                <Button
                  onClick={() => setTemplateModalOpen(true)}
                  variant="outline"
                  className={`border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("workflowTemplates.newFromTemplate") || "From Template"}
                </Button>
              </Permission>
              <Permission permission="workflow:create">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className={`bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("workflows.createWorkflow")}
                </Button>
              </Permission>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <Card className="relative overflow-hidden bg-white dark:bg-slate-800 border-0 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent dark:from-blue-500/10 dark:via-indigo-500/10" />
              <CardContent className="pt-6 pb-5 relative">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t("workflows.totalWorkflows")}</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{workflows.length}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                    <WorkflowIcon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                  All configured workflows
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white dark:bg-slate-800 border-0 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-transparent dark:from-emerald-500/10 dark:via-green-500/10" />
              <CardContent className="pt-6 pb-5 relative">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t("workflows.activeVersions")}</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                      {workflows.reduce((acc, w) => acc + w.versions.filter(v => v.is_active).length, 0)}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Currently running
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white dark:bg-slate-800 border-0 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent dark:from-purple-500/10 dark:via-violet-500/10" />
              <CardContent className="pt-6 pb-5 relative">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t("workflows.totalVersions")}</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                      {workflows.reduce((acc, w) => acc + w.versions.length, 0)}
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                  All versions combined
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 py-5">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">{t("workflows.allWorkflows")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {workflows.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-6 shadow-lg shadow-blue-500/30">
                  <WorkflowIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{t("workflows.noWorkflowsYet")}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">{t("workflows.getStartedMessage")}</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("workflows.createFirstWorkflow")}
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-3">
                {workflows.map((workflow) => (
                  <AccordionItem
                    value={`item-${workflow.id}`}
                    key={workflow.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-200 bg-white dark:bg-slate-800 overflow-hidden group"
                  >
                    <AccordionTrigger className="p-5 hover:no-underline hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className={`flex justify-between items-center w-full`}>
                        <div className={`flex items-center gap-4`}>
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                            <WorkflowIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className='text-left'>
                            <span className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{workflow.name}</span>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{workflow.description || t("workflows.noDescription")}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2`}>
                          {subworkflowUsage[workflow.id] && subworkflowUsage[workflow.id].length > 0 && (
                            <Badge
                              variant="secondary"
                              className={`${isRTL ? 'ml-2' : 'mr-2'} bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-700`}
                              title={`${t("workflows.usedAsSubworkflowBy") || "Used as subworkflow by"}: ${subworkflowUsage[workflow.id].map(w => w.name).join(', ')}`}
                            >
                              <Layers className="h-3 w-3 mr-1" />
                              {subworkflowUsage[workflow.id].length}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`${isRTL ? 'ml-2' : 'mr-2'} dark:border-slate-600 dark:text-gray-300`}>
                            {workflow.versions.length} {workflow.versions.length === 1 ? t("workflows.version") : t("workflows.versionsPlural")}
                          </Badge>
                          <Permission permission="workflow:read">
                            <div
                              role="button"
                              aria-label="Export workflow"
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport(workflow.id, workflow.name);
                              }}
                            >
                              <Download className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            </div>
                          </Permission>
                          <Permission permission="workflow:delete">
                            <div
                              role="button"
                              aria-label="Delete workflow"
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWorkflow(workflow.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                            </div>
                          </Permission>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-5 border-t border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/30 dark:to-slate-800/30">
                      <div className="space-y-3">
                        <div className={`flex justify-between items-center mb-4`}>
                          <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t("workflows.versions")}</h4>
                          <Permission permission="workflow:update">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createWorkflowVersion(workflow.id)}
                              className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center"
                            >
                              <Copy className={`h-3 w-3 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t("workflows.createNewVersion")}
                            </Button>
                          </Permission>
                        </div>
                        <div className="space-y-2">
                          {/* Always include parent workflow as version 1, plus any child versions */}
                          {[workflow, ...workflow.versions]
                            .sort((a, b) => b.version - a.version)
                            .map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <div className={`flex items-center gap-3`}>
                                <div
                                  className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                    version.is_active
                                      ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-500/25'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  v{version.version}
                                </div>
                                <div className='text-left'>
                                  <span className="font-medium text-slate-900 dark:text-white">{t("workflows.versionLabel", { number: version.version })}</span>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {version.description || t("workflows.noDescription")}
                                  </p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                {version.is_active ? (
                                  <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {t("workflows.active")}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-0">{t("workflows.inactive")}</Badge>
                                )}
                                <Permission permission="workflow:update">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/dashboard/workflows/${version.id}`)}
                                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center"
                                  >
                                    <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t("workflows.edit")}
                                  </Button>
                                </Permission>
                                {version.is_active ? (
                                  <Permission permission="workflow:update">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deactivateWorkflowVersion(version.id)}
                                      className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200"
                                    >
                                      {t("workflows.deactivate")}
                                    </Button>
                                  </Permission>
                                ) : (
                                  <Permission permission="workflow:update">
                                    <Button
                                      size="sm"
                                      onClick={() => activateWorkflowVersion(version.id)}
                                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-all duration-200"
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
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Workflow Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t("workflows.importWorkflow") || "Import Workflow"}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t("workflows.importDescription") || "Upload a workflow JSON file to import it into your workspace."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="workflow-file" className="dark:text-gray-300">
                {t("workflows.selectFile") || "Workflow File"}
              </Label>
              <input
                id="workflow-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/50 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {/* Preview imported workflow info */}
            {importData && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-sm mb-2 dark:text-white">{t("workflows.preview") || "Preview"}</h4>
                <div className="text-sm space-y-1">
                  <p className="dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-500">{t("workflows.name") || "Name"}:</span>{" "}
                    {importData.workflow?.name || "Unknown"}
                  </p>
                  <p className="dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-500">{t("workflows.description") || "Description"}:</span>{" "}
                    {importData.workflow?.description || "No description"}
                  </p>
                  {importData.required_tools?.length > 0 && (
                    <p className="dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-500">{t("workflows.requiredTools") || "Required Tools"}:</span>{" "}
                      {importData.required_tools.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Agent Selection */}
            <div className="space-y-2">
              <Label htmlFor="agent-select" className="dark:text-gray-300">
                {t("workflows.selectAgent") || "Assign to Agent"}
              </Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder={t("workflows.selectAgentPlaceholder") || "Select an agent..."} />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()} className="dark:text-white dark:hover:bg-slate-700">
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeImportDialog} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importData || !selectedAgentId || isImporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
