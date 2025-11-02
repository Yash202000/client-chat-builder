import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X, Mic, Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetForm } from '@/components/WidgetForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VoiceAgentPreview } from './components/previews/VoiceAgentPreview';

// Type definitions
interface WidgetProps {
  agentId: string;
  companyId: string;
  backendUrl: string;
  rtlOverride?: boolean | null;
  languageOverride?: string | null;
  positionOverride?: string | null;
}

interface WidgetSettings {
  primary_color: string;
  header_title: string;
  welcome_message: string;
  proactive_message: string;
  position: string;
  border_radius: number;
  font_family: string;
  agent_avatar_url: string;
  input_placeholder: string;
  user_message_color: string;
  user_message_text_color: string;
  bot_message_color: string;
  bot_message_text_color: string;
  time_color?: string;
  widget_size: 'small' | 'medium' | 'large';
  show_header: boolean;
  dark_mode: boolean;
  typing_indicator_enabled: boolean;
  proactive_message_enabled: boolean;
  proactive_message_delay: number;
  livekit_url: string;
  frontend_url: string;
  voice_id?: string;
  stt_provider?: string;
  communication_mode: 'chat' | 'voice' | 'chat_and_voice';
  meta?: {
    z_index?: number;
    [key: string]: any; // Allow any additional customizations
  };
}

interface Message {
  id: string | number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  type: 'message' | 'prompt' | 'form' | 'video_call_invitation';
  timestamp: string;
  options?: string[];
  fields?: any[];
  videoCallUrl?: string;
  assignee_name?: string;  // Name of the agent who sent this message
}

const widgetSizes = {
  small: { width: 320, height: 450 },
  medium: { width: 360, height: 550 },
  large: { width: 400, height: 650 },
};

const generateSessionId = () => Date.now(); // milliseconds timestamp

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Helper function to detect browser language
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  // Extract language code (e.g., 'en-US' -> 'en')
  return browserLang.split('-')[0];
};

// Helper function to get language texts from settings
const getLanguageTexts = (settings: WidgetSettings, lang: string) => {
  const languages = settings.meta?.languages;
  if (!languages) {
    // Fallback to old direct fields
    return {
      welcome_message: settings.welcome_message,
      header_title: settings.header_title,
      input_placeholder: settings.input_placeholder,
      proactive_message: settings.proactive_message,
    };
  }

  // Try to get the requested language, fallback to default, then to 'en', then to first available
  const defaultLang = settings.meta?.default_language || 'en';
  return languages[lang] || languages[defaultLang] || languages['en'] || languages[Object.keys(languages)[0]] || {
    welcome_message: settings.welcome_message || "Hi! How can I help you today?",
    header_title: settings.header_title || "Customer Support",
    input_placeholder: settings.input_placeholder || "Type a message...",
    proactive_message: settings.proactive_message || "Hello! Do you have any questions?",
  };
};

// Helper functions for session persistence
const getStorageKey = (agentId: string, companyId: string) =>
  `agentconnect_session_${companyId}_${agentId}`;

const getStoredSession = (agentId: string, companyId: string): { sessionId: string; timestamp: number } | null => {
  try {
    const key = getStorageKey(agentId, companyId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading stored session:', error);
  }
  return null;
};

const storeSession = (agentId: string, companyId: string, sessionId: string | number) => {
  try {
    const key = getStorageKey(agentId, companyId);
    const data = {
      sessionId: String(sessionId),
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

const isSessionExpired = (timestamp: number, expirationDays: number = 30): boolean => {
  const expirationTime = expirationDays * 24 * 60 * 60 * 1000; // days to milliseconds
  return Date.now() - timestamp > expirationTime;
};

// Main Widget Component
const Widget = ({ agentId, companyId, backendUrl, rtlOverride, languageOverride, positionOverride }: WidgetProps) => {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUsingTool, setIsUsingTool] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeForm, setActiveForm] = useState<any[] | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  
  const isProactiveSession = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const voiceWs = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const audioPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  const incomingAudioChunks = useRef<Blob[]>([]);

  // Reconnection state
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);
  const currentSessionId = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Calculate localized texts based on current language
  const currentLanguage = languageOverride || detectBrowserLanguage() || settings?.meta?.default_language || 'en';
  const localizedTexts = settings ? getLanguageTexts(settings, currentLanguage) : null;

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/v1/agents/${agentId}/widget-settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        console.log('AgentConnect Widget: Fetched settings:', data);
        console.log('AgentConnect Widget: Avatar URL:', data.agent_avatar_url);
        console.log('AgentConnect Widget: Header Title:', data.header_title);
        setSettings(data);
      } catch (error) {
        console.error('AgentConnect: Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [agentId, backendUrl]);

  // Proactive message
  useEffect(() => {
    if (settings?.proactive_message_enabled && !isOpen) {
      const timer = setTimeout(() => {
        isProactiveSession.current = true;
        setIsOpen(true);
      }, settings.proactive_message_delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [settings, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear timers helper
  const clearTimers = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  };

  // Start heartbeat to keep connection alive
  const startHeartbeat = () => {
    clearTimers();
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  };

  // Connect to main WebSocket with reconnection
  const connectWebSocket = () => {
    if (!currentSessionId.current || !isOpen) return;

    const wsUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/${companyId}/${agentId}/${currentSessionId.current}?user_type=user`;

    console.log('[Widget] Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[Widget] WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      startHeartbeat();

      // Show welcome message only on first connection (not reconnection)
      if (messages.length === 0) {
        const initialMessageText = isProactiveSession.current
          ? (localizedTexts?.proactive_message || settings?.proactive_message)
          : (localizedTexts?.welcome_message || settings?.welcome_message);
        if (initialMessageText) {
          setMessages([{ id: 'welcome', sender: 'agent', text: initialMessageText, type: 'message', timestamp: new Date().toISOString() }]);
        }
        isProactiveSession.current = false;
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle pong response
      if (data.type === 'pong') return;

      // Handle ping from backend - respond with pong
      if (data.type === 'ping') {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      if (data.message_type === 'typing') {
        setIsTyping(data.is_typing);
        return;
      }

      if (data.message_type === 'tool_use') {
        setIsUsingTool(true);
        return;
      }

      setIsTyping(false);
      setIsUsingTool(false);

      const newMessage: Message = {
        id: data.id || `msg-${Date.now()}`,
        sender: data.sender,
        text: data.message,
        type: data.message_type,
        timestamp: data.timestamp || new Date().toISOString(),
        options: data.options,
        fields: data.fields,
        videoCallUrl: data.message_type === 'video_call_invitation' ? `${settings?.frontend_url}/video-call?token=${data.token}&livekitUrl=${encodeURIComponent(settings?.livekit_url || '')}&sessionId=${currentSessionId.current}` : undefined,
        assignee_name: data.assignee_name  // Include agent name from backend
      };

      setMessages(prev => {
        if (prev.find(msg => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      if (data.message_type === 'form') {
        setActiveForm(data.fields);
      }
    };

    ws.current.onclose = (event) => {
      console.log('[Widget] WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      clearTimers();

      // Attempt to reconnect if widget is still open and should reconnect
      if (shouldReconnect.current && isOpen && reconnectAttempts.current < 10) {
        const delay = Math.min(3000 * (reconnectAttempts.current + 1), 15000); // Max 15 seconds
        console.log(`[Widget] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/10)`);

        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else if (reconnectAttempts.current >= 10) {
        console.error('[Widget] Max reconnection attempts reached');
      }
    };

    ws.current.onerror = (error) => {
      console.error('[Widget] WebSocket error:', error);
    };
  };

  // Connect to voice WebSocket
  const connectVoiceWebSocket = () => {
    if (!currentSessionId.current || settings?.communication_mode !== 'chat_and_voice') return;

    const voiceUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/voice/${companyId}/${agentId}/${currentSessionId.current}?user_type=user&voice_id=${settings?.voice_id || 'default'}&stt_provider=${settings?.stt_provider || 'groq'}`;
    voiceWs.current = new WebSocket(voiceUrl);

    voiceWs.current.onopen = () => {
      console.log('[Widget] Voice WebSocket connected');
    };

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

    voiceWs.current.onclose = () => {
      console.log('[Widget] Voice WebSocket closed');
    };

    voiceWs.current.onerror = (error) => {
      console.error('[Widget] Voice WebSocket error:', error);
    };
  };

  // WebSocket connection management
  useEffect(() => {
    if (isOpen) {
      // Try to retrieve existing session from localStorage
      const storedSession = getStoredSession(agentId, companyId);
      let newSessionId: string | number;

      if (storedSession && !isSessionExpired(storedSession.timestamp)) {
        // Reuse existing session if not expired
        newSessionId = storedSession.sessionId;
        console.log('Resuming existing session:', newSessionId);
      } else {
        // Generate new session and store it
        newSessionId = generateSessionId();
        storeSession(agentId, companyId, newSessionId);
        console.log('Created new session:', newSessionId);
      }

      setSessionId(newSessionId);
      currentSessionId.current = newSessionId;
      shouldReconnect.current = true;
      reconnectAttempts.current = 0;

      if (settings?.communication_mode === 'voice') {
        const fetchToken = async () => {
          try {
            const response = await fetch(`${backendUrl}/api/v1/video-calls/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                room_name: newSessionId,
                participant_name: `User-${newSessionId}`,
                agent_id: agentId,
              }),
            });
            if (!response.ok) throw new Error('Failed to fetch LiveKit token');
            const data = await response.json();
            setLiveKitToken(data.access_token);
          } catch (error) {
            console.error('AgentConnect: Error fetching LiveKit token:', error);
          }
        };
        fetchToken();
        return;
      }

      // Connect WebSocket
      connectWebSocket();

      // Connect voice WebSocket if needed
      if (settings?.communication_mode === 'chat_and_voice') {
        connectVoiceWebSocket();
      }

    } else {
      shouldReconnect.current = false;
      clearTimers();
      ws.current?.close();
      voiceWs.current?.close();
      setLiveKitToken(null);
      setIsConnected(false);
    }

    return () => {
      shouldReconnect.current = false;
      clearTimers();
      ws.current?.close();
      voiceWs.current?.close();
    };
  }, [isOpen, agentId, companyId, backendUrl, settings]);

  const handleSendMessage = (text: string, payload?: any) => {
    const messageText = text.trim();
    if (!messageText && !payload) return;
    const messageToSend = { message: payload || messageText, message_type: 'message', sender: 'user' };
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(messageToSend));
      setInputValue('');
      setMessages(prev => prev.map(m => ({ ...m, options: undefined })));
    }
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

  if (isLoading || !settings || !localizedTexts) return null;
  const { position, primary_color, agent_avatar_url, widget_size, border_radius, dark_mode, show_header, user_message_color, user_message_text_color, bot_message_color, bot_message_text_color, time_color } = settings;

  // Extract localized texts
  const { welcome_message, header_title, input_placeholder, proactive_message } = localizedTexts;

  // Position priority: data-position attribute > meta.position > direct position field > default
  const widgetPosition = positionOverride || settings.meta?.position || position || 'bottom-right';
  const [vertical, horizontal] = widgetPosition.split('-');
  const size = widgetSizes[widget_size] || widgetSizes.medium;

  // RTL can be overridden by embed code data attribute, otherwise check if language is RTL, otherwise use setting from meta
  // Use != null to check for both null and undefined
  const isRTL = rtlOverride != null ? rtlOverride : (RTL_LANGUAGES.includes(currentLanguage) || settings.meta?.rtl_enabled || false);

  return (
  <div style={{ position: 'fixed', zIndex: settings.meta?.z_index || 9999, [vertical]: '20px', [horizontal]: '20px' }}>
    {!isOpen && (
      <div className="relative group">
        {/* Pulsing ring animation */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{
            background: primary_color,
            width: '60px',
            height: '60px',
            animationDuration: '2s',
          }}
        />

        {/* Main button */}
        <Button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: primary_color,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }}
          className="flex items-center justify-center p-0 overflow-hidden relative hover:scale-110 hover:shadow-2xl active:scale-95"
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2), 0 0 24px ${primary_color}80`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';
          }}
        >
          {agent_avatar_url ? (
            <img
              src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
              alt="Avatar"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
              }}
            />
          ) : (
            <MessageSquare size={32} color="white" className="transition-transform duration-300 group-hover:scale-110" />
          )}

          {/* Notification indicator (shows when connected) */}
          {isConnected && (
            <span
              className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"
              style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
            />
          )}
        </Button>

        {/* Tooltip on hover */}
        <div
          className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap"
          style={{
            [horizontal === 'right' ? 'right' : 'left']: '70px',
            [vertical === 'bottom' ? 'bottom' : 'top']: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="px-3 py-2 rounded-lg text-white text-sm font-medium shadow-lg"
            style={{ background: primary_color }}
          >
            {header_title || 'Chat with us'}
          </div>
        </div>
      </div>
    )}

    {isOpen && settings?.communication_mode === 'voice' && liveKitToken && (
      <VoiceAgentPreview
        liveKitToken={liveKitToken}
        shouldConnect={isOpen}
        setShouldConnect={setIsOpen}
        livekitUrl={settings.livekit_url}
        customization={settings}
        backendUrl={backendUrl}
      />
    )}


    {isOpen && settings?.communication_mode !== 'voice' && (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          borderRadius: `${border_radius}px`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          position: 'absolute',
          [vertical === 'bottom' ? 'bottom' : 'top']: '80px',
          [horizontal === 'right' ? 'right' : 'left']: '0',
        }}
        className={cn(
          'flex flex-col overflow-hidden',
          dark_mode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
        )}
      >
        {show_header && (
          <div
            style={{
              background: primary_color,
              borderTopLeftRadius: `${border_radius}px`,
              borderTopRightRadius: `${border_radius}px`,
            }}
            className="p-4 text-white flex justify-between items-center flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              {agent_avatar_url ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-sm absolute inset-0 flex items-center justify-center z-0">
                    {header_title.charAt(0).toUpperCase()}
                  </span>
                  <img
                    src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
                    alt="Header Avatar"
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white/10 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {header_title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-bold text-lg">{header_title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        )}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] p-3 flex flex-col')} style={{ background: msg.sender === 'user' ? user_message_color : bot_message_color, color: msg.sender === 'user' ? user_message_text_color : bot_message_text_color, borderRadius: `${border_radius}px` }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-transparent text-xs">
                        {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">
                      {msg.sender === 'agent' ? (msg.assignee_name || 'Agent') : 'You'}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: time_color || (dark_mode ? '#9CA3AF' : '#6B7280') }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-full">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.options.map((option, index) => (
                      <Button
                        key={index}
                        onClick={() => handleSendMessage(option)}
                        variant="outline"
                        size="sm"
                        className={cn('rounded-full', dark_mode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300')}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                {msg.type === 'video_call_invitation' && (<Button onClick={() => window.open(msg.videoCallUrl, '_blank', 'width=800,height=600')} className="mt-2 w-full" style={{background: primary_color, color: 'white'}}>Join Video Call</Button>)}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-sm text-gray-500 italic px-2">Agent is typing...</div>}
          {isUsingTool && <div className="text-sm text-gray-500 italic px-2">Using a tool...</div>}
          <div ref={messagesEndRef} />
        </div>
        {activeForm ? (<WidgetForm fields={activeForm} onSubmit={handleFormSubmit} primaryColor={primary_color} darkMode={dark_mode} />) : (
          <div className={cn('p-3 border-t', dark_mode ? 'border-gray-800' : 'border-gray-200')}>
            <div className="flex items-center gap-2">
              <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage(inputValue)} placeholder={input_placeholder} className={cn('flex-grow p-2 border rounded-md w-full text-sm', dark_mode ? 'bg-gray-800 border-gray-700 focus:ring-blue-500' : 'bg-white border-gray-300 focus:ring-blue-500')} />
              <Button onClick={() => handleSendMessage(inputValue)} style={{ background: primary_color }} className="text-white rounded-md h-9 w-9 p-0 flex-shrink-0"><Send size={18} /></Button>
                <Button onClick={handleToggleRecording} variant="ghost" size="icon" className={cn('rounded-md h-9 w-9 flex-shrink-0', isRecording && 'text-red-500', dark_mode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>{isRecording ? <Loader2 className="animate-spin" /> : <Mic size={18} />}</Button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
};

export default Widget;
