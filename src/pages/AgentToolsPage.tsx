import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Tool } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ResourceSelector } from "@/components/ResourceSelector";

export const AgentToolsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({
    queryKey: ['tools'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/tools/`);
      if (!response.ok) throw new Error('Failed to fetch tools');
      return response.json();
    },
  });

  const [selectedToolIds, setSelectedToolIds] = useState<number[]>([]);

  useEffect(() => {
    if (agent) {
      setSelectedToolIds(agent.tools.map(t => t.id));
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (toolIds: number[]) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_ids: toolIds }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success("Agent tools updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update agent tools.");
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedToolIds);
  };

  if (isLoadingAgent) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agent Hub
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>Select the tools this agent can use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResourceSelector
            resources={tools || []}
            selectedIds={selectedToolIds}
            onSelect={setSelectedToolIds}
            title="Select Tools"
            triggerButtonText="Browse Tools"
            isLoading={isLoadingTools}
            allowMultiple
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
