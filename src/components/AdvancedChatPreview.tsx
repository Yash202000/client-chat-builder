
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Minimize2, X, Palette, Code, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types";

// Assuming companyId is 1 for now
const companyId = 1;

export const AdvancedChatPreview = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [customization, setCustomization] = useState({
    primary_color: "#3B82F6",
    header_title: "Customer Support",
    welcome_message: "Hi! How can I help you today?",
    position: "bottom-right",
    border_radius: 12,
    font_family: "Inter",
    agent_id: 0
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: customization.welcome_message,
      sender: "bot",
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/agents/`, {
          headers: {
            "X-Company-ID": companyId.toString(),
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data)
          setAgents(data);
          if (data.length > 0) {
            setSelectedAgentId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;

    const fetchWidgetSettings = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/agents/${selectedAgentId}/widget-settings`);
        if (response.ok) {
          const data = await response.json();
          setCustomization(data);
        }
      } catch (error) {
        console.error("Failed to fetch widget settings:", error);
      }
    };
    fetchWidgetSettings();
  }, [selectedAgentId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user" as const,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thanks for your message! Our team will get back to you shortly.",
        sender: "bot" as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const updateCustomization = (key: string, value: string | number) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
    if (key === "welcome_message") {
      setMessages([{
        id: 1,
        text: value as string,
        sender: "bot",
        timestamp: new Date()
      }]);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedAgentId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/agents/${selectedAgentId}/widget-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customization)
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Widget settings saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save widget settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save widget settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const generateEmbedCode = () => {
    if (!selectedAgentId) return "";
    return `<script id="agent-connect-widget-script" data-agent-id="${selectedAgentId}" data-company-id="${companyId}" src="http://localhost:8080/widget.js"></script>`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customization Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Widget Customization
            </div>
            <Button onClick={handleSaveChanges} disabled={!selectedAgentId}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardTitle>
          <CardDescription>
            Customize your chat widget appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agent-selector">Select Agent</Label>
              <select
                id="agent-selector"
                value={selectedAgentId ?? ""}
                onChange={(e) => setSelectedAgentId(parseInt(e.target.value))}
                className="w-full mt-2 p-2 border rounded-md"
              >
                <option value="" disabled>Select an agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <input
                      type="color"
                      id="primary_color"
                      value={customization.primary_color}
                      onChange={(e) => updateCustomization("primary_color", e.target.value)}
                      className="w-12 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={customization.primary_color}
                      onChange={(e) => updateCustomization("primary_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="border_radius">Border Radius</Label>
                  <Input
                    id="border_radius"
                    type="range"
                    min="0"
                    max="24"
                    value={customization.border_radius}
                    onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <span className="text-sm text-gray-500">{customization.border_radius}px</span>
                </div>

                <div>
                  <Label htmlFor="font_family">Font Family</Label>
                  <select
                    id="font_family"
                    value={customization.font_family}
                    onChange={(e) => updateCustomization("font_family", e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="header_title">Header Title</Label>
                  <Input
                    id="header_title"
                    value={customization.header_title}
                    onChange={(e) => updateCustomization("header_title", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome_message">Welcome Message</Label>
                  <Input
                    id="welcome_message"
                    value={customization.welcome_message}
                    onChange={(e) => updateCustomization("welcome_message", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="position">Widget Position</Label>
                  <select
                    id="position"
                    value={customization.position}
                    onChange={(e) => updateCustomization("position", e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="embed" className="space-y-4 pt-4">
                <div>
                  <Label>Embed Code</Label>
                  <div className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{generateEmbedCode()}</pre>
                  </div>
                  <Button 
                    className="mt-2 w-full"
                    onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
                    disabled={!selectedAgentId}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Copy Embed Code
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your widget will look on client websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg min-h-[500px] relative overflow-hidden"
            style={{ fontFamily: customization.font_family }}
          >
            {/* Simulated website background */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-4 opacity-75">
              <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Chat Widget */}
            <div className={`absolute ${customization.position.includes('bottom') ? 'bottom-6' : 'top-6'} ${customization.position.includes('right') ? 'right-6' : 'left-6'}`}>
              {isExpanded ? (
                <div 
                  className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col animate-scale-in"
                  style={{ borderRadius: `${customization.border_radius}px` }}
                >
                  {/* Header */}
                  <div 
                    className="text-white p-4 flex items-center justify-between"
                    style={{ 
                      backgroundColor: customization.primary_color,
                      borderRadius: `${customization.border_radius}px ${customization.border_radius}px 0 0`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: `${customization.primary_color}20` }}>
                          CS
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{customization.header_title}</div>
                        <div className="text-xs opacity-90">Online</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 p-1 h-6 w-6"
                        onClick={() => setIsExpanded(false)}
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 p-1 h-6 w-6"
                        onClick={() => setIsExpanded(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.sender === "user"
                              ? "text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                          style={msg.sender === "user" ? { backgroundColor: customization.primary_color } : {}}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage}
                        style={{ backgroundColor: customization.primary_color }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: customization.primary_color }}
                  onClick={() => setIsExpanded(true)}
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
