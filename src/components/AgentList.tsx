
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Code, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Credential } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentBuilder } from "./AgentBuilder";
import { ConversationDetail } from "./ConversationDetail";

interface ChatMessage {
  id: number;
  message: string;
  sender: string;
  timestamp: string;
}

interface Agent {
  id: number;
  name: string;
  welcome_message: string;
  prompt: string;
  personality?: string;
  language?: string;
  timezone?: string;
  credential_id?: number;
  is_active?: boolean;
}

export const AgentList = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  console.log("AgentList Render - selectedAgent:", selectedAgent, "selectedSessionId:", selectedSessionId);
  const companyId = 1; // Hardcoded company ID for now

  const { data: agents, isLoading, isError } = useQuery<Agent[]>({ queryKey: ['agents', companyId], queryFn: async () => {
    const response = await fetch(`http://localhost:8000/api/v1/agents/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch agents");
    }
    return response.json();
  }});

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<string[]>({ 
    queryKey: ['sessions', selectedAgent?.id, companyId], 
    queryFn: async () => {
      if (!selectedAgent) return [];
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${selectedAgent.id}/sessions`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
    enabled: !!selectedAgent, // Only run this query if an agent is selected
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({ 
    queryKey: ['messages', selectedAgent?.id, selectedSessionId, companyId], 
    queryFn: async () => {
      if (!selectedAgent || !selectedSessionId) return [];
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${selectedAgent.id}/sessions/${selectedSessionId}/messages`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!selectedAgent && !!selectedSessionId, // Only run this query if both agent and session are selected
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

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const response = await fetch(`http://localhost:8000/api/v1/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent deleted successfully!",
        description: "The agent has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete agent",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent updated successfully!",
        description: "The agent details have been updated.",
      });
      setIsEditDialogOpen(false);
      setCurrentAgent(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update agent",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (agent: Agent) => {
    setCurrentAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAgent) {
      updateAgentMutation.mutate({
        ...currentAgent,
        credential_id: currentAgent.credential_id === 0 ? undefined : currentAgent.credential_id, // Ensure 0 is treated as undefined
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setCurrentAgent(prev => prev ? { ...prev, credential_id: value === "null" ? undefined : parseInt(value) } : null);
  };

  const handleCopyEmbedCode = (agentId: number, agentName: string) => {
    const embedCode = `<script id="agent-connect-widget-script" data-agent-id="${agentId}" data-company-id="${companyId}" src="http://localhost:8080/widget.js"></script>`;
    
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed code copied!",
      description: `Embed code for ${agentName} has been copied to your clipboard.`,
    });
  };

  if (isLoading) return <div>Loading agents...</div>;
  if (isError) return <div>Error loading agents.</div>;

  return (
    <div className="space-y-4">
      {selectedAgent && selectedSessionId ? (
        <ConversationDetail
          agentId={selectedAgent.id}
          sessionId={selectedSessionId}
          companyId={companyId}
          onBack={() => setSelectedSessionId(null)}
        />
      ) : selectedAgent ? (
        <div className="space-y-4">
          <Button onClick={() => setSelectedAgent(null)} className="mb-4">
            Back to Agents
          </Button>
          <h3 className="text-2xl font-bold">Conversations for {selectedAgent.name}</h3>
          {isLoadingSessions ? (
            <div>Loading conversations...</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((sessionId) => (
                <Card key={sessionId} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSessionId(sessionId)}>
                  <CardHeader>
                    <CardTitle className="text-lg">Session: {sessionId.substring(0, 8)}...</CardTitle>
                    <CardDescription>Click to view messages</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div>No conversations found for this agent.</div>
          )}
        </div>
      ) : (
        agents?.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAgent(agent)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {agent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>{agent.welcome_message}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {agent.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(agent)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id, agent.name)}>
                        <Code className="h-4 w-4 mr-2" />
                        Copy Embed Code
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your agent
                              and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAgentMutation.mutate(agent.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Prompt: {agent.prompt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chat Agent</DialogTitle>
            <DialogDescription>
              Modify the details of your chat agent.
            </DialogDescription>
          </DialogHeader>
          
          {currentAgent && (
            <AgentBuilder
              agent={currentAgent}
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ['agents'] });
                setIsEditDialogOpen(false);
                setCurrentAgent(null);
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentAgent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
