
import { useState } from "react";
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
  UserPlus
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Conversation {
  id: string;
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

interface Message {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    customer: { name: "John Smith", email: "john@example.com" },
    status: "open",
    priority: "high",
    lastMessage: "I need help with my account",
    timestamp: "2 min ago",
    assignedAgent: "Sarah Johnson",
    tags: ["billing", "urgent"],
    unreadCount: 3
  },
  {
    id: "2",
    customer: { name: "Emily Davis", email: "emily@example.com" },
    status: "pending",
    priority: "medium",
    lastMessage: "Thanks for the help!",
    timestamp: "1 hour ago",
    tags: ["support"],
    unreadCount: 0
  }
];

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "customer",
    content: "Hi, I'm having trouble accessing my account",
    timestamp: "10:30 AM",
    type: "text"
  },
  {
    id: "2",
    sender: "agent",
    content: "I'd be happy to help you with that. Can you provide your email address?",
    timestamp: "10:32 AM",
    type: "text"
  },
  {
    id: "3",
    sender: "customer",
    content: "Sure, it's john@example.com",
    timestamp: "10:33 AM",
    type: "text"
  }
];

export const ConversationManager = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-[800px] flex bg-white rounded-lg border overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Conversations</h3>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-y-auto h-full">
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                selectedConversation === conv.id ? 'bg-white border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {conv.customer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(conv.priority)}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{conv.customer.name}</h4>
                    <span className="text-xs text-gray-500">{conv.timestamp}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(conv.status)}`}>
                        {conv.status}
                      </Badge>
                      {conv.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedConv.customer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConv.customer.name}</h3>
                    <p className="text-sm text-gray-600">{selectedConv.customer.email}</p>
                  </div>
                  <Badge className={getStatusColor(selectedConv.status)}>
                    {selectedConv.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'agent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                </div>
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Sidebar */}
      <div className="w-80 border-l bg-gray-50 p-4">
        {selectedConv && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Customer Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedConv.customer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedConv.customer.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Conversation Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Snooze
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Previous Conversations</h4>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded border text-sm">
                  <p className="text-gray-600">No previous conversations</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
