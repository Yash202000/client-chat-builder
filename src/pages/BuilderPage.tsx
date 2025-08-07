
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

const BuilderPage = () => {
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
      toast({ title: "New agent version created!" });
    },
    onError: (error) => {
      toast({ title: "Failed to create new version", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ['agent', data.id] });
      toast({ title: `Agent version ${data.version_number} activated!` });
      setIsHistoryDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Failed to activate version", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div>Loading agent...</div>;
  if (isError) return <div>Error loading agent.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
            Agent Builder
          </h2>
          <p className="text-gray-600 mt-1">Design conversation flows with drag-and-drop interface</p>
        </div>
        <div className="flex space-x-2">
          {agentId && agent && (
            <Button variant="outline" onClick={() => createNewVersionMutation.mutate(agent.id)} disabled={createNewVersionMutation.isPending}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {createNewVersionMutation.isPending ? "Creating Version..." : "Create New Version"}
            </Button>
          )}
          {agentId && (
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              Version History
            </Button>
          )}
          {!agentId && (
            <Button onClick={() => setIsCreateAgentDialogOpen(true)}>
              Create New Agent
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
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="mb-4 text-lg text-gray-600">Select an agent to begin</p>
          {isLoadingAgents ? (
            <p>Loading agents...</p>
          ) : (
            <Select onValueChange={(value) => navigate(`/dashboard/builder/${value}`)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select an agent" />
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
      )}

      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />

      {/* Version History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History for {agent?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingHistory ? (
            <div>Loading history...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentHistory?.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>{version.version_number}</TableCell>
                    <TableCell>{version.status}</TableCell>
                    <TableCell>{new Date(version.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {version.status !== "active" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => activateVersionMutation.mutate(version.id)}
                          disabled={activateVersionMutation.isPending}
                        >
                          {activateVersionMutation.isPending ? "Activating..." : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuilderPage;
