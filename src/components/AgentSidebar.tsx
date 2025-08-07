
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { useState } from "react";

export const AgentSidebar = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { authFetch } = useAuth();
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await authFetch("/api/v1/agents/");
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      return response.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Agents</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsCreateAgentDialogOpen(true)}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? (
        <p>Loading agents...</p>
      ) : (
        <div className="space-y-2">
          {agents?.map((agent) => (
            <Link key={agent.id} to={`/dashboard/builder/${agent.id}`}>
              <Button
                variant={agent.id === Number(agentId) ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                {agent.name}
              </Button>
            </Link>
          ))}
        </div>
      )}
      <CreateAgentDialog
        open={isCreateAgentDialogOpen}
        onOpenChange={setIsCreateAgentDialogOpen}
      />
    </div>
  );
};
