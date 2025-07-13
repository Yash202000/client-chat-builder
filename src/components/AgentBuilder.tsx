
import { useState, useEffect } from "react";
import { ResourceSelector } from './ResourceSelector';
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Credential, Webhook } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Plus, 
  Trash2, 
  GripVertical,
  Settings,
  Brain,
  Globe,
  Database,
  Webhook as WebhookIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



interface AgentBuilderProps {
  agent: Agent;
  onSave: () => void;
  onCancel: () => void;
}

export const AgentBuilder = ({ agent, onSave, onCancel }: AgentBuilderProps) => {
  console.log("AgentBuilder - agent prop:", agent);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const companyId = 1; // Hardcoded company ID for now

  const [agentConfig, setAgentConfig] = useState(() => {
    if (!agent) {
      return {
        name: "",
        welcome_message: "",
        prompt: "",
        personality: "helpful",
        language: "en",
        timezone: "UTC",
        response_style: "",
        instructions: "",
        credential_id: undefined,
        is_active: true,
        knowledge_base_id: undefined,
        tool_ids: [],
      };
    }
    return {
      name: agent.name,
      welcome_message: agent.welcome_message,
      prompt: agent.prompt,
      personality: agent.personality || "helpful",
      language: agent.language || "en",
      timezone: agent.timezone || "UTC",
      credential_id: agent.credential_id,
      is_active: agent.is_active !== undefined ? agent.is_active : true,
      knowledge_base_id: agent.knowledge_base_id,
      tool_ids: agent.tool_ids || [],
    };
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({ queryKey: ['credentials', companyId], queryFn: async () => {
    const response = await fetch(`http://localhost:8000/api/v1/credentials/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch credentials");
    }
    return response.json();
  }});

  const { data: webhooksData, isLoading: isLoadingWebhooks } = useQuery<Webhook[]>({ 
    queryKey: ['webhooks', agent?.id, companyId], 
    queryFn: async () => {
      if (!agent?.id) return [];
      const response = await fetch(`http://localhost:8000/api/v1/webhooks/by_agent/${agent.id}`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }
      return response.json();
    },
    enabled: !!agent?.id,
  });

  const { data: knowledgeBases, isLoading: isLoadingKnowledgeBases } = useQuery<KnowledgeBase[]>({ queryKey: ['knowledgeBases', companyId], queryFn: async () => {
    const response = await fetch(`http://localhost:8000/api/v1/knowledge-bases/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch knowledge bases");
    }
    return response.json();
  }});

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ queryKey: ['tools', companyId], queryFn: async () => {
    const response = await fetch(`http://localhost:8000/api/v1/tools/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tools");
    }
    return response.json();
  }});

  const [localWebhooks, setLocalWebhooks] = useState<Webhook[]>([]);

  useEffect(() => {
    if (webhooksData) {
      setLocalWebhooks(webhooksData);
    }
  }, [webhooksData]);

  const updateAgentMutation = useMutation({
    mutationFn: async (updatedAgent: Agent) => {
      const response = await fetch(`http://localhost:8000/api/v1/agents/${updatedAgent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
        },
        body: JSON.stringify(updatedAgent),
      });
      if (!response.ok) {
        throw new Error("Failed to update agent");
      }
      return response.json();
    },
    onSuccess: () => {
      onSave();
    },
    onError: (error) => {
      console.error("Failed to update agent:", error);
      // Optionally show a toast or other error feedback
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (newWebhook: Omit<Webhook, "id">) => {
      const response = await fetch(`http://localhost:8000/api/v1/webhooks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
        },
        body: JSON.stringify(newWebhook),
      });
      if (!response.ok) {
        throw new Error("Failed to create webhook");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agent.id] });
    },
    onError: (error) => {
      console.error("Failed to create webhook:", error);
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async (updatedWebhook: Webhook) => {
      const response = await fetch(`http://localhost:8000/api/v1/webhooks/${updatedWebhook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
        },
        body: JSON.stringify(updatedWebhook),
      });
      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agent.id] });
    },
    onError: (error) => {
      console.error("Failed to update webhook:", error);
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: number) => {
      const response = await fetch(`http://localhost:8000/api/v1/webhooks/${webhookId}`, {
        method: "DELETE",
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', agent.id] });
    },
    onError: (error) => {
      console.error("Failed to delete webhook:", error);
    },
  });

  const handleSave = () => {
    updateAgentMutation.mutate({
      id: agent.id,
      ...agentConfig,
      credential_id: agentConfig.credential_id === 0 ? undefined : agentConfig.credential_id,
      knowledge_base_id: agentConfig.knowledge_base_id === 0 ? undefined : agentConfig.knowledge_base_id,
      tool_ids: agentConfig.tool_ids,
    } as Agent);
  };

  useEffect(() => {
    setAgentConfig(prevConfig => ({
      ...prevConfig,
      name: agent.name,
      welcome_message: agent.welcome_message,
      prompt: agent.prompt,
      personality: agent.personality || "helpful",
      language: agent.language || "en",
      timezone: agent.timezone || "UTC",
      response_style: agent.response_style || "",
      instructions: agent.instructions || "",
      credential_id: agent.credential_id,
      is_active: agent.is_active !== undefined ? agent.is_active : true,
      knowledge_base_id: agent.knowledge_base_id,
      tool_ids: agent.tool_ids || [],
    }));
  }, [agent]);

  const addWebhook = () => {
    createWebhookMutation.mutate({
      agent_id: agent.id,
      name: "New Webhook",
      url: "",
      trigger_event: "new_message",
      is_active: false,
    });
  };

  const updateWebhook = (id: number, field: keyof Webhook, value: any) => {
    const webhookToUpdate = webhooksData?.find((w) => w.id === id);
    if (webhookToUpdate) {
      // Map frontend field names to backend field names
      const backendField = field === 'trigger' ? 'trigger_event' : field === 'active' ? 'is_active' : field;
      updateWebhookMutation.mutate({ ...webhookToUpdate, [backendField]: value });
    }
  };

  const removeWebhook = (id: number) => {
    deleteWebhookMutation.mutate(id);
  };

  

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Agent Configuration
          </CardTitle>
          <CardDescription>
            Configure your agent's personality, behavior, and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                        {agentConfig.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        value={agentConfig.name}
                        onChange={(e) => setAgentConfig({...agentConfig, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="personality">Personality</Label>
                    <select
                      id="personality"
                      value={agentConfig.personality}
                      onChange={(e) => setAgentConfig({...agentConfig, personality: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="helpful">Helpful & Professional</option>
                      <option value="friendly">Friendly & Casual</option>
                      <option value="formal">Formal & Business</option>
                      <option value="enthusiastic">Enthusiastic & Energetic</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={agentConfig.language}
                      onChange={(e) => setAgentConfig({...agentConfig, language: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={agentConfig.timezone}
                      onChange={(e) => setAgentConfig({...agentConfig, timezone: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={agentConfig.is_active}
                      onChange={(e) => setAgentConfig({...agentConfig, is_active: e.target.checked})}
                      className="mt-1 ml-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={agentConfig.welcome_message}
                      onChange={(e) => setAgentConfig({...agentConfig, welcome_message: e.target.value})}
                      className="mt-1"
                      rows={3}
                      placeholder="e.g., Hello! How can I help you today?"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Prompt</CardTitle>
                    <CardDescription>
                      Define the agent's core identity, instructions, and constraints. This is the most important part of the agent's configuration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="prompt"
                      value={agentConfig.prompt}
                      onChange={(e) => setAgentConfig({...agentConfig, prompt: e.target.value})}
                      className="mt-1 font-mono"
                      rows={15}
                      placeholder="e.g., You are a helpful AI assistant..."
                    />
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Webhook Integrations</h3>
                <Button onClick={addWebhook} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Webhook
                </Button>
              </div>

              <div className="space-y-4">
                {isLoadingWebhooks ? (
                  <div>Loading webhooks...</div>
                ) : webhooksData && webhooksData.length > 0 ? (
                  <>
                    {webhooksData.map((webhook) => (
                      <Card key={webhook.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <WebhookIcon className="h-5 w-5 text-orange-600" />
                            <Input
                              value={localWebhooks.find(w => w.id === webhook.id)?.name || ''}
                              onChange={(e) => {
                                const updatedWebhooks = localWebhooks.map(w =>
                                  w.id === webhook.id ? { ...w, name: e.target.value } : w
                                );
                                setLocalWebhooks(updatedWebhooks);
                              }}
                              onBlur={(e) => updateWebhook(webhook.id, 'name', e.target.value)}
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
                                value={localWebhooks.find(w => w.id === webhook.id)?.url || ''}
                                onChange={(e) => {
                                  const updatedWebhooks = localWebhooks.map(w =>
                                    w.id === webhook.id ? { ...w, url: e.target.value } : w
                                  );
                                  setLocalWebhooks(updatedWebhooks);
                                }}
                                onBlur={(e) => updateWebhook(webhook.id, 'url', e.target.value)}
                                placeholder="https://api.example.com/webhook"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Trigger Event</Label>
                              <select
                                value={localWebhooks.find(w => w.id === webhook.id)?.trigger_event || ''}
                                onChange={(e) => {
                                  const updatedWebhooks = localWebhooks.map(w =>
                                    w.id === webhook.id ? { ...w, trigger_event: e.target.value } : w
                                  );
                                  setLocalWebhooks(updatedWebhooks);
                                }}
                                onBlur={(e) => updateWebhook(webhook.id, 'trigger_event', e.target.value)}
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
                            onClick={() => {
                              const updatedWebhooks = localWebhooks.map(w =>
                                w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
                              );
                              setLocalWebhooks(updatedWebhooks);
                              updateWebhook(webhook.id, 'is_active', !webhook.is_active);
                            }}
                          >
                            {webhook.is_active ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeWebhook(webhook.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div>No webhooks configured.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <h3 className="text-lg font-semibold">Platform Integrations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Slack", icon: MessageSquare, color: "bg-purple-500", connected: true },
                  { name: "Discord", icon: MessageSquare, color: "bg-indigo-500", connected: false },
                  { name: "Zapier", icon: Zap, color: "bg-orange-500", connected: true },
                  { name: "HubSpot", icon: Database, color: "bg-orange-600", connected: false },
                  { name: "Salesforce", icon: Database, color: "bg-blue-600", connected: false },
                  { name: "Custom API", icon: Globe, color: "bg-gray-500", connected: false }
                ].map((integration) => {
                  const IconComponent = integration.icon;
                  return (
                    <Card key={integration.name} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${integration.color}`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-xs text-gray-500">
                                {integration.connected ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={integration.connected ? "default" : "outline"}>
                            {integration.connected ? "Active" : "Setup"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="tools" className="space-y-6">
              <h3 className="text-lg font-semibold">Tool Selection</h3>
              <ResourceSelector
                resources={tools || []}
                selectedIds={agentConfig.tool_ids || []}
                onSelect={(ids) => setAgentConfig({ ...agentConfig, tool_ids: ids })}
                title="Select Tools"
                triggerButtonText="Browse Tools"
                isLoading={isLoadingTools}
                allowMultiple
              />
              <Button variant="outline" onClick={() => navigate("/dashboard/tools")}>
                Manage Tools
              </Button>
            </TabsContent>

            <TabsContent value="knowledge-base" className="space-y-6">
              <h3 className="text-lg font-semibold">Knowledge Base</h3>
              <ResourceSelector
                resources={knowledgeBases || []}
                selectedIds={agentConfig.knowledge_base_id ? [agentConfig.knowledge_base_id] : []}
                onSelect={(ids) => setAgentConfig({ ...agentConfig, knowledge_base_id: ids[0] })}
                title="Select Knowledge Base"
                triggerButtonText="Browse Knowledge Bases"
                isLoading={isLoadingKnowledgeBases}
                allowMultiple={false}
              />
              <Button variant="outline" onClick={() => navigate("/dashboard/knowledge-base/manage")}>
                Manage Knowledge Bases
              </Button>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-6">
              <h3 className="text-lg font-semibold">Credential Management</h3>
              <ResourceSelector
                resources={credentials || []}
                selectedIds={agentConfig.credential_id ? [agentConfig.credential_id] : []}
                onSelect={(ids) => setAgentConfig({ ...agentConfig, credential_id: ids[0] })}
                title="Select Credential"
                triggerButtonText="Browse Credentials"
                isLoading={isLoadingCredentials}
                allowMultiple={false}
              />
              <Button variant="outline" onClick={() => navigate("/dashboard/vault")}>
                Manage Credentials
              </Button>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={updateAgentMutation.isPending}>
              {updateAgentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
