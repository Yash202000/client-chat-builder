import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Agent, Session, User } from '@/types';
import { useAuth } from "@/hooks/useAuth";

const ConversationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { authFetch } = useAuth(); 

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ['agents', companyId],
    queryFn: async () => {
      const response = await authFetch(`http://localhost:8000/api/v1/agents/`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    },
    onSuccess: (data) => {
      if (!selectedAgentId && data && data.length > 0) {
        setSelectedAgentId(data[0].id);
      }
    }
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await authFetch(`http://localhost:8000/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', selectedAgentId],
    queryFn: async () => {
      if (!selectedAgentId) return [];
      const response = await authFetch(`http://localhost:8000/api/v1/conversations/${selectedAgentId}/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!selectedAgentId,
  });

  useWebSocket(`ws://localhost:8000/ws/${companyId}/${selectedAgentId}/${selectedSessionId}`, {
    onMessage: (event) => {
      const eventData = JSON.parse(event.data);
      toast({
        title: "New Event",
        description: `Type: ${eventData.type}, Session: ${eventData.session_id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['sessions', selectedAgentId] });
      if (selectedSessionId === eventData.session_id) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedAgentId, selectedSessionId, companyId] });
      }
    },
  });

  const getAssigneeEmail = (assigneeId?: number) => {
    if (!assigneeId || !users) return 'N/A';
    const user = users.find(u => u.id === assigneeId);
    return user ? user.email : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'assigned': return 'default';
      case 'resolved': return 'outline';
      case 'bot':
      default:
        return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
      <div className="md:col-span-3 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAgents ? <p>Loading...</p> : (
              <div className="flex flex-col space-y-2">
                {agents?.map((agent) => (
                  <Button
                    key={agent.id}
                    variant={selectedAgentId === agent.id ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setSelectedSessionId(null);
                    }}
                  >
                    {agent.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? <p>Loading...</p> : (
              <div className="flex flex-col space-y-2 overflow-y-auto">
                {sessions && sessions.length > 0 ? sessions.slice(0,10).map((session) => (
                  <Button
                    key={session.session_id}
                    variant={selectedSessionId === session.session_id ? 'secondary' : 'ghost'}
                    onClick={() => setSelectedSessionId(session.session_id)}
                    className="h-auto justify-start items-start flex-col"
                  >
                    <div className="font-bold text-sm truncate">{session.session_id}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={getStatusBadgeVariant(session.status)}>{session.status}</Badge>
                      {session.status === 'assigned' && <span>to {getAssigneeEmail(session.assignee_id)}</span>}
                    </div>
                  </Button>
                )) : <p className="text-sm text-gray-500">No active sessions.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-6">
        {selectedSessionId && selectedAgentId ? (
          <ConversationDetail sessionId={selectedSessionId} agentId={selectedAgentId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a session to view the conversation.</p>
          </div>
        )}
      </div>
      <div className="md:col-span-3">
        {selectedSessionId ? (
          <ContactProfile sessionId={selectedSessionId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a session to view contact details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
