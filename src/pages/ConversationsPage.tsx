import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Session, User } from '@/types';
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Phone, Globe } from 'lucide-react'; // Icons for channels

const ConversationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, token, authFetch, isLoading: isAuthLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const companyId = useMemo(() => user?.company_id, [user]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/conversations/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!companyId,
  });

  const wsUrl = companyId ? `ws://${window.location.host}/api/v1/ws/updates/ws/${companyId}?token=${token}` : null;

  // Connect to the company-wide WebSocket for real-time updates
  useWebSocket(
    wsUrl,
    {
      onMessage: (event) => {
        const eventData = JSON.parse(event.data);
        if (eventData.type === 'new_message') {
          toast({
            title: "New Message",
            description: `New message in session: ${eventData.session.conversation_id}`,
          });
          // Invalidate queries to refetch session list
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          // If the updated session is the one currently selected, invalidate its messages too
          if (selectedSessionId === eventData.session.conversation_id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedSessionId, companyId] });
          }
        }
      },
      enabled: !!wsUrl,
    }
  );

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
      case 'active':
      default:
        return 'secondary';
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'whatsapp': return <Phone className="h-4 w-4 text-green-500" />;
      case 'messenger': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'web':
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading user...</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
      <div className="md:col-span-3 flex flex-col gap-4">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? <p>Loading...</p> : (
              <div className="flex flex-col space-y-2 overflow-y-auto">
                {sessions && sessions.length > 0 ? sessions.filter(session => session.status === 'resolved' || session.status === 'archived'||  session.status === 'active').map((session) => {
                  console.log("Rendering session button for:", session);
                  return (
                  <Button
                    key={session.conversation_id}
                    variant={selectedSessionId === session.conversation_id ? 'secondary' : 'ghost'}
                    onClick={() => setSelectedSessionId(session.conversation_id)}
                    className="h-auto justify-start items-start flex-col"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm truncate">
                      {getChannelIcon(session.channel)}
                      {session.contact_name || session.contact_phone || session.session_id}
                    </div>
                    <div className="flex items-center gap-2 text-xs pl-6">
                      <Badge variant={getStatusBadgeVariant(session.status)}>{session.status}</Badge>
                      {session.status === 'assigned' && <span>to {getAssigneeEmail(session.assignee_id)}</span>}
                    </div>
                  </Button>
                )}) : <p className="text-sm text-gray-500">No active sessions.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-6">
        {selectedSessionId ? (
          <ConversationDetail sessionId={selectedSessionId} agentId={1} /> // agentId is now hardcoded, consider removing dependency
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a conversation to view.</p>
          </div>
        )}
      </div>
      <div className="md:col-span-3">
        {selectedSessionId ? (
          <ContactProfile sessionId={selectedSessionId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a conversation to view contact details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
