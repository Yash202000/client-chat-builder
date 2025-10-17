import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Webhook } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Webhook as WebhookIcon } from "lucide-react";

export const AgentWebhooksPage = () => {
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

  const { data: webhooksData, isLoading: isLoadingWebhooks } = useQuery<Webhook[]>({
    queryKey: ['webhooks', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/webhooks/by_agent/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch webhooks');
      return response.json();
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: (newWebhook: Partial<Webhook>) => {
      return authFetch(`/api/v1/webhooks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newWebhook, agent_id: agentId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agentId] });
      toast.success("Webhook created successfully!");
    },
    onError: () => toast.error("Failed to create webhook."),
  });

  const updateWebhookMutation = useMutation({
    mutationFn: (webhook: Webhook) => {
      return authFetch(`/api/v1/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhook),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agentId] });
      toast.success("Webhook updated successfully!");
    },
    onError: () => toast.error("Failed to update webhook."),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: number) => {
      return authFetch(`/api/v1/webhooks/${webhookId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agentId] });
      toast.success("Webhook deleted successfully!");
    },
    onError: () => toast.error("Failed to delete webhook."),
  });

  const handleAddWebhook = () => {
    createWebhookMutation.mutate({
      name: "New Webhook",
      url: "",
      trigger_event: "new_message",
      is_active: false,
    });
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
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Configure webhooks to send agent events to external services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleAddWebhook}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
          <div className="space-y-4">
            {isLoadingWebhooks ? (
              <div>Loading webhooks...</div>
            ) : (
              webhooksData?.map((webhook) => (
                <Card key={webhook.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <WebhookIcon className="h-5 w-5 text-orange-600" />
                        <Input
                          value={webhook.name}
                          onChange={(e) => updateWebhookMutation.mutate({ ...webhook, name: e.target.value })}
                          className="font-medium"
                          placeholder="Webhook name"
                        />
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Webhook URL</Label>
                          <Input
                            value={webhook.url}
                            onChange={(e) => updateWebhookMutation.mutate({ ...webhook, url: e.target.value })}
                            placeholder="https://api.example.com/webhook"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Trigger Event</Label>
                          <select
                            value={webhook.trigger_event}
                            onChange={(e) => updateWebhookMutation.mutate({ ...webhook, trigger_event: e.target.value })}
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            <option value="new_message">New Message</option>
                            <option value="conversation_start">Conversation Start</option>
                            <option value="conversation_end">Conversation End</option>
                            <option value="agent_handoff">Agent Handoff</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateWebhookMutation.mutate({ ...webhook, is_active: !webhook.is_active })}
                      >
                        {webhook.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
