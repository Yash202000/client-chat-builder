import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const AgentPromptPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const [prompt, setPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    if (agent) {
      setPrompt(agent.prompt);
      setWelcomeMessage(agent.welcome_message);
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (updatedAgent: Partial<Agent>) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAgent),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success("Agent updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update agent.");
    },
  });

  const handleSave = () => {
    mutation.mutate({ prompt, welcome_message: welcomeMessage });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Agent Hub
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Prompt & Welcome Message</CardTitle>
          <CardDescription>Define the agent's core identity and initial greeting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="prompt" className="text-lg">System Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 font-mono"
              rows={15}
              placeholder="e.g., You are a helpful AI assistant..."
            />
          </div>
          <div>
            <Label htmlFor="welcomeMessage" className="text-lg">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="mt-2"
              rows={3}
              placeholder="e.g., Hello! How can I help you today?"
            />
          </div>
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
