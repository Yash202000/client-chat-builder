
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Agent, Session } from "@/types";
import { ConversationDetail } from "./ConversationDetail";
import { 
  MessageSquare, 
  Search,
  Inbox,
  User,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";


export const ConversationManager = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const companyId = 1; // Hardcoded company ID
  const { authFetch } = useAuth();

  // Mock function to get sessions - replace with your actual API call
  async function getSessions(agentId: number, companyId: number): Promise<Session[]> {
    const response = await authFetch(`http://localhost:8000/api/v1/conversations/${agentId}/sessions`);
    if (!response.ok) {
      throw new Error("Failed to fetch sessions");
    }
    return response.json();
  }

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({ 
    queryKey: ['agents', companyId], 
    queryFn: async () => {
      const response = await authFetch(`http://localhost:8000/api/v1/agents/`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    }
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({ 
    queryKey: ['sessions', selectedAgentId, companyId], 
    queryFn: () => getSessions(selectedAgentId!, companyId),
    enabled: !!selectedAgentId,
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(session => 
        session.session_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [sessions, searchQuery]);

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <div className="h-full w-full flex flex-row bg-white rounded-lg border overflow-hidden shadow-sm">
      {/* Left Column: Session List */}
      <div className="w-1/4 border-r flex flex-col bg-gray-50 min-h-0">
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoadingSessions ? (
            <p className="p-4 text-gray-500">Loading sessions...</p>
          ) : filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "p-4 border-b cursor-pointer transition-colors",
                  selectedSessionId === session.session_id 
                    ? "bg-blue-100 border-l-4 border-l-blue-600"
                    : "hover:bg-gray-100"
                )}
                onClick={() => handleSessionSelect(session.session_id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white"><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm truncate text-gray-800">{session.session_id}</p>
                      <span className="text-xs text-gray-500">{new Date(session.last_message_timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={session.status === 'resolved' ? 'secondary' : 'default'} className="capitalize">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Inbox className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No sessions found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: Conversation Detail */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedAgentId && selectedSessionId ? (
          <ConversationDetail agentId={selectedAgentId} sessionId={selectedSessionId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-700">Select a conversation</h3>
              <p className="mt-1 text-sm text-gray-500">Choose a conversation from the list to see the messages.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Contact/Agent Details */}
      <div className="w-1/4 border-l flex flex-col bg-gray-50 p-4 space-y-6 min-h-0 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800">Details</h3>
        {selectedAgentId && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Agent Info</h4>
              <div className="space-y-3">
                 <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{agents?.find(a => a.id === selectedAgentId)?.name}</span>
                </div>
              </div>
            </div>
        )}
        {selectedSessionId && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Session Info</h4>
              <div className="space-y-3">
                 <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedSessionId}</span>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
