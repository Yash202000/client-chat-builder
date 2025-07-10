
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

// Mock data for demonstration
const mockAgents = [
  {
    id: "1",
    name: "Customer Support Bot",
    description: "Handles general customer inquiries and support tickets",
    status: "active",
    lastModified: "2 hours ago",
    conversations: 127,
    website: "acme-corp.com",
    avatar: null
  },
  {
    id: "2", 
    name: "Sales Assistant",
    description: "Helps customers with product information and sales",
    status: "active",
    lastModified: "1 day ago",
    conversations: 89,
    website: "shopify-store.com",
    avatar: null
  },
  {
    id: "3",
    name: "FAQ Helper",
    description: "Answers frequently asked questions about services",
    status: "draft",
    lastModified: "3 days ago",
    conversations: 0,
    website: "tech-startup.io",
    avatar: null
  }
];

export const AgentList = () => {
  const [agents] = useState(mockAgents);

  const handleCopyEmbedCode = (agentId: string, agentName: string) => {
    const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://agentconnect.dev/widget.js';
    script.setAttribute('data-agent-id', '${agentId}');
    document.head.appendChild(script);
  })();
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Embed code copied!",
      description: `Embed code for ${agentName} has been copied to your clipboard.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "inactive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={agent.avatar || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Agent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id, agent.name)}>
                      <Code className="h-4 w-4 mr-2" />
                      Copy Embed Code
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Website: {agent.website}</span>
                <span>•</span>
                <span>{agent.conversations} conversations</span>
              </div>
              <span>Modified {agent.lastModified}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
