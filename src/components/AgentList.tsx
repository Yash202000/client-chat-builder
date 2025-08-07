import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Code, PlusCircle, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Session } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { ConversationDetail } from "./ConversationDetail";

export const AgentList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { authFetch, user } = useAuth();
  const companyId = user?.company_id;

  const { data: agents, isLoading, isError } = useQuery<Agent[]>({
    queryKey: ['agents', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', selectedAgent?.id],
    queryFn: async () => {
      if (!selectedAgent) return [];
      const response = await authFetch(`/api/v1/conversations/${selectedAgent.id}/sessions`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    enabled: !!selectedAgent,
  });

  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: number) => authFetch(`/api/v1/agents/${agentId}`, { method: "DELETE" }),
    onSuccess: (res) => {
      if (!res.ok) throw new Error('Failed to delete agent');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({ title: "Agent deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete agent",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCopyEmbedCode = (agentId: number) => {
    const embedCode = `<script id="agent-connect-widget-script" data-agent-id="${agentId}" data-company-id="${companyId}" src="${import.meta.env.VITE_BACKEND_URL}/widget.js"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: "Embed code copied!" });
  };

  if (isLoading) return <div>Loading agents...</div>;
  if (isError) return <div>Error loading agents.</div>;

  if (selectedAgent && selectedSessionId) {
    return <ConversationDetail agentId={selectedAgent.id} sessionId={selectedSessionId} />;
  }

  if (selectedAgent) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Conversations for {selectedAgent.name}</CardTitle>
            <Button onClick={() => setSelectedAgent(null)} variant="outline">
              Back to Agents
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div>Loading conversations...</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.filter(s => s.conversation_id).map((session) => (
                <Card key={session.conversation_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSessionId(session.conversation_id)}>
                  <CardHeader>
                    <CardTitle className="text-lg">Session: {session.conversation_id.substring(0, 8)}...</CardTitle>
                    <CardDescription>Status: <Badge variant={session.status === 'resolved' ? 'default' : 'secondary'}>{session.status}</Badge></CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No conversations found for this agent.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Agents</CardTitle>
            <CardDescription>Manage and view your AI agents.</CardDescription>
          </div>
          <Button onClick={() => navigate('/dashboard/builder')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead>LLM Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents?.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{agent.prompt}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{agent.llm_provider}</TableCell>
                <TableCell>{agent.model_name}</TableCell>
                <TableCell>
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedAgent(agent)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Conversations
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/builder/${agent.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id)}>
                        <Code className="h-4 w-4 mr-2" />
                        Copy Embed Code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-500">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the agent and all its data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAgentMutation.mutate(agent.id)} className="bg-red-500 hover:bg-red-600">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};