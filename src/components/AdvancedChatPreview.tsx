import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { WebChatCustomizer } from './WebChatCustomizer';
import { WhatsappPreview } from './previews/WhatsappPreview';
import { MessengerPreview } from './previews/MessengerPreview';
import { InstagramPreview } from './previews/InstagramPreview';
import { GmailPreview } from './previews/GmailPreview';
import { TelegramPreview } from './previews/TelegramPreview';
import { VoiceAgentPreview } from './previews/VoiceAgentPreview';
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Bot, Loader2, MessageSquare, Mic, Send, User, X } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Agent } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/config/env";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

const initialCustomizationState = {
  primary_color: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)", // AgentConnect gradient
  header_title: "Customer Support",
  welcome_message: "Hi! How can I help you today?",
  position: "bottom-right",
  border_radius: 12,
  font_family: "Inter",
  agent_avatar_url: "",
  input_placeholder: "Type a message...",
  user_message_color: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)", // Gradient for user messages
  user_message_text_color: "#FFFFFF",
  bot_message_color: "#EEF2FF", // Lighter blue background for bot messages
  bot_message_text_color: "#1E293B", // Darker text for better contrast
  time_color: "#9CA3AF", // Time/timestamp color
  widget_size: "medium",
  show_header: true,
  proactive_message_enabled: false,
  proactive_message: "Hello! Do you have any questions?",
  proactive_message_delay: 5,
  suggestions_enabled: false,
  dark_mode: false,
  typing_indicator_enabled: false,
  agent_id: 0,
  livekit_url: '',
  isPreConnectBufferEnabled: false,
  client_website_url: "",
  meta: { z_index: 9999 }, // Flexible meta field for additional customizations
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
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeForm, setActiveForm] = useState<any[] | null>(null);
  const [previewType, setPreviewType] = useState('web');
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
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  useEffect(() => {
    if (previewType === 'voice' && selectedAgentId) {
      const fetchToken = async () => {
        try {
          const response = await authFetch(`/api/v1/video-calls/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              room_name: `agent-${selectedAgentId}-voice-preview`,
              participant_name: `user-${user?.id}`,
              agent_id: String(selectedAgentId),
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setLiveKitToken(data.access_token);
          } else {
            toast({
              title: t('designer.error'),
              description: t('designer.failedGetToken'),
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to fetch voice call token:", error);
          toast({
            title: t('designer.error'),
            description: t('designer.errorGetToken'),
            variant: "destructive",
          });
        }
      };
      fetchToken();
    }
  }, [previewType, selectedAgentId, authFetch, toast, user]);

  useEffect(() => {
    if (selectedAgentId && companyId && isExpanded) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setMessages([]);

      const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/public/${companyId}/${selectedAgentId}/${newSessionId}?user_type=user`;
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
      
      const voiceUrl = `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/public/voice/${companyId}/${selectedAgentId}/${newSessionId}?user_type=user&voice_id=${(customization as any).voice_id || 'default'}&stt_provider=${(customization as any).stt_provider || 'groq'}`;
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
  }, [selectedAgentId, companyId, isExpanded, customization.welcome_message]);

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
    if (!selectedAgentId || !user) return;

    const fetchWidgetSettings = async () => {
      try {
        const response = await authFetch(`/api/v1/agents/${selectedAgentId}/widget-settings`);
        if (response.ok) {
          const data = await response.json();
          const newSessionId = generateSessionId();
          setCustomization({ ...initialCustomizationState, ...data, agent_id: selectedAgentId, backendUrl: BACKEND_URL, companyId: user.company_id, sessionId: newSessionId });
        }
      } catch (error) {
        console.error("Failed to fetch widget settings:", error);
        setCustomization({ ...initialCustomizationState, agent_id: selectedAgentId });
      }
    };
    fetchWidgetSettings();
  }, [selectedAgentId, user]);

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
          title: t('designer.success'),
          description: t('designer.widgetSettingsSaved'),
        });
      } else {
        const errorData = await response.json();
        toast({
          title: t('designer.error'),
          description: `${t('designer.failedSaveSettings')}: ${errorData.detail || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save widget settings:", error);
      toast({
        title: t('designer.error'),
        description: t('designer.unexpectedError'),
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    if (!selectedAgentId) return;
    try {
      const response = await authFetch(`/api/v1/agents/${selectedAgentId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customization)
      });
      if (response.ok) {
        const data = await response.json();
        setPublishedUrl(`${window.location.origin}/preview/${data.publish_id}`);
        setIsPublishDialogOpen(true);
      } else {
        const errorData = await response.json();
        toast({
          title: t('designer.error'),
          description: `${t('designer.failedPublish')}: ${errorData.detail || 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to publish:", error);
      toast({
        title: t('designer.error'),
        description: t('designer.errorPublishing'),
        variant: "destructive",
      });
    }
  };

  const generateEmbedCode = () => {
    if (!selectedAgentId || !companyId) return "";
    const scriptSrc = `${BACKEND_URL}/widget/widget.js`;

    return `<!-- AgentConnect Widget Container -->
<div id="agentconnect-widget"></div>
    
<!-- AgentConnect Widget Script -->
<script
  id="agent-connect-widget-script"
  src="${scriptSrc}"
  data-agent-id="${selectedAgentId}"
  data-company-id="${companyId}"
  data-backend-url="${BACKEND_URL}"
  defer>
</script>`;
  };

  const { width, height } = widgetSizes[customization.widget_size as keyof typeof widgetSizes];

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Customization (2/3 width) */}
        <div className="xl:col-span-2">
          {previewType === 'web' && (
            <WebChatCustomizer
              customization={customization}
              updateCustomization={updateCustomization}
              handleSaveChanges={handleSaveChanges}
              handlePublish={handlePublish}
              generateEmbedCode={generateEmbedCode}
              toast={toast}
              selectedAgentId={selectedAgentId}
              agents={agents}
              onAgentChange={setSelectedAgentId}
              previewType={previewType}
              onPreviewTypeChange={setPreviewType}
            />
          )}
        </div>

        {/* Right Column - Live Preview (1/3 width) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 card-shadow-lg">
              <h3 className={`text-xl font-bold dark:text-white mb-2 flex items-center gap-2`}>
                <span className="text-2xl">👁️</span>
                {t('designer.livePreview')}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-6">{t('designer.livePreviewDesc')}</p>

              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 p-4 rounded-xl relative overflow-hidden border-2 border-slate-300 dark:border-slate-600 shadow-xl" style={{ fontFamily: customization.font_family, width: width + 40, height: height + 80 }}>
            {customization.client_website_url && (
              <iframe
                src={customization.client_website_url}
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Client Website Preview"
              />
            )}
              {previewType === 'web' && (
                <div className={`absolute`} style={{ [customization.position.split('-')[0]]: '20px', [customization.position.split('-')[1]]: '20px' }}>
                  {isExpanded ? (
                    <div className="bg-white rounded-lg shadow-2xl flex flex-col animate-scale-in" style={{ width, height, borderRadius: `${customization.border_radius}px`, backgroundColor: customization.dark_mode ? '#1a1a1a' : '#fff' }}>
                      {customization.show_header && (
                        <div className="text-white p-3 flex items-center justify-between" style={{ background: customization.primary_color, borderTopLeftRadius: `${customization.border_radius}px`, borderTopRightRadius: `${customization.border_radius}px` }}>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage key={customization.agent_avatar_url} src={`${BACKEND_URL}/api/v1/proxy/image-proxy?url=${encodeURIComponent(customization.agent_avatar_url)}`} alt="Agent" />
                              <AvatarFallback style={{ background: customization.primary_color.includes('gradient') ? customization.primary_color : `${customization.primary_color}20` }}>
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
                            <div className={cn('max-w-[85%] p-3 flex flex-col')} style={{ background: msg.sender === 'user' ? customization.user_message_color : customization.bot_message_color, color: msg.sender === 'user' ? customization.user_message_text_color : customization.bot_message_text_color, borderRadius: `${customization.border_radius}px` }}>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-transparent text-xs">
                                      {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold">{msg.sender === 'agent' ? 'Agent' : 'You'}</span>
                                </div>
                                <span className="text-xs" style={{ color: customization.time_color || (customization.dark_mode ? '#9CA3AF' : '#6B7280') }}>
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
                          <Button size="icon" onClick={() => handleSendMessage()} style={{ background: customization.primary_color, color: 'white' }}>
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
                      style={{ background: customization.primary_color }}
                      onClick={() => setIsExpanded(true)}
                    >
                      {customization.agent_avatar_url ? <img src={`${BACKEND_URL}/api/v1/proxy/image-proxy?url=${encodeURIComponent(customization.agent_avatar_url)}`} className="h-full w-full rounded-full object-contain"  /> : <MessageSquare className="h-8 w-8 text-white" />}
                    </Button>
                  )}
                </div>
              )}
              {previewType === 'whatsapp' && <WhatsappPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
              {previewType === 'messenger' && <MessengerPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
              {previewType === 'instagram' && <InstagramPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
              {previewType === 'gmail' && <GmailPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
              {previewType === 'telegram' && <TelegramPreview messages={messages} customization={customization} handleSendMessage={handleSendMessage} message={message} setMessage={setMessage} isRecording={isRecording} handleToggleRecording={handleToggleRecording} />}
              {previewType === 'voice' && customization.livekit_url && <VoiceAgentPreview liveKitToken={liveKitToken} shouldConnect={shouldConnect} setShouldConnect={setShouldConnect} livekitUrl={customization.livekit_url} customization={customization} backendUrl={BACKEND_URL}/>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('designer.publishedSuccess')}</DialogTitle>
            <DialogDescription>
              {t('designer.publishedDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input
              readOnly
              value={publishedUrl || ""}
              className="w-full"
            />
            <Button
              className="mt-2 w-full"
              onClick={() => {
                navigator.clipboard.writeText(publishedUrl || "");
                toast({ title: t('designer.copiedClipboard') });
              }}
            >
              {t('designer.copyUrl')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};