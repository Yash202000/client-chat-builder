
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AgentBuilder } from "@/components/AgentBuilder";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@/types";

const BuilderPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);
  const companyId = localStorage.getItem("companyId");
  const { authFetch } = useAuth();

  const { data: agent, isLoading, isError } = useQuery<Agent>({
    queryKey: ['agent', agentId, companyId],
    queryFn: async () => {
      if (!agentId) return null;
      const response = await authFetch(`http://localhost:8000/api/v1/agents/${agentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agent");
      }
      return response.json();
    },
    enabled: !!agentId,
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
        {!agentId && (
          <Button onClick={() => setIsCreateAgentDialogOpen(true)}>
            Create New Agent
          </Button>
        )}
      </div>

      {agentId && agent ? (
        <AgentBuilder
          agent={agent}
          onSave={() => { /* Handle save, e.g., navigate back or show toast */ }}
          onCancel={() => { /* Handle cancel, e.g., navigate back */ }}
        />
      ) : !agentId && (
        <p>Select an agent from the list or create a new one to start building.</p>
      )}

      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />
    </div>
  );
};

export default BuilderPage;
