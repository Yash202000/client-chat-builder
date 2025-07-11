
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Archive, 
  Star, 
  Clock, 
  User, 
  Send,
  Paperclip,
  MoreHorizontal,
  Tag,
  Phone,
  Video,
  UserPlus,
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, ChatMessage } from "@/types";

interface Conversation {
  id: number;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'open' | 'pending' | 'resolved' | 'snoozed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage: string;
  timestamp: string;
  assignedAgent?: string;
  tags: string[];
  unreadCount: number;
}

export const ConversationManager = () => {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const companyId = 1; // Hardcoded company ID for now

  const { data: agents, isLoading: isLoadingAgents, isError: isErrorAgents } = useQuery<Agent[]>({ queryKey: ['agents', companyId], queryFn: async () => {
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

  const { data: chatMessages, isLoading: isLoadingMessages, isError: isErrorMessages } = useQuery<ChatMessage[]>({ queryKey: ['chatMessages', selectedAgentId, "test_session", companyId], queryFn: async () => {
    if (!selectedAgentId) return [];
    const response = await fetch(`http://localhost:8000/api/v1/conversations/${selectedAgentId}/sessions/test_session/messages`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch chat messages");
    }
    return response.json();
  }, enabled: !!selectedAgentId});

  useEffect(() => {
    if (selectedAgentId) {
      if (ws.current) {
        ws.current.close();
      }
      ws.current = new WebSocket(`ws://localhost:8000/ws/conversations/ws/${companyId}/${selectedAgentId}/test_session`);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.current.onmessage = (event) => {
        // Invalidate the chatMessages query to refetch the latest messages
        queryClient.invalidateQueries(['chatMessages', selectedAgentId, "test_session"]);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedAgentId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = () => {
    if (ws.current && message.trim() && selectedAgentId) {
      ws.current.send(message);
      // Invalidate the chatMessages query to refetch the latest messages
      queryClient.invalidateQueries(['chatMessages', selectedAgentId, "test_session"]);
      setMessage("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-gray-100 text-gray-800";
      case "snoozed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoadingAgents) return <div>Loading agents...</div>;
  if (isErrorAgents) return <div>Error loading agents.</div>;

  const selectedAgent = agents?.find(agent => agent.id === selectedAgentId);

  return (
    <div className="h-[800px] flex bg-white rounded-lg border overflow-hidden shadow-xl">
      {/* Conversations List (Agents List) */}
      <div className="w-1/3 border-r bg-gradient-to-b from-gray-50 to-white">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Available Agents</h3>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 transition-colors"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs bg-white/70 backdrop-blur-sm">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">Inactive</TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white">Draft</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-y-auto h-full">
          {agents?.filter(agent => agent.name.toLowerCase().includes(searchQuery.toLowerCase())).map((agent) => (
            <div
              key={agent.id}
              className={`p-4 border-b cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                selectedAgentId === agent.id ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-l-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedAgentId(agent.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {agent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor("medium")} shadow-lg`}></div> {/* Placeholder for priority */}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{agent.name}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{new Date(agent.id).toLocaleTimeString()}</span> {/* Using agent.id as a mock timestamp */}
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">{agent.welcome_message}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs shadow-sm ${getStatusColor("open")}`}> {/* Placeholder for status */}
                        Active
                      </Badge>
                      {/* {conv.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full shadow-sm">
                          {tag}
                        </span>
                      ))} */}
                    </div>
                    {/* {conv.unreadCount > 0 && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs animate-pulse shadow-lg">
                        {conv.unreadCount}
                      </Badge>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-white to-gray-50 shadow-sm flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200 shadow-md">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {selectedAgent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedAgent.name}</h3>
                    <p className="text-sm text-gray-600">{selectedAgent.welcome_message}</p>
                  </div>
                  <Badge className={`${getStatusColor("open")} shadow-sm`}> {/* Placeholder for status */}
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="hover:bg-green-50 hover:border-green-300 transition-colors">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-purple-50 hover:border-purple-300 transition-colors">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-gray-50 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50 min-h-0">
              {chatMessages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md ${
                      msg.sender === "user"
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === "user" ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white shadow-inner flex-shrink-0">
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" className="hover:bg-gray-50 transition-colors">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="min-h-[60px] resize-none border-gray-200 focus:border-blue-400 transition-colors"
                  />
                </div>
                <Button onClick={sendMessage} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-gray-700">Select an agent to start chatting</p>
              <p className="text-sm text-gray-500 mt-2">Choose from your available agents to begin messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Sidebar (Agent Details) */}
      <div className="w-80 border-l bg-gradient-to-b from-gray-50 to-white p-4">
        {selectedAgent && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Agent Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedAgent.name}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedAgent.welcome_message}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedAgent.prompt}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <Tag className="h-4 w-4 mr-2" />
                  Edit Agent
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-green-50 hover:border-green-300 transition-colors">
                  <UserPlus className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-yellow-50 hover:border-yellow-300 transition-colors">
                  <Clock className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-gray-50 transition-colors">
                  <Archive className="h-4 w-4 mr-2" />
                  Delete Agent
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Related Conversations</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border text-sm">
                  <p className="text-gray-600">No related conversations found</p>
                  <p className="text-xs text-gray-500 mt-1">This agent has no past conversations</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
