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
import { API_BASE_URL } from "@/config/api";

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
    const backendUrl = API_BASE_URL;
    const embedCode = `<script
    src="${backendUrl}/widget/widget.js"
    id="agent-connect-widget-script"
    data-agent-id="${agentId}"
    data-company-id="${companyId}"
    data-backend-url="${backendUrl}">
</script>
<div id="agentconnect-widget"></div>`;
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
    <>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Agents</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {agents?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Active</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {agents?.filter(a => a.status === 'active').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Inactive</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {agents?.filter(a => a.status !== 'active').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <span className="text-2xl">💤</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table Card */}
      <Card className="card-shadow bg-white dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl dark:text-white">Your Agents</CardTitle>
              <CardDescription className="text-base">Manage and view your AI agents</CardDescription>
            </div>
            <Button
              onClick={() => navigate('/dashboard/builder')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white btn-hover-lift"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead className="font-semibold dark:text-gray-300">Agent Name</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">LLM Provider</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">Model</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-right font-semibold dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents?.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white border-2 border-white dark:border-slate-700 shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold dark:text-white">{agent.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{agent.prompt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-sm font-medium">
                        {agent.llm_provider}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      <span className="text-sm font-medium">{agent.model_name}</span>
                    </TableCell>
                    <TableCell>
                      {agent.status === 'active' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setSelectedAgent(agent)} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Conversations
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/builder/${agent.id}`)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id)} className="cursor-pointer">
                            <Code className="h-4 w-4 mr-2" />
                            Copy Embed Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-slate-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-gray-400">
                                  This will permanently delete the agent "{agent.name}" and all its data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="dark:bg-slate-700 dark:text-gray-300">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteAgentMutation.mutate(agent.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
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
          </div>
        </CardContent>
      </Card>
    </>
  );
};