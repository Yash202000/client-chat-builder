import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X, Mic, Send, Loader2, Bot, User, Minus, MicOff, FileText, Image as ImageIcon, File, Download, ImagePlus, MapPin, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetForm } from '@/components/WidgetForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TypingIndicator } from '@/components/TypingIndicator';
import CallingModal from '@/components/CallingModal';
import LocationPicker from '@/components/LocationPicker';

// Type definitions
type DisplayMode = 'widget' | 'iframe' | 'fullpage';

interface WidgetProps {
  agentId: string;
  companyId: string;
  backendUrl: string;
  rtlOverride?: boolean | null;
  languageOverride?: string | null;
  positionOverride?: string | null;
  displayMode?: DisplayMode;
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
  widget_width?: number;  // Custom width in px (overrides widget_size)
  widget_height?: number; // Custom height in px (overrides widget_size)
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

interface Attachment {
  id?: number;
  file_name: string;
  file_url?: string;  // Optional - for S3 URLs from internal chat
  file_data?: string;  // Optional - for base64 data from conversation broadcasts
  file_type: string;
  file_size: number;
  // Location data for geo attachments
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
}

interface Message {
  id: string | number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  type: 'message' | 'prompt' | 'form' | 'video_call_invitation' | 'attachment';
  timestamp: string;
  options?: Array<{key: string; value: string}> | string[];  // Support both key-value and legacy string formats
  fields?: any[];
  videoCallUrl?: string;
  assignee_name?: string;  // Name of the agent who sent this message
  attachments?: Attachment[];  // File attachments sent with message
}

const widgetSizes = {
  small: { width: 320, height: 450 },
  medium: { width: 360, height: 550 },
  large: { width: 400, height: 650 },
};

const generateSessionId = () => Date.now(); // milliseconds timestamp

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Helper function to get file icon based on type
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper function to check if video call invitation is still valid
const isVideoCallValid = (msg: Message, allMessages: Message[]): boolean => {
  // 1. Check if invitation is older than 1 minute
  const invitationTime = new Date(msg.timestamp).getTime();
  const now = Date.now();
  const oneMinute = 60 * 1000;
  if (now - invitationTime > oneMinute) {
    return false;
  }

  // 2. Check if 3+ messages were sent after this invitation
  const msgIndex = allMessages.findIndex(m => m.id === msg.id);
  if (msgIndex === -1) return false;

  const messagesAfter = allMessages.slice(msgIndex + 1);
  if (messagesAfter.length >= 3) {
    return false;
  }

  return true;
};

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
const Widget = ({ agentId, companyId, backendUrl, rtlOverride, languageOverride, positionOverride, displayMode = 'widget' }: WidgetProps) => {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  // For iframe/fullpage modes, start with widget open
  const [isOpen, setIsOpen] = useState(displayMode !== 'widget');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUsingTool, setIsUsingTool] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeForm, setActiveForm] = useState<any[] | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false); // For voice visualization
  const [isMicEnabled, setIsMicEnabled] = useState(false); // Manual mic control for voice mode

  // Call state management
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'connecting' | 'connected' | null>(null);
  const [callData, setCallData] = useState<{
    agentName: string;
    roomName: string;
    livekitUrl: string;
    userToken: string;
  } | null>(null);

  const isProactiveSession = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const voiceWs = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Location sharing state
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Expected input type constraint from workflow Listen node
  const [expectedInputType, setExpectedInputType] = useState<'any' | 'text' | 'attachment' | 'location'>('any');

  // Disable text input when prompt requires option selection (allow_text_input = false)
  const [isTextInputDisabled, setIsTextInputDisabled] = useState(false);

  const audioPlaybackTimer = useRef<NodeJS.Timeout | null>(null);
  const incomingAudioChunks = useRef<Blob[]>([]);
  const audioQueue = useRef<Blob[]>([]); // Queue of complete audio blobs to play
  const isPlayingAudio = useRef(false); // Whether audio is currently playing
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // Reference to currently playing audio
  const audioStoppedByUser = useRef(false); // Flag to prevent new audio after user interaction

  // Voice Activity Detection (VAD) state for voice-only mode
  const vadTimer = useRef<NodeJS.Timeout | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const isSpeaking = useRef(false);
  const silenceStart = useRef<number | null>(null);
  const isMicEnabledRef = useRef(false); // Ref to track mic state in closures

  // Reconnection state
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);
  const currentSessionId = useRef<string | null>(null);
  const isResumingSession = useRef(false);  // Track if resuming existing session (for skipping welcome message)
  const [isConnected, setIsConnected] = useState(false);

  // Workflow reset state
  const [showStartOver, setShowStartOver] = useState(false);  // Show "Start Over" button for resumed prompts
  const [isWorkflowPaused, setIsWorkflowPaused] = useState(false);  // Workflow is waiting for user input
  const [showResetMenu, setShowResetMenu] = useState(false);  // Show dropdown on X button click

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

      // Show welcome message only on first connection (not reconnection or session resumption)
      // For resumed sessions, history will arrive via WebSocket message
      if (messages.length === 0 && !isResumingSession.current) {
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

      // Handle message history on reconnection
      if (data.type === 'history') {
        console.log('[Widget] Received message history:', data.messages?.length, 'messages');
        if (data.messages && data.messages.length > 0) {
          const historyMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.message,
            type: msg.message_type || 'message',
            timestamp: msg.timestamp,
            attachments: msg.attachments || [],
            assignee_name: msg.assignee_name,
            options: msg.options,
          }));
          setMessages(historyMessages);
          isResumingSession.current = true;  // Skip welcome message since we have history

          // Show "Start Over" option for any resumed session with history
          setShowStartOver(true);
          console.log('[Widget] Resumed session - showing Start Over option');

          // Check if last message is a prompt/form (workflow paused) - disable inputs
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg?.message_type === 'prompt' || lastMsg?.message_type === 'form') {
            setIsWorkflowPaused(true);
            // Default to disabled text input for resumed prompts (allow_text_input defaults to false)
            if (lastMsg?.message_type === 'prompt') {
              setIsTextInputDisabled(true);
            }
            console.log('[Widget] Resumed with paused workflow at prompt/form');
          }
        }
        return;
      }

      if (data.message_type === 'typing') {
        // Only process typing indicator if feature is enabled
        if (settings?.typing_indicator_enabled) {
          setIsTyping(data.is_typing);
        }
        return;
      }

      // Ignore audio_end markers (used for voice WebSocket audio queuing)
      if (data.type === 'audio_end') {
        return;
      }

      // Handle input constraint from workflow Listen node
      if (data.message_type === 'input_constraint') {
        setExpectedInputType(data.expected_input_type || 'any');
        console.log('[Widget] Input constraint received:', data.expected_input_type);
        return;
      }

      if (data.message_type === 'tool_use') {
        setIsUsingTool(true);
        return;
      }

      // Handle call events
      if (data.type === 'call_accepted') {
        console.log('[Widget] Call accepted by agent:', data);
        setCallStatus('connecting');
        setCallData({
          agentName: data.agent_name,
          roomName: data.room_name,
          livekitUrl: data.livekit_url,
          userToken: data.user_token
        });
        setIsCallActive(true);
        setIsUsingTool(false);
        setIsTyping(false);

        // Open LiveKit call in new window
        const callUrl = `${settings?.frontend_url || window.location.origin}/video-call?token=${encodeURIComponent(data.user_token)}&livekitUrl=${encodeURIComponent(data.livekit_url)}&sessionId=${currentSessionId.current}`;
        console.log('[Widget] Opening call window:', callUrl);

        const callWindow = window.open(
          callUrl,
          'AgentConnect Voice Call',
          'width=800,height=600,resizable=yes,scrollbars=yes'
        );

        if (!callWindow) {
          console.error('[Widget] Failed to open call window - popup blocked?');
          setCallStatus(null);
          setIsCallActive(false);

          // Show message to user with clickable link
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            sender: 'system',
            text: `Call accepted by ${data.agent_name}! Please allow popups to join the voice call, or click this link to open it manually: ${callUrl}`,
            type: 'message',
            timestamp: new Date().toISOString()
          }]);
        } else {
          // Show success message and close the calling modal
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            sender: 'system',
            text: `Call accepted by ${data.agent_name}! Opening call window...`,
            type: 'message',
            timestamp: new Date().toISOString()
          }]);

          // Close the calling modal after a short delay
          setTimeout(() => {
            setIsCallActive(false);
            setCallStatus(null);
          }, 1500);
        }

        return;
      }

      if (data.type === 'call_rejected') {
        console.log('[Widget] Call rejected by agent:', data);
        setIsCallActive(false);
        setCallStatus(null);
        setCallData(null);
        setIsUsingTool(false);
        setIsTyping(false);
        // Show message to user
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          sender: 'system',
          text: data.message || 'The agent is currently unavailable. Please continue chatting.',
          type: 'message',
          timestamp: new Date().toISOString()
        }]);
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
        assignee_name: data.assignee_name,  // Include agent name from backend
        attachments: data.attachments || []  // Include file attachments if present
      };

      // Increment unread count if minimized and message is from agent/system
      if (isMinimized && (data.sender === 'agent' || data.sender === 'system')) {
        setUnreadCount(prev => prev + 1);
      }

      // Reset input constraint when workflow continues (agent sends regular message)
      if (data.sender === 'agent' && data.message_type !== 'input_constraint') {
        setExpectedInputType('any');
      }

      setMessages(prev => {
        // For user messages from backend, check if we have an optimistic version to replace
        if (data.sender === 'user' && data.id) {
          // Find the most recent temp message to replace
          const tempMessageIndex = prev.findIndex(msg => {
            if (!msg.id.toString().startsWith('temp_')) return false;  // Must be temp
            if (msg.sender !== 'user') return false;                    // Must be from user

            // Match by content OR by attachments (for attachment-only messages)
            const textMatches = msg.text === data.message;
            const bothHaveAttachments = msg.attachments && msg.attachments.length > 0 && data.attachments && data.attachments.length > 0;
            const isAttachmentOnlyMessage = (!msg.text || msg.text === '') && bothHaveAttachments;

            return textMatches || isAttachmentOnlyMessage;
          });

          if (tempMessageIndex !== -1) {
            // Replace temp message with real one from backend
            const updated = [...prev];
            updated[tempMessageIndex] = newMessage;
            console.log(`✅ Replaced temp message with real ID: ${data.id}`);
            return updated;
          }
        }

        // Check for duplicates by real ID
        if (prev.find(msg => msg.id === newMessage.id)) return prev;

        // Add new message (agent messages, or user message if no temp found)
        return [...prev, newMessage];
      });

      // Check if message contains call initiation info (from handoff tool)
      if (data.sender === 'agent' && data.call_initiated) {
        console.log('[Widget] Call initiated:', data);
        setCallStatus('calling');
        setIsCallActive(true);
        setCallData({
          agentName: data.agent_name || 'Agent',
          roomName: data.room_name || '',
          livekitUrl: data.livekit_url || '',
          userToken: data.user_token || ''
        });
      }

      if (data.message_type === 'form') {
        setActiveForm(data.fields);
      }

      // Handle prompt with allow_text_input - disable text input if not allowed
      if (data.message_type === 'prompt' && data.options && data.options.length > 0) {
        const allowTextInput = data.allow_text_input === true;  // Default to false
        setIsTextInputDisabled(!allowTextInput);
        setIsWorkflowPaused(true);
        console.log('[Widget] Prompt received, allow_text_input:', allowTextInput, 'disabling input:', !allowTextInput);
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
  const connectVoiceWebSocket = async () => {
    if (!currentSessionId.current) return;
    if (settings?.communication_mode !== 'chat_and_voice' && settings?.communication_mode !== 'voice') return;

    const voiceUrl = `${backendUrl.replace('http', 'ws')}/api/v1/ws/public/voice/${companyId}/${agentId}/${currentSessionId.current}?user_type=user&voice_id=${settings?.voice_id || 'default'}&stt_provider=${settings?.stt_provider || 'groq'}`;
    voiceWs.current = new WebSocket(voiceUrl);

    voiceWs.current.onopen = async () => {
      console.log('[Widget] Voice WebSocket connected');

      // Request microphone permission once when WebSocket connects
      // This keeps the stream alive for the entire session
      if (settings?.communication_mode === 'voice' || settings?.communication_mode === 'chat_and_voice') {
        try {
          console.log('[Widget] Requesting microphone permission...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.current = stream;
          console.log('[Widget] ✅ Microphone permission granted and stream acquired');
        } catch (error) {
          console.error('[Widget] ❌ Failed to get microphone permission:', error);
        }
      }
    };

    voiceWs.current.onmessage = async (event) => {
      // Ignore audio if user has stopped playback
      if (audioStoppedByUser.current) {
        return;
      }

      // Handle binary audio data
      if (event.data instanceof Blob) {
        incomingAudioChunks.current.push(event.data);
        // Use a short debounce as backup in case audio_end isn't received
        if (audioPlaybackTimer.current) clearTimeout(audioPlaybackTimer.current);
        audioPlaybackTimer.current = setTimeout(() => {
          if (incomingAudioChunks.current.length > 0) {
            finalizeAndQueueAudio();
          }
        }, 500);
      }
      // Handle text messages (e.g., audio_end marker)
      else if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audio_end') {
            // Clear the backup timer since we got the proper end signal
            if (audioPlaybackTimer.current) {
              clearTimeout(audioPlaybackTimer.current);
              audioPlaybackTimer.current = null;
            }
            // Finalize current audio chunks and queue for playback
            if (incomingAudioChunks.current.length > 0) {
              finalizeAndQueueAudio();
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    };

    // Helper to finalize audio chunks and add to queue
    const finalizeAndQueueAudio = () => {
      // Don't queue if user stopped audio
      if (audioStoppedByUser.current) {
        incomingAudioChunks.current = [];
        return;
      }

      if (incomingAudioChunks.current.length === 0) return;

      const fullAudioBlob = new Blob(incomingAudioChunks.current, { type: 'audio/webm' });
      incomingAudioChunks.current = [];
      audioQueue.current.push(fullAudioBlob);
      console.log('[Widget] Audio queued, queue length:', audioQueue.current.length);

      // Start playing if not already playing
      if (!isPlayingAudio.current) {
        playNextInQueue();
      }
    };

    // Play audio from queue sequentially
    const playNextInQueue = () => {
      // Don't play if user stopped audio
      if (audioStoppedByUser.current) {
        audioQueue.current = [];
        isPlayingAudio.current = false;
        currentAudioRef.current = null;
        return;
      }

      if (audioQueue.current.length === 0) {
        isPlayingAudio.current = false;
        currentAudioRef.current = null;
        return;
      }

      isPlayingAudio.current = true;
      const audioBlob = audioQueue.current.shift()!;
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio; // Store reference for stopping

      // For voice-only mode, pause VAD while playing response
      if (settings?.communication_mode === 'voice') {
        pauseVAD();
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up
        currentAudioRef.current = null;
        if (settings?.communication_mode === 'voice' && audioQueue.current.length === 0) {
          resumeVAD();
        }
        // Play next audio in queue
        playNextInQueue();
      };

      audio.onerror = () => {
        console.error('[Widget] Audio playback error');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        playNextInQueue(); // Try next audio
      };

      audio.play().catch(err => {
        console.error('[Widget] Failed to play audio:', err);
        currentAudioRef.current = null;
        playNextInQueue();
      });
    };

    voiceWs.current.onclose = () => {
      console.log('[Widget] Voice WebSocket closed');
      stopVoiceActivityDetection();
    };

    voiceWs.current.onerror = (error) => {
      console.error('[Widget] Voice WebSocket error:', error);
    };
  };

  // Voice Activity Detection - Automatically detect when user speaks
  const startVoiceActivityDetection = async () => {
    try {
      // Reuse existing audio stream if available, otherwise request permission
      let stream = audioStream.current;
      if (!stream) {
        console.log('[VAD] No existing stream, requesting microphone permission...');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.current = stream;
        console.log('[VAD] ✅ Microphone permission granted');
      } else {
        console.log('[VAD] ✅ Reusing existing microphone stream (no permission prompt)');
      }

      // Setup audio analysis (only if not already set up)
      if (!audioContext.current || audioContext.current.state === 'closed') {
        audioContext.current = new AudioContext();
        const source = audioContext.current.createMediaStreamSource(stream);
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 2048;
        source.connect(analyser.current);
        console.log('[VAD] Audio analysis context created');
      }

      // Setup media recorder
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length > 0 && voiceWs.current?.readyState === WebSocket.OPEN) {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          voiceWs.current.send(audioBlob);
          console.log('[VAD] Sent audio chunk:', audioBlob.size, 'bytes');
        }
        audioChunks.current = [];
      };

      // Start continuous recording
      mediaRecorder.current.start();

      // Start monitoring audio levels
      monitorAudioLevel();
      console.log('[VAD] Voice Activity Detection started');
    } catch (error) {
      console.error('[VAD] Error starting voice detection:', error);
    }
  };

  // Monitor audio level to detect speech
  const monitorAudioLevel = () => {
    if (!analyser.current) return;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      // Stop monitoring if analyser is gone or mic is disabled
      if (!analyser.current || !isMicEnabledRef.current) {
        if (vadTimer.current) {
          clearTimeout(vadTimer.current);
          vadTimer.current = null;
        }
        return;
      }

      analyser.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      // Threshold for detecting speech (adjust as needed)
      const SPEECH_THRESHOLD = 30;
      const SILENCE_DURATION = 1500; // 1.5 seconds of silence to stop

      if (average > SPEECH_THRESHOLD) {
        // User is speaking
        if (!isSpeaking.current) {
          console.log('[VAD] Speech detected, starting recording');
          isSpeaking.current = true;
          setIsVoiceActive(true);

          // Start a new recording session
          if (mediaRecorder.current?.state === 'inactive') {
            audioChunks.current = [];
            mediaRecorder.current.start();
          }
        }
        silenceStart.current = null;
      } else {
        // Silence detected
        if (isSpeaking.current) {
          if (silenceStart.current === null) {
            silenceStart.current = Date.now();
          } else {
            const silenceDuration = Date.now() - silenceStart.current;

            if (silenceDuration > SILENCE_DURATION) {
              console.log('[VAD] Silence detected, stopping recording');
              isSpeaking.current = false;
              setIsVoiceActive(false);
              silenceStart.current = null;

              // Stop recording and send
              if (mediaRecorder.current?.state === 'recording') {
                mediaRecorder.current.stop();

                // Start a new recording immediately for next speech
                setTimeout(() => {
                  if (mediaRecorder.current?.state === 'inactive' && isMicEnabledRef.current) {
                    audioChunks.current = [];
                    mediaRecorder.current?.start();
                  }
                }, 100);
              }
            }
          }
        }
      }

      // Continue monitoring
      vadTimer.current = setTimeout(checkAudioLevel, 100);
    };

    checkAudioLevel();
  };

  // Pause VAD while AI is speaking
  const pauseVAD = () => {
    console.log('[VAD] Pausing voice detection');
    if (vadTimer.current) {
      clearTimeout(vadTimer.current);
      vadTimer.current = null;
    }
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.pause();
    }
  };

  // Resume VAD after AI finishes speaking
  const resumeVAD = () => {
    console.log('[VAD] Resuming voice detection');
    // Only resume if mic is still enabled
    if (!isMicEnabledRef.current) return;

    if (mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.resume();
    }
    monitorAudioLevel();
  };

  // Stop audio playback when user starts typing or sends a message
  const stopAudioPlayback = () => {
    // Set flag to prevent new audio
    audioStoppedByUser.current = true;

    // Clear timer
    if (audioPlaybackTimer.current) {
      clearTimeout(audioPlaybackTimer.current);
      audioPlaybackTimer.current = null;
    }

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      currentAudioRef.current = null;
    }

    // Clear queues
    audioQueue.current = [];
    isPlayingAudio.current = false;
    incomingAudioChunks.current = [];
    setIsTyping(false);

    // Reset flag after delay to allow new response audio
    setTimeout(() => {
      audioStoppedByUser.current = false;
    }, 1000);
  };

  // Stop Voice Activity Detection (but keep stream alive for reuse)
  const stopVoiceActivityDetection = () => {
    console.log('[VAD] Stopping voice detection (keeping stream alive)');

    if (vadTimer.current) {
      clearTimeout(vadTimer.current);
      vadTimer.current = null;
    }

    if (mediaRecorder.current?.state === 'recording' || mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.stop();
    }

    // DON'T stop the audio stream - keep it alive for reuse
    // DON'T close audio context - keep it alive for reuse
    // This prevents permission prompts on every toggle

    isSpeaking.current = false;
    silenceStart.current = null;
  };

  // Completely cleanup voice resources (called on widget close)
  const cleanupVoiceResources = () => {
    console.log('[VAD] Cleaning up all voice resources');

    stopVoiceActivityDetection();

    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
      audioStream.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }

    analyser.current = null;
  };

  // Handle manual mic toggle for voice mode
  const handleMicToggle = async () => {
    if (isMicEnabled) {
      // Turn mic off
      console.log('[Voice] Mic disabled by user');
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
      setIsVoiceActive(false);
      stopVoiceActivityDetection();
    } else {
      // Turn mic on
      console.log('[Voice] Mic enabled by user');
      setIsMicEnabled(true);
      isMicEnabledRef.current = true;
      await startVoiceActivityDetection();
    }
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
        isResumingSession.current = true;  // History will be sent via WebSocket
        console.log('Resuming existing session:', newSessionId);
      } else {
        // Generate new session and store it
        newSessionId = generateSessionId();
        isResumingSession.current = false;  // New session, show welcome message
        storeSession(agentId, companyId, newSessionId);
        console.log('Created new session:', newSessionId);
      }

      setSessionId(newSessionId);
      currentSessionId.current = newSessionId;
      shouldReconnect.current = true;
      reconnectAttempts.current = 0;

      // Connect chat WebSocket only for chat and chat_and_voice modes
      if (settings?.communication_mode === 'chat' || settings?.communication_mode === 'chat_and_voice') {
        connectWebSocket();
      }

      // Connect voice WebSocket for voice and chat_and_voice modes
      if (settings?.communication_mode === 'voice' || settings?.communication_mode === 'chat_and_voice') {
        connectVoiceWebSocket();
      }

    } else {
      shouldReconnect.current = false;
      clearTimers();
      ws.current?.close();
      voiceWs.current?.close();
      cleanupVoiceResources(); // Cleanup all voice resources when widget closes
      setLiveKitToken(null);
      setIsConnected(false);
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
      setIsVoiceActive(false);
    }

    return () => {
      shouldReconnect.current = false;
      clearTimers();
      ws.current?.close();
      voiceWs.current?.close();
      cleanupVoiceResources(); // Cleanup all voice resources on unmount
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
      setIsVoiceActive(false);
    };
  }, [isOpen, agentId, companyId, backendUrl, settings]);

  // File upload helper functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[Widget] File selected:', file?.name, file?.type, file?.size);
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      console.error('[Widget] Only images are supported');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[Widget] Image must be less than 5MB');
      return;
    }

    console.log('[Widget] File accepted, setting preview');
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Location handlers
  const handleLocationClick = () => {
    if (selectedLocation) {
      // Already have a location, show picker to edit
      setShowLocationPicker(true);
    } else {
      // Get current location first
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setShowLocationPicker(true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('[Widget] Location error:', error);
        // Show picker anyway with default location (Dubai)
        setShowLocationPicker(true);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reset workflow state and allow user to start fresh
  const handleResetWorkflow = async () => {
    if (!currentSessionId.current) return;

    try {
      const response = await fetch(`${backendUrl}/api/v1/conversations/widget/${currentSessionId.current}/reset-workflow`, {
        method: 'POST'
      });

      if (response.ok) {
        setShowStartOver(false);
        setIsWorkflowPaused(false);
        setShowResetMenu(false);
        setActiveForm(null);  // Clear any active form
        setExpectedInputType('any');  // Reset input constraint
        setIsTextInputDisabled(false);  // Re-enable text input

        // Add system message to inform user
        setMessages(prev => [...prev, {
          id: `reset-${Date.now()}`,
          sender: 'agent',
          text: localizedTexts?.conversation_reset || 'Conversation reset. How can I help you?',
          type: 'message',
          timestamp: new Date().toISOString()
        }]);

        console.log('[Widget] Workflow reset successfully');
      } else {
        console.error('[Widget] Failed to reset workflow:', response.statusText);
      }
    } catch (error) {
      console.error('[Widget] Error resetting workflow:', error);
    }
  };

  // Handle X button click - show menu if workflow is paused, otherwise close directly
  const handleCloseClick = () => {
    if (isWorkflowPaused) {
      setShowResetMenu(prev => !prev);
    } else {
      setIsTextInputDisabled(false);  // Reset input state on close
      setIsOpen(false);
    }
  };

  const handleSendMessage = async (text: string, payload?: any) => {
    const messageText = text.trim();
    if (!messageText && !payload && !selectedFile && !selectedLocation) return;

    // Stop any playing audio
    stopAudioPlayback();

    // Validate input type constraint
    if (expectedInputType !== 'any') {
      if (expectedInputType === 'attachment' && !selectedFile) {
        console.log('[Widget] Validation failed: Attachment expected');
        return;
      }
      if (expectedInputType === 'location' && !selectedLocation) {
        console.log('[Widget] Validation failed: Location expected');
        return;
      }
      if (expectedInputType === 'text' && (selectedFile || selectedLocation)) {
        console.log('[Widget] Validation failed: Text only expected');
        return;
      }
    }

    // Clear workflow reset states when user sends a message
    setShowStartOver(false);
    setIsWorkflowPaused(false);
    setShowResetMenu(false);
    setIsTextInputDisabled(false);  // Re-enable text input after selection

    // Build attachments array
    let attachments: Attachment[] = [];

    // Add image attachment if file is selected
    if (selectedFile) {
      const base64 = await fileToBase64(selectedFile);
      attachments.push({
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        file_data: base64
      });
    }

    // Add location attachment if location is selected
    if (selectedLocation) {
      const locationData = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      };
      attachments.push({
        file_name: 'location',
        file_type: 'application/geo+json',
        file_size: new Blob([JSON.stringify(locationData)]).size,
        location: locationData
      });
    }

    // Build display text for optimistic message
    // If there's no text but there are attachments, show preview only (no placeholder text)
    let displayText = messageText || '';

    // OPTIMISTIC UPDATE: Show user message immediately
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      sender: 'user',
      text: displayText,
      type: 'message',
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    // Send to backend
    const messageToSend: any = {
      message: messageText,  // Always send display text as message
      message_type: 'message',
      sender: 'user'
    };
    // If payload exists (option key), include it separately for workflow variable storage
    if (payload) {
      messageToSend.option_key = payload;
    }
    if (attachments.length > 0) {
      messageToSend.attachments = attachments;
      console.log('[Widget] Sending message with attachments:', attachments.length, 'item(s)');
    }

    console.log('[Widget] Sending message:', { hasAttachments: attachments.length > 0, messageLength: messageToSend.message?.length });

    if (ws.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(messageToSend);
      console.log('[Widget] WebSocket payload size:', payload.length, 'bytes');
      console.log('[Widget] WebSocket payload keys:', Object.keys(messageToSend));
      if (messageToSend.attachments) {
        console.log('[Widget] Attachments in payload:', messageToSend.attachments.map((a: Attachment) => ({
          name: a.file_name,
          type: a.file_type,
          size: a.file_size,
          hasData: !!a.file_data,
          hasLocation: !!a.location
        })));
      }
      ws.current.send(payload);
      console.log('[Widget] ✅ Message sent via WebSocket');
      setInputValue('');
      clearSelectedFile();
      setSelectedLocation(null);
      setMessages(prev => prev.map(m => ({ ...m, options: undefined })));
    } else {
      console.error('[Widget] ❌ WebSocket not open, state:', ws.current?.readyState);
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
  const { position, primary_color, agent_avatar_url, widget_size, widget_width, widget_height, border_radius, dark_mode, show_header, user_message_color, user_message_text_color, bot_message_color, bot_message_text_color, time_color } = settings;

  // Extract localized texts
  const { welcome_message, header_title, input_placeholder, proactive_message } = localizedTexts;

  // Position priority: data-position attribute > meta.position > direct position field > default
  const widgetPosition = positionOverride || settings.meta?.position || position || 'bottom-right';
  const [vertical, horizontal] = widgetPosition.split('-');
  // Prioritize custom dimensions over presets
  const size = (widget_width && widget_height)
    ? { width: widget_width, height: widget_height }
    : widgetSizes[widget_size] || widgetSizes.medium;

  // RTL can be overridden by embed code data attribute, otherwise check if language is RTL, otherwise use setting from meta
  // Use != null to check for both null and undefined
  const isRTL = rtlOverride != null ? rtlOverride : (RTL_LANGUAGES.includes(currentLanguage) || settings.meta?.rtl_enabled || false);

  // Get container styles based on display mode
  const getContainerStyle = (): React.CSSProperties => {
    const zIndex = settings.meta?.z_index || 9999;

    if (displayMode === 'fullpage') {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
      };
    }

    if (displayMode === 'iframe') {
      return {
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex,
      };
    }

    // Default widget mode
    return {
      position: 'fixed',
      zIndex,
      [vertical]: '20px',
      [horizontal]: '20px',
    };
  };

  // Get chat window styles based on display mode
  const getChatWindowStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: `${border_radius}px`,
      boxShadow: displayMode === 'fullpage'
        ? '0 25px 50px rgba(0,0,0,0.25)'
        : '0 10px 30px rgba(0,0,0,0.15)',
    };

    if (displayMode === 'fullpage') {
      return {
        width: '100%',
        height: '100%',
        borderRadius: 0,  // No border radius for fullpage
      };
    }

    if (displayMode === 'iframe') {
      return {
        ...baseStyle,
        width: '100%',
        height: '100%',
      };
    }

    // Default widget mode
    return {
      ...baseStyle,
      width: `${size.width}px`,
      height: `${size.height}px`,
      position: 'absolute',
      [vertical === 'bottom' ? 'bottom' : 'top']: '80px',
      [horizontal === 'right' ? 'right' : 'left']: '0',
    };
  };

  return (
  <div style={getContainerStyle()}>
    {/* Floating button - only in widget mode */}
    {displayMode === 'widget' && !isOpen && (
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

    {isOpen && settings?.communication_mode === 'voice' && (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          width: '360px',
          height: '500px',
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
        {/* Voice Mode Header */}
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
                    alt="Voice Avatar"
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
              title="Close"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Voice Visualization Area */}
        <div className="flex-grow flex flex-col items-center justify-center p-8">
          {/* Avatar with pulsing animation */}
          <div className="relative mb-8">
            <div
              className={cn(
                "absolute inset-0 rounded-full animate-pulse",
                isVoiceActive ? "opacity-75" : "opacity-0"
              )}
              style={{
                background: primary_color,
                width: '140px',
                height: '140px',
                animationDuration: '1s',
              }}
            />
            {agent_avatar_url ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                <img
                  src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
                  alt="Agent Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center" style="background: ${primary_color}"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></div>`;
                  }}
                />
              </div>
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4 border-white shadow-2xl"
                style={{ background: primary_color }}
              >
                <Mic size={64} color="white" />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">
              {!isMicEnabled ? 'Voice Assistant' : isVoiceActive ? 'Listening...' : 'Ready to listen'}
            </h3>
            <p className={cn("text-sm", dark_mode ? "text-gray-400" : "text-gray-600")}>
              {!isMicEnabled
                ? 'Click the microphone to start'
                : isVoiceActive
                ? 'Speak now, I\'m listening'
                : 'Start speaking anytime'}
            </p>
          </div>

          {/* Visual indicator for voice activity */}
          <div className="mt-8 flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 rounded-full transition-all duration-300",
                  isVoiceActive && isMicEnabled ? "h-12 animate-pulse" : "h-4"
                )}
                style={{
                  background: isMicEnabled ? primary_color : (dark_mode ? '#4B5563' : '#D1D5DB'),
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Mic Toggle Button */}
          <div className="mt-8">
            <Button
              onClick={handleMicToggle}
              size="lg"
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
                isMicEnabled
                  ? "hover:scale-110 active:scale-95"
                  : "hover:scale-110 active:scale-95"
              )}
              style={{
                background: isMicEnabled ? primary_color : (dark_mode ? '#374151' : '#E5E7EB'),
                color: isMicEnabled ? 'white' : (dark_mode ? '#9CA3AF' : '#6B7280'),
              }}
            >
              {isMicEnabled ? <Mic size={32} /> : <MicOff size={32} />}
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className={cn("text-xs", dark_mode ? "text-gray-500" : "text-gray-500")}>
              {isMicEnabled
                ? 'Microphone is active. Speak naturally.'
                : 'Click microphone to enable voice'}
            </p>
          </div>
        </div>

        {/* Connection status */}
        <div className="p-4 border-t flex items-center justify-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              voiceWs.current?.readyState === WebSocket.OPEN ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className={cn("text-xs", dark_mode ? "text-gray-400" : "text-gray-600")}>
            {voiceWs.current?.readyState === WebSocket.OPEN ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>
    )}


    {/* Minimized Widget View - only in widget mode */}
    {displayMode === 'widget' && isOpen && isMinimized && settings?.communication_mode !== 'voice' && (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          width: '280px',
          borderRadius: `${border_radius}px`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          position: 'absolute',
          [vertical === 'bottom' ? 'bottom' : 'top']: '80px',
          [horizontal === 'right' ? 'right' : 'left']: '0',
          background: primary_color,
        }}
        className="flex items-center justify-between p-4 text-white cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => {
          setIsMinimized(false);
          setUnreadCount(0);
        }}
      >
        <div className="flex items-center gap-3">
          {agent_avatar_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm absolute inset-0 flex items-center justify-center z-0">
                {header_title.charAt(0).toUpperCase()}
              </span>
              <img
                src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
                alt="Avatar"
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
          <div>
            <div className="font-bold">{header_title}</div>
            {unreadCount > 0 && (
              <div className="text-xs">
                {unreadCount} new message{unreadCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="bg-white text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
    )}

    {/* Full Widget View */}
    {isOpen && !isMinimized && settings?.communication_mode !== 'voice' && (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={getChatWindowStyle()}
        className={cn(
          'flex flex-col overflow-hidden',
          dark_mode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
        )}
      >
        {show_header && (
          <div
            style={{
              background: primary_color,
              borderTopLeftRadius: displayMode === 'fullpage' ? 0 : `${border_radius}px`,
              borderTopRightRadius: displayMode === 'fullpage' ? 0 : `${border_radius}px`,
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
            <div className="flex items-center gap-2">
              {/* Minimize button - only in widget mode */}
              {displayMode === 'widget' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsMinimized(true);
                    setUnreadCount(0);
                  }}
                  className="text-white hover:bg-white/20"
                  title="Minimize"
                >
                  <Minus className="h-5 w-5" />
                </Button>
              )}
              {/* Close/Options button - only in widget mode */}
              {displayMode === 'widget' && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseClick}
                    className="text-white hover:bg-white/20"
                    title={isWorkflowPaused ? "Options" : "Close"}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  {/* Dropdown menu for workflow reset */}
                  {showResetMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[140px]"
                      style={{ borderRadius: `${border_radius}px` }}
                    >
                      <button
                        onClick={() => { setShowResetMenu(false); setIsTextInputDisabled(false); setIsOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        {localizedTexts?.close_widget || 'Close Widget'}
                      </button>
                      <button
                        onClick={handleResetWorkflow}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {localizedTexts?.start_over || 'Start Over'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Reset button - for iframe/fullpage modes */}
              {displayMode !== 'widget' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetWorkflow}
                  className="text-white hover:bg-white/20"
                  title="Start Over"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>
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
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((option, index) => {
                        // Safely extract display text and key - always ensure string output
                        let displayText: string;
                        let keyValue: string;

                        if (option && typeof option === 'object' && 'key' in option && 'value' in option) {
                          // New key-value format
                          displayText = String((option as {key: string; value: string}).value || (option as {key: string; value: string}).key || '');
                          keyValue = String((option as {key: string; value: string}).key || '');
                        } else {
                          // Legacy string format
                          displayText = String(option || '');
                          keyValue = String(option || '');
                        }

                        // Only the last message's options should be clickable
                        const isLastMessage = msg.id === messages[messages.length - 1]?.id;

                        return (
                          <Button
                            key={index}
                            onClick={() => isLastMessage && handleSendMessage(displayText, keyValue)}
                            disabled={!isLastMessage}
                            variant="outline"
                            size="sm"
                            className={cn(
                              'rounded-full',
                              !isLastMessage
                                ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                                : dark_mode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
                            )}
                          >
                            {displayText}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {msg.type === 'video_call_invitation' && msg.videoCallUrl && (
                  <Button
                    onClick={() => window.open(msg.videoCallUrl, '_blank', 'width=800,height=600')}
                    className="mt-2 w-full"
                    style={{
                      background: isVideoCallValid(msg, messages) ? primary_color : '#9CA3AF',
                      color: 'white',
                      cursor: isVideoCallValid(msg, messages) ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!isVideoCallValid(msg, messages)}
                  >
                    {isVideoCallValid(msg, messages)
                      ? (localizedTexts?.join_video_call || 'Join Video Call')
                      : (localizedTexts?.video_call_expired || 'Video Call Expired')}
                  </Button>
                )}

                {/* Show "Start Over" on every last agent message */}
                {msg.sender === 'agent' && msg.id === messages[messages.length - 1]?.id && messages.length > 1 && (
                  <button
                    onClick={handleResetWorkflow}
                    className="mt-2 text-xs opacity-60 hover:opacity-100 underline flex items-center gap-1"
                    style={{ color: dark_mode ? '#9CA3AF' : '#6B7280' }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {localizedTexts?.start_over || 'Start Over'}
                  </button>
                )}

                {/* Attachments Display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((attachment, idx) => {
                      const FileIcon = getFileIcon(attachment.file_type);
                      const isImage = attachment.file_type.startsWith('image/');

                      // Handle base64 data (from conversation broadcasts) or URL (from S3)
                      const fileSource = attachment.file_data
                        ? `data:${attachment.file_type};base64,${attachment.file_data}`
                        : `${backendUrl}/api/v1/chat/files/${attachment.file_url?.split('/').pop()}`;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-lg overflow-hidden border",
                            dark_mode ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-gray-50"
                          )}
                        >
                          {isImage ? (
                            // Image preview with download overlay
                            <div className="relative group">
                              <img
                                src={fileSource}
                                alt={attachment.file_name}
                                className="w-full max-h-48 object-contain cursor-pointer"
                                onClick={() => window.open(fileSource, '_blank')}
                              />
                              <a
                                href={fileSource}
                                download={attachment.file_name}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
                                title="Download"
                              >
                                <Download size={16} />
                              </a>
                              <div className="p-2 text-xs truncate">
                                {attachment.file_name}
                              </div>
                            </div>
                          ) : (
                            // File download button
                            <a
                              href={fileSource}
                              download={attachment.file_name}
                              className={cn(
                                "flex items-center gap-3 p-3 hover:opacity-80 transition-opacity",
                                dark_mode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                              )}
                            >
                              <div
                                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: primary_color + '20', color: primary_color }}
                              >
                                <FileIcon size={20} />
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="text-sm font-medium truncate">{attachment.file_name}</div>
                                <div className="text-xs opacity-70">{formatFileSize(attachment.file_size)}</div>
                              </div>
                              <Download size={18} className="flex-shrink-0 opacity-50" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && settings?.typing_indicator_enabled && (
            <div className="flex w-full justify-start">
              <div className="flex items-end gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-transparent text-xs" style={{ color: bot_message_text_color }}>
                    <Bot size={14} />
                  </AvatarFallback>
                </Avatar>
                <TypingIndicator
                  backgroundColor={bot_message_color}
                  dotColor={bot_message_text_color}
                />
              </div>
            </div>
          )}
          {isUsingTool && <div className="text-sm text-gray-500 italic px-2">Using a tool...</div>}
          <div ref={messagesEndRef} />
        </div>
        {activeForm ? (<WidgetForm fields={activeForm} onSubmit={handleFormSubmit} primaryColor={primary_color} darkMode={dark_mode} />) : (
          <div className={cn('border-t', dark_mode ? 'border-gray-800' : 'border-gray-200')}>
            {/* Image Preview */}
            {filePreview && (
              <div className={cn('p-2 border-b flex items-center gap-2', dark_mode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')}>
                <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                <span className={cn('text-xs truncate flex-grow', dark_mode ? 'text-gray-300' : 'text-gray-600')}>{selectedFile?.name}</span>
                <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="h-6 w-6 flex-shrink-0">
                  <X size={14} />
                </Button>
              </div>
            )}
            {/* Location Preview */}
            {selectedLocation && (
              <div className={cn('p-2 border-b flex items-center gap-2', dark_mode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')}>
                <MapPin size={16} className="text-red-500 flex-shrink-0" />
                <span className={cn('text-xs flex-grow', dark_mode ? 'text-gray-300' : 'text-gray-600')}>
                  {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLocation(null)} className="h-6 w-6 flex-shrink-0">
                  <X size={14} />
                </Button>
              </div>
            )}
            {/* Input Area - Instagram Style */}
            <div className="p-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-2">
                {/* Input container with icons inside */}
                <div className={cn(
                  'flex-grow flex items-center gap-1 px-3 py-2 border rounded-full transition-all',
                  dark_mode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                )}>
                  {/* Text input */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => {
                      setInputValue(e.target.value);
                      stopAudioPlayback();
                    }}
                    onKeyPress={e => e.key === 'Enter' && !isTextInputDisabled && handleSendMessage(inputValue)}
                    disabled={isTextInputDisabled || expectedInputType === 'attachment' || expectedInputType === 'location'}
                    placeholder={
                      isTextInputDisabled ? (localizedTexts?.select_option_placeholder || 'Please select an option above') :
                      expectedInputType === 'attachment' ? 'Please attach an image' :
                      expectedInputType === 'location' ? 'Please share your location' :
                      input_placeholder
                    }
                    className={cn(
                      'flex-grow bg-transparent outline-none text-sm min-w-0',
                      (isTextInputDisabled || expectedInputType === 'attachment' || expectedInputType === 'location')
                        ? 'opacity-50 cursor-not-allowed'
                        : '',
                      dark_mode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {/* Right icons - hide when typing, show send when has content */}
                  {(inputValue || selectedFile || selectedLocation) ? (
                    <button
                      onClick={() => handleSendMessage(inputValue)}
                      className="p-1.5 rounded-full transition-colors"
                      style={{ color: primary_color }}
                    >
                      <Send size={20} />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isTextInputDisabled || (expectedInputType !== 'any' && expectedInputType !== 'attachment')}
                        className={cn(
                          'p-1.5 rounded-full transition-colors',
                          (isTextInputDisabled || (expectedInputType !== 'any' && expectedInputType !== 'attachment'))
                            ? 'opacity-40 cursor-not-allowed text-gray-400'
                            : (dark_mode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
                        )}
                        title={isTextInputDisabled ? 'Please select an option' :
                               expectedInputType === 'text' ? 'Text input expected' :
                               expectedInputType === 'location' ? 'Location input expected' : 'Attach image'}
                      >
                        <ImagePlus size={20} />
                      </button>
                      <button
                        onClick={handleLocationClick}
                        disabled={isTextInputDisabled || isGettingLocation || (expectedInputType !== 'any' && expectedInputType !== 'location')}
                        className={cn(
                          'p-1.5 rounded-full transition-colors',
                          (isTextInputDisabled || (expectedInputType !== 'any' && expectedInputType !== 'location'))
                            ? 'opacity-40 cursor-not-allowed text-gray-400'
                            : (dark_mode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
                        )}
                        title={isTextInputDisabled ? 'Please select an option' :
                               expectedInputType === 'text' ? 'Text input expected' :
                               expectedInputType === 'attachment' ? 'Image input expected' : 'Share location'}
                      >
                        {isGettingLocation ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
                      </button>
                    </>
                  )}
                </div>
                {/* Mic button - always outside */}
                <button
                  onClick={handleToggleRecording}
                  disabled={isTextInputDisabled}
                  className={cn(
                    'p-2 rounded-full transition-colors flex-shrink-0',
                    isTextInputDisabled
                      ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                      : isRecording ? 'bg-red-500 text-white' : (dark_mode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                  )}
                  title={isTextInputDisabled ? 'Please select an option' : 'Voice input'}
                >
                  {isRecording ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Calling Modal - Show when voice call is initiated or connecting */}
    {isCallActive && (callStatus === 'calling' || callStatus === 'connecting') && callData && (
      <CallingModal
        isOpen={true}
        recipientName={callData.agentName}
        status={callStatus}
        onCancel={() => {
          setIsCallActive(false);
          setCallStatus(null);
          setCallData(null);
          // TODO: Send cancel call request to backend
        }}
      />
    )}

    {/* Location Picker Modal */}
    {showLocationPicker && (
      <LocationPicker
        initialLocation={selectedLocation}
        onLocationSelect={(lat, lng) => {
          console.log('[Widget] Location selected:', lat, lng);
          setSelectedLocation({ latitude: lat, longitude: lng });
        }}
        onClose={() => {
          console.log('[Widget] Location picker closed');
          setShowLocationPicker(false);
          setSelectedLocation(null);
        }}
        onConfirm={(lat, lng) => {
          console.log('[Widget] Location confirmed:', lat, lng);
          // Set the location first, then send
          setSelectedLocation({ latitude: lat, longitude: lng });
          // Use setTimeout to ensure state is updated before sending
          setTimeout(() => {
            handleSendMessage('');
            setShowLocationPicker(false);
          }, 0);
        }}
        darkMode={dark_mode}
      />
    )}
  </div>
);
};

export default Widget;
