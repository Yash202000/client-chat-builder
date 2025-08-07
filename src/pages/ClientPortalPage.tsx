import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Agent, ChatMessage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bot, Users } from "lucide-react";

const ClientPortalPage = () => {
  const { authFetch, companyId } = useAuth();

  // Fetch agents for the current company
  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({ 
    queryKey: ['clientAgents', companyId], 
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/agents/?company_id=${companyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch recent conversations for the current company
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<ChatMessage[]>({ 
    queryKey: ['clientConversations', companyId], 
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/conversations/?company_id=${companyId}&limit=10`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  if (isLoadingAgents || isLoadingConversations) return <div>Loading client portal...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Client Portal</h1>
      <p className="text-gray-600">Welcome to your personalized dashboard.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total agents deployed for your company
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Latest interactions with your agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{/* Placeholder for team members */}</div>
            <p className="text-xs text-muted-foreground">
              Users in your company account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Display Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agents && agents.length > 0 ? (
            <ul className="space-y-2">
              {agents.map(agent => (
                <li key={agent.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span>{agent.name}</span>
                  <Badge variant={agent.is_active ? "default" : "secondary"}>
                    {agent.is_active ? "Active" : "Inactive"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p>No agents deployed yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Display Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {conversations && conversations.length > 0 ? (
            <ul className="space-y-2">
              {conversations.map(msg => (
                <li key={msg.id} className="p-3 border rounded-md">
                  <p className="text-sm font-medium">Session: {msg.session_id}</p>
                  <p className="text-xs text-gray-500">{msg.sender}: {msg.message}</p>
                  <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent conversations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalPage;
