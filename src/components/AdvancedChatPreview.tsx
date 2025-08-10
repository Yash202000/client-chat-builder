import { useToast } from "@/hooks/use-toast";
import { WebChatCustomizer } from './WebChatCustomizer';
import { WhatsappPreview } from './previews/WhatsappPreview';
import { MessengerPreview } from './previews/MessengerPreview';
import { InstagramPreview } from './previews/InstagramPreview';
import { GmailPreview } from './previews/GmailPreview';
import { TelegramPreview } from './previews/TelegramPreview';
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Bot, Loader2, MessageSquare, Mic, Send, User, X } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

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
  const [previewType, setPreviewType] = useState('web');
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
        
        if (data.sender === 'user') {
          return;
        }

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
      <div>
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

          <div>
            <Label htmlFor="preview-type-selector">Preview Type</Label>
            <select
              id="preview-type-selector"
              value={previewType}
              onChange={(e) => setPreviewType(e.target.value)}
              className="w-full mt-2 p-2 border rounded-md"
            >
              <option value="web">Web Chat</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>
        {previewType === 'web' && (
          <WebChatCustomizer
            customization={customization}
            updateCustomization={updateCustomization}
            handleSaveChanges={handleSaveChanges}
            generateEmbedCode={generateEmbedCode}
            toast={toast}
            selectedAgentId={selectedAgentId}
          />
        )}
      </div>

      <div className="flex flex-col items-center justify-center">
        <Label>Live Preview</Label>
        <div className="mt-2 bg-gradient-to-br from-gray-50 to-gray-200 p-4 rounded-lg relative overflow-hidden" style={{ fontFamily: customization.font_family, width: width + 40, height: height + 80 }}>
            {previewType === 'web' && (
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
            )}
            {previewType === 'whatsapp' && <WhatsappPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
            {previewType === 'messenger' && <MessengerPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
            {previewType === 'instagram' && <InstagramPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
            {previewType === 'gmail' && <GmailPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
            {previewType === 'telegram' && <TelegramPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
        </div>
      </div>
    </div>
  );
};