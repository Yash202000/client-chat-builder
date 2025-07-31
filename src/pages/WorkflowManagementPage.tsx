import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Edit, Copy, PlusCircle, Trash2 } from 'lucide-react';
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
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {workflows.map((workflow) => (
                <AccordionItem value={`item-${workflow.id}`} key={workflow.id} className="border rounded-lg">
                  <AccordionTrigger className="p-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-lg">{workflow.name}</span>
                        <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); deleteWorkflow(workflow.id)}}>
                            <Trash2 className="h-4 w-4 text-red-500"/>
                        </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t">
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => createWorkflowVersion(workflow.id)}>
                          <Copy className="h-3 w-3 mr-2" />
                          Create New Version
                        </Button>
                      </div>
                      {workflow.versions.sort((a, b) => b.version - a.version).map(version => (
                        <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <span className="font-medium">Version {version.version}</span>
                            <p className="text-sm text-gray-500">{version.description || "No description"}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {version.is_active ? (
                              <Badge>Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/builder/${version.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            {!version.is_active && (
                              <Button size="sm" onClick={() => activateWorkflowVersion(version.id)}>
                                Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkflowManagementPage;
