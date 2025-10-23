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
import { Edit, Copy, PlusCircle, Trash2, WorkflowIcon, Sparkles } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import CreateWorkflowDialog from '@/components/CreateWorkflowDialog'; // Assuming this component exists

const WorkflowManagementPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      toast.error("Failed to load workflows.");
    }
  }, [authFetch]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreateWorkflow = async ({ name, description }) => {
    const newWorkflowPayload = { name, description, agent_id: 1 };
    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflowPayload),
      });
      if (!response.ok) throw new Error('Creation failed');
      toast.success(`Workflow "${name}" created.`);
      fetchWorkflows(); // Refresh the list
    } catch (error) {
      toast.error(`Creation failed: ${error.message}`);
    }
  };

  const createWorkflowVersion = async (workflowId) => {
    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/versions`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to create new version');
      toast.success("New workflow version created.");
      fetchWorkflows();
    } catch (error) {
      toast.error(`Failed to create version: ${error.message}`);
    }
  };

  const activateWorkflowVersion = async (versionId) => {
    try {
      const response = await authFetch(`/api/v1/workflows/versions/${versionId}/activate`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to activate version');
      toast.success("Workflow version activated.");
      fetchWorkflows();
    } catch (error) {
      toast.error(`Failed to activate version: ${error.message}`);
    }
  };

  const deleteWorkflow = async (workflowId) => {
    if (window.confirm('Are you sure you want to delete this workflow and all its versions?')) {
        try {
            await authFetch(`/api/v1/workflows/${workflowId}`, { method: 'DELETE' });
            toast.success("Workflow and its versions deleted.");
            fetchWorkflows();
        } catch (error) {
            toast.error("Deletion failed.");
        }
    }
  };

  return (
    <>
      <CreateWorkflowDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateWorkflow}
      />
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ⚡ Workflow Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Build and manage automated workflows for your AI agents
              </p>
            </div>
            <Permission permission="workflow:create">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Workflow
              </Button>
            </Permission>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="card-shadow-lg border-l-4 border-l-blue-500 dark:border-l-blue-400 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Workflows</p>
                    <p className="text-2xl font-bold dark:text-white">{workflows.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-lg flex items-center justify-center">
                    <WorkflowIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg border-l-4 border-l-green-500 dark:border-l-green-400 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Versions</p>
                    <p className="text-2xl font-bold dark:text-white">
                      {workflows.reduce((acc, w) => acc + w.versions.filter(v => v.is_active).length, 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg border-l-4 border-l-purple-500 dark:border-l-purple-400 dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Versions</p>
                    <p className="text-2xl font-bold dark:text-white">
                      {workflows.reduce((acc, w) => acc + w.versions.length, 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-lg flex items-center justify-center">
                    <Copy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardTitle className="text-xl dark:text-white">All Workflows</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {workflows.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 mb-4">
                  <WorkflowIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">No workflows yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first workflow</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {workflows.map((workflow) => (
                  <AccordionItem
                    value={`item-${workflow.id}`}
                    key={workflow.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl card-shadow hover:shadow-xl transition-shadow bg-white dark:bg-slate-800 overflow-hidden"
                  >
                    <AccordionTrigger className="p-5 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <WorkflowIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-lg dark:text-white">{workflow.name}</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{workflow.description || "No description"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="mr-2 dark:border-slate-600 dark:text-gray-300">
                            {workflow.versions.length} {workflow.versions.length === 1 ? 'version' : 'versions'}
                          </Badge>
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
                    <AccordionContent className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">VERSIONS</h4>
                          <Permission permission="workflow:update">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createWorkflowVersion(workflow.id)}
                              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                            >
                              <Copy className="h-3 w-3 mr-2" />
                              Create New Version
                            </Button>
                          </Permission>
                        </div>
                        <div className="space-y-2">
                          {workflow.versions.sort((a, b) => b.version - a.version).map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors card-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-8 w-8 rounded-lg flex items-center justify-center font-semibold ${
                                    version.is_active
                                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  v{version.version}
                                </div>
                                <div>
                                  <span className="font-medium dark:text-white">Version {version.version}</span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {version.description || 'No description'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {version.is_active ? (
                                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="dark:bg-slate-700 dark:text-gray-300">Inactive</Badge>
                                )}
                                <Permission permission="workflow:update">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/dashboard/workflows/${version.id}`)}
                                    className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                </Permission>
                                {!version.is_active && (
                                  <Permission permission="workflow:update">
                                    <Button
                                      size="sm"
                                      onClick={() => activateWorkflowVersion(version.id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      Activate
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
    </>
  );
};

export default WorkflowManagementPage;
