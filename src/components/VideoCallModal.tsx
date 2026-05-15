
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { VideoBackgroundEffects } from './VideoBackgroundEffects';
import '@livekit/components-styles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LIVEKIT_URL, BACKEND_URL } from "@/config/env";
import { API_BASE_URL } from "@/config/api";
import { toast } from 'sonner';
import { X, Minimize2, Maximize2, GripHorizontal, MessageSquare, Send, ChevronDown, Expand, Shrink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConvMessage {
  id: number;
  session_id: string;
  message: string;
  timestamp: string;
  sender: 'user' | 'agent' | 'tool';
  message_type: 'message' | 'note';
}

interface VideoCallModalProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
  preloadedToken?: string;
  livekitServerUrl?: string;
  conversationSessionId?: string;
  conversationAgentId?: number;
}

// ── Draggable hook ────────────────────────────────────────────────────────────
const useDraggable = (initialPosition: { x: number; y: number }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.initialX + e.clientX - dragRef.current.startX));
    const newY = Math.max(0, Math.min(window.innerHeight - 240, dragRef.current.initialY + e.clientY - dragRef.current.startY));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); dragRef.current = null; }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { position, isDragging, handleMouseDown, setPosition };
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  sessionId, userId, onClose, preloadedToken, livekitServerUrl, conversationSessionId, conversationAgentId,
}) => {
  const [token, setToken] = useState(preloadedToken || '');
  const serverUrl = livekitServerUrl || LIVEKIT_URL;
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const convWsRef = useRef<WebSocket | null>(null);
  const { authFetch } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const canChat = !!(conversationSessionId && conversationAgentId);
  const [wsConnected, setWsConnected] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAtBottomRef = useRef(true);

  const { data: messages = [] } = useQuery<ConvMessage[]>({
    queryKey: ['convMessages', conversationSessionId],
    queryFn: async () => {
      const t = localStorage.getItem('accessToken');
      const res = await fetch(
        `${API_BASE_URL}/api/v1/conversations/sessions/${encodeURIComponent(conversationSessionId!)}/messages?limit=50`,
        { headers: { Authorization: `Bearer ${t}` } },
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: canChat,
  });

  useEffect(() => {
    if (!canChat) return;
    let destroyed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (destroyed) return;
      const accessToken = localStorage.getItem('accessToken');
      const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/${conversationAgentId}/${conversationSessionId}?user_type=agent&token=${accessToken}`;
      const ws = new WebSocket(wsUrl);
      convWsRef.current = ws;

      ws.onopen = () => { if (!destroyed) setWsConnected(true); };
      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.type === 'ping' || raw.type === 'pong') return;
          const newMsg = raw.type === 'message' && raw.message ? raw.message : raw;
          if (!newMsg.id || newMsg.message_type === 'typing') return;
          queryClient.setQueryData<ConvMessage[]>(['convMessages', conversationSessionId], (prev = []) =>
            prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg],
          );
        } catch {}
      };
      ws.onclose = () => {
        if (!destroyed) {
          setWsConnected(false);
          convWsRef.current = null;
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      destroyed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      convWsRef.current?.close();
      convWsRef.current = null;
      setWsConnected(false);
    };
  }, [canChat, conversationAgentId, conversationSessionId]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (!convWsRef.current || convWsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Chat is reconnecting, please try again in a moment');
      return;
    }
    convWsRef.current.send(JSON.stringify({ message: inputValue.trim(), message_type: 'message', sender: 'agent' }));
    setInputValue('');
  };

  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
    setShowScrollBtn(false);
    setUnreadCount(0);
    isAtBottomRef.current = true;
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      isAtBottomRef.current = atBottom;
      if (atBottom) { setShowScrollBtn(false); setUnreadCount(0); }
      else { setShowScrollBtn(true); }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isChatOpen]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isAtBottomRef.current) scrollToBottom(false);
    else setUnreadCount(c => c + 1);
  }, [messages.length]);

  const { position, isDragging, handleMouseDown, setPosition } = useDraggable({
    x: window.innerWidth - 340,
    y: window.innerHeight - 264,
  });

  const handleMinimize = () => {
    setPosition({ x: window.innerWidth - 340, y: window.innerHeight - 264 });
    setIsMinimized(true);
    setIsMaximized(false);
  };

  useEffect(() => {
    if (preloadedToken) return;
    (async () => {
      try {
        const resp = await authFetch(`/api/v1/calls/token?session_id=${sessionId}&user_id=${userId}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error('Failed to get video call token:', e);
        toast.error('Failed to start video call');
        onClose();
      }
    })();
  }, [sessionId, userId, preloadedToken]);

  // Loading state
  if (token === '') {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[99999]">
        <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white font-medium text-lg">Connecting to video call...</p>
          <p className="text-white/60 text-sm">Please wait while we set up your call</p>
        </div>
      </div>,
      document.body
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Single return with ONE LiveKitRoom always at the same structural position.
  // Minimize / maximize only change CSS on the wrapper — the LiveKit WebRTC
  // connection is never torn down by UI state changes.
  // ─────────────────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Backdrop — only in normal/maximized mode */}
      {!isMinimized && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99998] pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      )}

      {/* Main container — same element always, shape changes with state */}
      <div
        className={cn('fixed z-[99999]', isDragging && isMinimized ? 'scale-[1.02]' : 'scale-100')}
        style={
          isMinimized
            ? {
                left: position.x, top: position.y,
                width: 320, height: 240,
                borderRadius: 16, overflow: 'hidden',
                boxShadow: isDragging
                  ? '0 35px 60px -15px rgba(59,130,246,0.5), 0 0 0 2px rgba(59,130,246,0.6)'
                  : '0 25px 50px -12px rgba(59,130,246,0.4)',
                transition: isDragging ? 'none' : 'all 0.2s ease',
              }
            : isMaximized
            ? { inset: 0 }
            : { inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
        }
      >
        {/* Gradient border + inner chrome */}
        <div
          className={cn(
            'bg-gradient-to-r from-indigo-500 to-blue-500',
            isMinimized
              ? 'absolute inset-0 rounded-2xl p-[2px]'
              : isMaximized
              ? 'absolute inset-0 p-[2px]'
              : 'relative w-[95%] h-[95%] max-w-[1600px] rounded-2xl p-[2px]',
          )}
          style={!isMinimized && !isMaximized ? { boxShadow: '0 25px 50px -12px rgba(59,130,246,0.4), 0 0 100px -20px rgba(99,102,241,0.3)' } : undefined}
        >
          <div className={cn(
            'w-full h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900',
            isMinimized || isMaximized ? '' : 'rounded-2xl',
            theme,
          )}>

            {/* Minimized: drag handle overlay */}
            {isMinimized && (
              <div
                className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-white/95 via-white/80 dark:from-slate-900/95 dark:via-slate-900/80 to-transparent"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/20">
                    <GripHorizontal className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-900 dark:text-white/90 text-xs font-medium">Video Call</span>
                  </div>
                </div>
                <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 transition-colors group"
                    title="Expand"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors group"
                    title="End Call"
                  >
                    <X className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Normal / maximized: header */}
            {!isMinimized && (
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-800/95 dark:to-slate-900 border-b border-blue-500/20 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-50 dark:border-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-semibold">Video Call in Progress</h3>
                    <p className="text-blue-500/70 dark:text-blue-300/70 text-xs">Connected • HD Quality</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsChatOpen(p => !p)}
                    className={cn(
                      'px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium group',
                      isChatOpen
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-600 dark:text-blue-200 hover:text-white',
                    )}
                  >
                    <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Chat</span>
                  </button>
                  <button
                    onClick={() => { setIsMaximized(p => !p); setIsMinimized(false); }}
                    className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-2 text-blue-600 dark:text-blue-200 hover:text-white text-sm font-medium group"
                  >
                    {isMaximized
                      ? <Shrink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      : <Expand className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    <span className="hidden sm:inline">{isMaximized ? 'Restore' : 'Maximize'}</span>
                  </button>
                  <button
                    onClick={handleMinimize}
                    className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-2 text-blue-600 dark:text-blue-200 hover:text-white text-sm font-medium group"
                  >
                    <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Minimize</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 transition-all flex items-center gap-2 text-red-300 hover:text-white text-sm font-medium group"
                  >
                    <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">End Call</span>
                  </button>
                </div>
              </div>
            )}

            {/* Video + chat — flex row, video always rendered */}
            <div className="flex-1 overflow-hidden flex min-h-0">
              {/* ── The single LiveKitRoom — always mounted here ── */}
              <div className={cn("flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950 lk-hide-chat-toggle", isMinimized && "lk-mini-controls")}>
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={token}
                  serverUrl={serverUrl}
                  data-lk-theme="default"
                  style={{ height: '100%', width: '100%' }}
                  onDisconnected={onClose}
                  onError={(error) => {
                    console.error('Video call error:', error);
                    toast.error('Video call connection failed');
                    onClose();
                  }}
                >
                  <div className="relative h-full w-full">
                    <VideoConference />
                    {!isMinimized && <VideoBackgroundEffects />}
                  </div>
                </LiveKitRoom>
              </div>

              {/* Chat sidebar — only in normal/maximized mode */}
              {!isMinimized && isChatOpen && (
                <div className="w-[300px] flex flex-col border-l border-blue-500/20 bg-white dark:bg-slate-900">
                  <div className="px-4 py-3 border-b border-blue-500/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Chat</span>
                    </div>
                    {canChat && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`} />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {wsConnected ? 'Live' : 'Reconnecting…'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <div ref={messagesContainerRef} className="h-full p-3 overflow-y-auto">
                      {!canChat ? (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">No conversation linked to this call</p>
                      ) : messages.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">No messages yet</p>
                      ) : (
                        messages.filter(msg => msg.message_type === 'message').map((msg) => {
                          const isAgent = msg.sender === 'agent';
                          return (
                            <div key={msg.id} className={cn('flex w-full mb-2', isAgent ? 'justify-end' : 'justify-start')}>
                              <div className={cn(
                                'max-w-[85%] px-3 py-2 rounded-2xl text-sm',
                                isAgent
                                  ? 'bg-blue-500 text-white rounded-br-sm'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm',
                              )}>
                                {!isAgent && <p className="text-[10px] font-semibold opacity-60 mb-0.5">Customer</p>}
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {showScrollBtn && (
                      <button
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow-lg transition-all"
                      >
                        {unreadCount > 0 && (
                          <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 border-t border-blue-500/20">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Message customer..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600"
                        disabled={!canChat}
                      />
                      <Button size="sm" onClick={handleSend} disabled={!inputValue.trim() || !canChat || !wsConnected}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isMinimized && <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500 flex-shrink-0" />}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
