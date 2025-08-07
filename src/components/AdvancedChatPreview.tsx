import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Send, X, Palette, Code, Save, Loader2, Mic, Bot, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from '@/lib/utils';

const initialCustomizationState = {
  primary_color: "#3B82F6",
  header_title: "Customer Support",
  welcome_message: "Hi! How can I help you today?",
  position: "bottom-right",
  border_radius: 12,
  font_family: "Inter",
  agent_avatar_url: "",
  input_placeholder: "Type a message...",
  user_message_color: "#3B82F6",
  user_message_text_color: "#FFFFFF",
  bot_message_color: "#E0E7FF",
  bot_message_text_color: "#1F2937",
  widget_size: "medium",
  show_header: true,
  proactive_message_enabled: false,
  proactive_message: "Hello! Do you have any questions?",
  proactive_message_delay: 5,
  suggestions_enabled: false,
  dark_mode: false,
  typing_indicator_enabled: false,
  agent_id: 0
};

const widgetSizes = {
  small: { width: 300, height: 400 },
  medium: { width: 350, height: 500 },
  large: { width: 400, height: 600 },
};

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  type?: 'message' | 'prompt' | 'form' | 'video_call_invitation';
  options?: string[];
  fields?: any[];
  videoCallUrl?: string;
}

const generateSessionId = () => `preview_session_${Math.random().toString(36).substring(2, 15)}`;

export const AdvancedChatPreview = () => {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeForm, setActiveForm] = useState<any[] | null>(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  const [isRecording, setIsRecording] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [message, setMessage] = useState("");
  const [customization, setCustomization] = useState(initialCustomizationState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { authFetch, user } = useAuth();
  const companyId = user?.company_id;
  const ws = useRef<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceWs = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  const incomingAudioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (selectedAgentId && companyId && isExpanded) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setMessages([]);

      const wsUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/${companyId}/${selectedAgentId}/${newSessionId}?user_type=user`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (customization.welcome_message) {
          setMessages([{ id: 'welcome', sender: 'agent', text: customization.welcome_message, timestamp: new Date().toISOString() }]);
        }
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newMessage: ChatMessage = {
          id: data.id || `msg-${Date.now()}`,
          sender: data.sender,
          text: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          type: data.message_type,
          options: data.options,
          fields: data.fields,
        };
        
        setMessages(prev => {
            if (prev.find(msg => msg.id === newMessage.id)) {
                return prev;
            }
            return [...prev, newMessage];
        });
      };

      ws.current.onclose = () => {};
      ws.current.onerror = (error) => console.error("Chat preview WebSocket error:", error);
      
      const voiceUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/voice/${companyId}/${selectedAgentId}/${newSessionId}?user_type=user&voice_id=${(customization as any).voice_id || 'default'}&stt_provider=${(customization as any).stt_provider || 'groq'}`;
      voiceWs.current = new WebSocket(voiceUrl);

      voiceWs.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          incomingAudioChunks.current.push(event.data);
          if (audioPlaybackTimer.current) clearTimeout(audioPlaybackTimer.current);
          audioPlaybackTimer.current = setTimeout(() => {
            if (incomingAudioChunks.current.length > 0) {
              const fullAudioBlob = new Blob(incomingAudioChunks.current, { type: 'audio/webm' });
              const audioUrl = URL.createObjectURL(fullAudioBlob);
              new Audio(audioUrl).play();
              incomingAudioChunks.current = [];
            }
          }, 300);
        }
      };

    } else {
      ws.current?.close();
      voiceWs.current?.close();
    }

    return () => {
      ws.current?.close();
      voiceWs.current?.close();
    };
  }, [selectedAgentId, companyId, isExpanded, backendUrl, customization.welcome_message]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = (text?: string, payload?: any) => {
    const messageText = text || message.trim();
    if ((!messageText && !payload) || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const messageToSend = { message: payload || messageText, message_type: 'message', sender: 'user' };
    ws.current.send(JSON.stringify(messageToSend));
    
    // Add user message to the UI immediately
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      sender: 'user',
      text: payload ? 'Form submitted' : messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    setMessage('');
    setMessages(prev => prev.map(m => ({ ...m, options: undefined })));
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    handleSendMessage('Form submitted', data);
    setActiveForm(null);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        setIsRecording(true);
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];
        
        mediaRecorder.current.ondataavailable = e => {
          if (e.data.size > 0 && voiceWs.current?.readyState === WebSocket.OPEN) {
            voiceWs.current.send(e.data);
          }
        };

        mediaRecorder.current.onstop = () => {
            const finalBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            if (voiceWs.current?.readyState === WebSocket.OPEN) {
                voiceWs.current.send(finalBlob);
            }
            audioChunks.current = [];
        };

        mediaRecorder.current.start(500);
      }).catch(err => console.error("Mic access error:", err));
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await authFetch(`/api/v1/agents/`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
          if (data.length > 0) {
            setSelectedAgentId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };
    if(user) fetchAgents();
  }, [user]);

  useEffect(() => {
    if (!selectedAgentId) return;

    const fetchWidgetSettings = async () => {
      try {
        const response = await authFetch(`/api/v1/agents/${selectedAgentId}/widget-settings`);
        if (response.ok) {
          const data = await response.json();
          setCustomization({ ...initialCustomizationState, ...data, agent_id: selectedAgentId });
        }
      } catch (error) {
        console.error("Failed to fetch widget settings:", error);
        setCustomization({ ...initialCustomizationState, agent_id: selectedAgentId });
      }
    };
    fetchWidgetSettings();
  }, [selectedAgentId]);

  const updateCustomization = (key: string, value: string | number | boolean) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    if (!selectedAgentId) return;
    try {
      const settingsToSave = { ...customization };
      delete (settingsToSave as any).id;

      const response = await authFetch(`/api/v1/agents/${selectedAgentId}/widget-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave)
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Widget settings saved successfully.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Failed to save widget settings: ${errorData.detail || 'Unknown error'}`,
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
    if (!selectedAgentId || !companyId) return "";
    const scriptSrc = `${backendUrl}/widget.js`;

    return `<!-- AgentConnect Widget Container -->
<div id="agentconnect-widget"></div>

<!-- AgentConnect Widget Script -->
<script 
  id="agent-connect-widget-script"
  src="${scriptSrc}" 
  data-agent-id="${selectedAgentId}" 
  data-company-id="${companyId}"
  data-backend-url="${backendUrl}"
  defer>
</script>`;
  };

  const { width, height } = widgetSizes[customization.widget_size as keyof typeof widgetSizes];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            Select an agent and customize the chat widget. Changes are shown live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior & Embed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="space-y-4 pt-4">
              <h4 className="font-semibold">Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="color" id="primary_color" value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                    <Input value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_message_color">User Message</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="color" id="user_message_color" value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                    <Input value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_message_text_color">User Text</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="color" id="user_message_text_color" value={customization.user_message_text_color} onChange={(e) => updateCustomization("user_message_text_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                    <Input value={customization.user_message_text_color} onChange={(e) => updateCustomization("user_message_text_color", e.target.value)} />
                  </div>
                </div>
                 <div>
                  <Label htmlFor="bot_message_color">Bot Message</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="color" id="bot_message_color" value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                    <Input value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bot_message_text_color">Bot Text</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="color" id="bot_message_text_color" value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                    <Input value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} />
                  </div>
                </div>
              </div>
              <h4 className="font-semibold pt-2">Sizing & Style</h4>
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="widget_size">Widget Size</Label>
                  <select id="widget_size" value={customization.widget_size} onChange={(e) => updateCustomization("widget_size", e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="border_radius">Border Radius ({customization.border_radius}px)</Label>
                  <Input id="border_radius" type="range" min="0" max="30" value={customization.border_radius} onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="font_family">Font Family</Label>
                  <select id="font_family" value={customization.font_family} onChange={(e) => updateCustomization("font_family", e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable a dark theme for the widget.
                  </p>
                </div>
                <Switch
                  checked={customization.dark_mode}
                  onCheckedChange={(checked) => updateCustomization("dark_mode", checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 pt-4">
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Show Header</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle the visibility of the widget header.
                  </p>
                </div>
                <Switch
                  checked={customization.show_header}
                  onCheckedChange={(checked) => updateCustomization("show_header", checked)}
                />
              </div>
              <div>
                <Label htmlFor="header_title">Header Title</Label>
                <Input id="header_title" value={customization.header_title} onChange={(e) => updateCustomization("header_title", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Input id="welcome_message" value={customization.welcome_message} onChange={(e) => updateCustomization("welcome_message", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="input_placeholder">Input Placeholder</Label>
                <Input id="input_placeholder" value={customization.input_placeholder} onChange={(e) => updateCustomization("input_placeholder", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="agent_avatar_url">Agent Avatar URL</Label>
                <Input id="agent_avatar_url" value={customization.agent_avatar_url} onChange={(e) => updateCustomization("agent_avatar_url", e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Proactive Message</Label>
                  <p className="text-xs text-muted-foreground">
                    Engage users with a message after a delay.
                  </p>
                </div>
                <Switch
                  checked={customization.proactive_message_enabled}
                  onCheckedChange={(checked) => updateCustomization("proactive_message_enabled", checked)}
                />
              </div>
              {customization.proactive_message_enabled && (
                <div className="space-y-4 pl-4 border-l-2 ml-3">
                  <div>
                    <Label htmlFor="proactive_message">Proactive Message</Label>
                    <Input id="proactive_message" value={customization.proactive_message} onChange={(e) => updateCustomization("proactive_message", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="proactive_message_delay">Delay (seconds)</Label>
                    <Input id="proactive_message_delay" type="number" value={customization.proactive_message_delay} onChange={(e) => updateCustomization("proactive_message_delay", parseInt(e.target.value))} className="mt-1" />
                  </div>
                </div>
              )}
              <div>
                <Label>Embed Code</Label>
                <div className="mt-1 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{generateEmbedCode()}</pre>
                </div>
                <Button className="mt-2 w-full" onClick={() => {
                  navigator.clipboard.writeText(generateEmbedCode());
                  toast({ title: "Copied to clipboard!" });
                }} disabled={!selectedAgentId}>
                  <Code className="h-4 w-4 mr-2" />
                  Copy Embed Code
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>AI Suggestions</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable AI-powered reply suggestions for agents.
                  </p>
                </div>
                <Switch
                  checked={customization.suggestions_enabled}
                  onCheckedChange={(checked) => updateCustomization("suggestions_enabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label>Typing Indicator</Label>
                  <p className="text-xs text-muted-foreground">
                    Show a typing indicator when the agent is responding.
                  </p>
                </div>
                <Switch
                  checked={customization.typing_indicator_enabled}
                  onCheckedChange={(checked) => updateCustomization("typing_indicator_enabled", checked)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center">
        <Label>Live Preview</Label>
        <div className="mt-2 bg-gradient-to-br from-gray-50 to-gray-200 p-4 rounded-lg relative overflow-hidden" style={{ fontFamily: customization.font_family, width: width + 40, height: height + 80 }}>
            <div className={`absolute`} style={{ [customization.position.split('-')[0]]: '20px', [customization.position.split('-')[1]]: '20px' }}>
              {isExpanded ? (
                <div className="bg-white rounded-lg shadow-2xl flex flex-col animate-scale-in" style={{ width, height, borderRadius: `${customization.border_radius}px`, backgroundColor: customization.dark_mode ? '#1a1a1a' : '#fff' }}>
                  {customization.show_header && (
                    <div className="text-white p-3 flex items-center justify-between" style={{ backgroundColor: customization.primary_color, borderTopLeftRadius: `${customization.border_radius}px`, borderTopRightRadius: `${customization.border_radius}px` }}>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage key={customization.agent_avatar_url} src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(customization.agent_avatar_url)}`} alt="Agent" />
                          <AvatarFallback style={{ backgroundColor: `${customization.primary_color}20` }}>
                            {customization.header_title.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{customization.header_title}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 p-1 h-6 w-6" onClick={() => setIsExpanded(false)}><X className="h-4 w-4" /></Button>
                    </div>
                  )}

                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                       <div key={msg.id} className={cn('flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] p-3 flex flex-col')} style={{ backgroundColor: msg.sender === 'user' ? customization.user_message_color : customization.bot_message_color, color: msg.sender === 'user' ? customization.user_message_text_color : customization.bot_message_text_color, borderRadius: `${customization.border_radius}px` }}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-transparent text-xs">
                                  {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold">{msg.sender === 'agent' ? 'Agent' : 'You'}</span>
                            </div>
                            <span className={cn('text-xs', customization.dark_mode ? 'text-gray-400' : 'text-gray-500', msg.sender === 'user' && 'text-opacity-80')}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm break-words">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-2 border-t" style={{borderColor: customization.dark_mode ? '#333' : '#eee'}}>
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={customization.input_placeholder}
                        className="flex-1 text-sm"
                      />
                      <Button size="icon" onClick={() => handleSendMessage()} style={{ backgroundColor: customization.primary_color, color: 'white' }}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleToggleRecording} variant="ghost" size="icon" className={isRecording ? 'text-red-500' : ''}>
                          {isRecording ? <Loader2 className="animate-spin" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                </div>
              ) : (
                <Button
                  className="rounded-full h-16 w-16 shadow-xl hover:scale-110 transition-transform duration-200 flex items-center justify-center"
                  style={{ backgroundColor: customization.primary_color }}
                  onClick={() => setIsExpanded(true)}
                >
                  {customization.agent_avatar_url ? <img src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(customization.agent_avatar_url)}`} className="h-full w-full rounded-full object-contain"  /> : <MessageSquare className="h-8 w-8 text-white" />}
                </Button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};