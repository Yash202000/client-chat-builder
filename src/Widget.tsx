import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X, Mic, Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetForm } from '@/components/WidgetForm';

// Type definitions
interface WidgetProps {
  agentId: string;
  companyId: string;
  backendUrl: string;
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
}

const widgetSizes = {
  small: { width: 320, height: 450 },
  medium: { width: 360, height: 550 },
  large: { width: 400, height: 650 },
};

const generateSessionId = () => `session_${Math.random().toString(36).substring(2, 15)}`;

// Main Widget Component
const Widget = ({ agentId, companyId, backendUrl }: WidgetProps) => {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeForm, setActiveForm] = useState<any[] | null>(null);
  
  const isProactiveSession = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const voiceWs = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const audioPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  const incomingAudioChunks = useRef<Blob[]>([]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/v1/agents/${agentId}/widget-settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
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

  // WebSocket connection management
  useEffect(() => {
    if (isOpen) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);

      const wsUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/${companyId}/${agentId}/${newSessionId}?user_type=user`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        const initialMessageText = isProactiveSession.current ? settings?.proactive_message : settings?.welcome_message;
        if (initialMessageText) {
          setMessages([{ id: 'welcome', sender: 'agent', text: initialMessageText, type: 'message', timestamp: new Date().toISOString() }]);
        }
        isProactiveSession.current = false;
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.message_type === 'typing') {
            setIsTyping(data.is_typing);
            return;
        }
        
        setIsTyping(false);
        const newMessage: Message = {
          id: data.id || `msg-${Date.now()}`,
          sender: data.sender,
          text: data.message,
          type: data.message_type,
          timestamp: data.timestamp || new Date().toISOString(),
          options: data.options,
          fields: data.fields,
          videoCallUrl: data.message_type === 'video_call_invitation' ? `${settings?.frontend_url}/video-call?token=${data.token}&livekitUrl=${encodeURIComponent(settings?.livekit_url || '')}&sessionId=${newSessionId}` : undefined
        };
        if (data.message_type === 'form') setActiveForm(data.fields);
        
        setMessages(prev => {
            if (prev.find(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
        });
      };

      const voiceUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/voice/${companyId}/${agentId}/${newSessionId}?user_type=user&voice_id=${settings?.voice_id || 'default'}&stt_provider=${settings?.stt_provider || 'groq'}`;
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

  if (isLoading || !settings) return null;
  const { position, primary_color, agent_avatar_url, widget_size, border_radius, dark_mode, header_title, show_header, input_placeholder, user_message_color, user_message_text_color, bot_message_color, bot_message_text_color } = settings;
  const [vertical, horizontal] = position.split('-');
  const size = widgetSizes[widget_size] || widgetSizes.medium;

  return (
    <div style={{ position: 'fixed', zIndex: 9999, [vertical]: '20px', [horizontal]: '20px' }}>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: primary_color, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} className="flex items-center justify-center">
          {agent_avatar_url ? <img src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : <MessageSquare size={32} color="white" />}
        </Button>
      )}
      {isOpen && (
        <div style={{ width: `${size.width}px`, height: `${size.height}px`, borderRadius: `${border_radius}px`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'absolute', [vertical === 'bottom' ? 'bottom' : 'top']: '80px', [horizontal === 'right' ? 'right' : 'left']: '0' }} className={cn('flex flex-col overflow-hidden', dark_mode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800')}>
          {show_header && (
            <div style={{ backgroundColor: primary_color, borderTopLeftRadius: `${border_radius}px`, borderTopRightRadius: `${border_radius}px` }} className="p-4 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                {agent_avatar_url && <img src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`} alt="Header Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white/50" />}
                <span className="font-bold text-lg">{header_title}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20"><X className="h-6 w-6" /></Button>
            </div>
          )}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] p-3 flex flex-col')} style={{ backgroundColor: msg.sender === 'user' ? user_message_color : bot_message_color, color: msg.sender === 'user' ? user_message_text_color : bot_message_text_color, borderRadius: `${border_radius}px` }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-transparent text-xs">
                          {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold">{msg.sender === 'agent' ? 'Agent' : 'You'}</span>
                    </div>
                    <span className={cn('text-xs', dark_mode ? 'text-gray-400' : 'text-gray-500', msg.sender === 'user' && 'text-opacity-80')}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.text}</p>
                  {msg.type === 'video_call_invitation' && (<Button onClick={() => window.open(msg.videoCallUrl, '_blank', 'width=800,height=600')} className="mt-2 w-full" style={{backgroundColor: primary_color, color: 'white'}}>Join Video Call</Button>)}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-sm text-gray-500 italic px-2">Agent is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          {activeForm ? (<WidgetForm fields={activeForm} onSubmit={handleFormSubmit} primaryColor={primary_color} darkMode={dark_mode} />) : (
            <div className={cn('p-3 border-t', dark_mode ? 'border-gray-800' : 'border-gray-200')}>
              <div className="flex items-center gap-2">
                <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage(inputValue)} placeholder={input_placeholder} className={cn('flex-grow p-2 border rounded-md w-full text-sm', dark_mode ? 'bg-gray-800 border-gray-700 focus:ring-blue-500' : 'bg-white border-gray-300 focus:ring-blue-500')} />
                <Button onClick={() => handleSendMessage(inputValue)} style={{ backgroundColor: primary_color }} className="text-white rounded-md h-9 w-9 p-0 flex-shrink-0"><Send size={18} /></Button>
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
