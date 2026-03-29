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

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {/* Back nav */}
      <button
        onClick={() => navigate(`/dashboard/builder/${agentId}`)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Agent
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* System Prompt */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">System Prompt</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Define the agent's core identity and behavior</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
              {prompt.length} chars
            </span>
          </div>
          <div className="p-4">
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="font-mono text-xs min-h-[320px] resize-y bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-emerald-500/50"
              placeholder="You are a helpful AI assistant..."
            />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">Welcome Message</h2>
            <p className="text-xs text-muted-foreground mt-0.5">The initial greeting shown to users</p>
          </div>
          <div className="p-4">
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="text-sm min-h-[120px] resize-y bg-background border-border text-foreground placeholder:text-muted-foreground/50"
              placeholder="Hello! How can I help you today?"
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          size="sm"
          className="h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
