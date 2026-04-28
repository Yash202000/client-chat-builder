import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChannelMessages, createChannelMessage } from '@/services/chatService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useWebSocket } from '@/hooks/use-websocket';
import { API_BASE_URL } from '@/config/api';
import { BACKEND_URL } from '@/config/env';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Minimize2, Maximize2, GripHorizontal, MessageSquare, Send, ChevronDown, Expand, Shrink, UserPlus, UserMinus, Video, VideoOff } from 'lucide-react';
import axios from 'axios';

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_activity?: boolean;
  sender: { id: number; email: string; first_name?: string; last_name?: string };
}

// ── Draggable hook (identical to VideoCallModal) ──────────────────────────────
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

// ── Main modal ────────────────────────────────────────────────────────────────
const InternalVideoCallModal: React.FC = () => {
  const { activeInternalCall, endInternalCall } = useVideoCall();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playCallEndSound } = useNotifications();
  const queryClient = useQueryClient();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const { roomName, livekitToken, livekitUrl, channelId, callId } = activeInternalCall ?? {};

  const { position, isDragging, handleMouseDown, setPosition } = useDraggable({
    x: window.innerWidth - 340,
    y: window.innerHeight - 264,
  });

  // Channel WebSocket
  const wsUrl = channelId
    ? `${BACKEND_URL.replace(/^http/, 'ws')}/api/v1/ws/wschat/${channelId}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_message') {
          queryClient.setQueryData<ChatMessage[]>(['channelMessages', channelId], (prev = []) =>
            prev.some((m) => m.id === msg.payload.id) ? prev : [...prev, msg.payload],
          );
        } else if (msg.type === 'call_ended') {
          handleLeave();
        }
      } catch { /* ignore */ }
    },
  });

  const { data: messages = [] } = useQuery<ChatMessage[], Error>({
    queryKey: ['channelMessages', channelId],
    queryFn: () => getChannelMessages(Number(channelId)),
    enabled: !!channelId,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => createChannelMessage(Number(channelId!), text),
  });

  // Scroll tracking
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      isAtBottomRef.current = atBottom;
      setShowScrollBtn(!atBottom);
      if (atBottom) setUnreadCount(0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [isChatOpen]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isAtBottomRef.current) {
      messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'instant' as ScrollBehavior });
    } else {
      setUnreadCount(c => c + 1);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
    setUnreadCount(0);
    isAtBottomRef.current = true;
  };

  const handleSend = () => {
    if (!draft.trim() || !channelId) return;
    sendMutation.mutate(draft.trim());
    setDraft('');
  };

  const handleLeave = async () => {
    playCallEndSound();
    if (callId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/video-calls/${callId}/end`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    try {
      const prev = localStorage.getItem('previousPresenceStatus') || 'online';
      await axios.post(`${API_BASE_URL}/api/v1/auth/presence?presence_status=${prev}`, {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      localStorage.removeItem('previousPresenceStatus');
    } catch { /* ignore */ }
    endInternalCall();
  };

  const handleMinimize = () => {
    setPosition({ x: window.innerWidth - 340, y: window.innerHeight - 264 });
    setIsMinimized(true);
  };

  if (!activeInternalCall || !livekitToken || !livekitUrl || !roomName) return null;

  // ── Minimized floating draggable window ──────────────────────────────────
  if (isMinimized) {
    return createPortal(
      <div
        className={`fixed rounded-2xl overflow-hidden z-[99999] ${isDragging ? 'scale-[1.02]' : 'scale-100'}`}
        style={{
          left: `${position.x}px`, top: `${position.y}px`,
          width: 320, height: 240,
          boxShadow: isDragging
            ? '0 35px 60px -15px rgba(59,130,246,0.5), 0 0 0 2px rgba(59,130,246,0.6)'
            : '0 25px 50px -12px rgba(59,130,246,0.4)',
          transition: isDragging ? 'none' : 'all 0.2s ease',
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 p-[2px]">
          <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            {/* Drag handle */}
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
                  <span className="text-gray-900 dark:text-white/90 text-xs font-medium">Meeting</span>
                </div>
              </div>
              <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={() => setIsMinimized(false)}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 transition-colors group" title="Maximize">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-300 group-hover:text-white" />
                </button>
                <button onClick={handleLeave}
                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 transition-colors group" title="End Call">
                  <X className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                </button>
              </div>
            </div>
            <div className="w-full h-full">
              <LiveKitRoom video={true} audio={true} token={livekitToken} serverUrl={livekitUrl}
                data-lk-theme="default" style={{ height: '100%', width: '100%' }} onDisconnected={handleLeave}>
                <VideoConference />
              </LiveKitRoom>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Inner content (normal + maximized) ───────────────────────────────────
  const innerContent = (
    <div className={`w-full h-full flex flex-col overflow-hidden ${isMaximized ? '' : 'rounded-2xl'} bg-white dark:bg-slate-900 ${theme}`}>
      {/* Hide LiveKit's built-in chat panel and its toggle button */}
      <style>{`
        .lk-video-conference .lk-chat { display: none !important; }
        .lk-control-bar .lk-chat-toggle { display: none !important; }
      `}</style>

      {/* Gradient header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 via-gray-50 to-gray-50 dark:from-slate-900 dark:via-slate-800/95 dark:to-slate-900 border-b border-blue-500/20">
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
            <h3 className="text-gray-900 dark:text-white font-semibold">Meeting in Progress</h3>
            <p className="text-blue-500/70 dark:text-blue-300/70 text-xs">Connected · HD Quality</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {channelId && (
            <button onClick={() => setIsChatOpen(p => !p)}
              className={cn('px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium group',
                isChatOpen
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-600 dark:text-blue-200 hover:text-white'
              )} title="Toggle Chat">
              <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}
          <button onClick={() => setIsMaximized(p => !p)}
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-2 text-blue-600 dark:text-blue-200 hover:text-white text-sm font-medium group"
            title={isMaximized ? 'Restore' : 'Maximize'}>
            {isMaximized ? <Shrink className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Expand className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            <span className="hidden sm:inline">{isMaximized ? 'Restore' : 'Maximize'}</span>
          </button>
          <button onClick={handleMinimize}
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all flex items-center gap-2 text-blue-600 dark:text-blue-200 hover:text-white text-sm font-medium group"
            title="Minimize">
            <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Minimize</span>
          </button>
          <button onClick={handleLeave}
            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 transition-all flex items-center gap-2 text-red-300 hover:text-white text-sm font-medium group"
            title="End Call">
            <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>

      {/* Video + Chat */}
      <div className="flex-1 overflow-hidden flex">
        {/* Video */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950">
          <LiveKitRoom video={true} audio={true} token={livekitToken} serverUrl={livekitUrl}
            data-lk-theme="default" style={{ height: '100%', width: '100%' }} onDisconnected={handleLeave}
            onError={(e) => console.error('[InternalVideoCallModal]', e)}>
            <VideoConference />
          </LiveKitRoom>
        </div>

        {/* Channel chat sidebar */}
        {channelId && isChatOpen && (
          <div className="w-[300px] flex flex-col border-l border-blue-500/20 bg-white dark:bg-slate-900">
            <div className="px-4 py-3 border-b border-blue-500/20 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Meeting Chat</span>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <div ref={messagesContainerRef} className="h-full p-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">No messages yet</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    if (msg.is_activity) {
                      const c = msg.content.toLowerCase();
                      const Icon = c.includes('joined') ? UserPlus
                        : c.includes('left') ? UserMinus
                        : c.includes('ended') || c.includes('end') ? VideoOff
                        : Video;
                      return (
                        <div key={msg.id} className="flex items-center gap-2 py-0.5 px-1 my-0.5">
                          <Icon className="w-3 h-3 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">{msg.content}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className={cn('flex w-full mb-2', isMe ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] px-3 py-2 rounded-2xl text-sm',
                          isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm')}>
                          {!isMe && <p className="text-[10px] font-semibold opacity-60 mb-0.5">{msg.sender.first_name || msg.sender.email}</p>}
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {showScrollBtn && (
                <button onClick={scrollToBottom}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow-lg transition-all">
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
                <Input placeholder="Send a message…" value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600" />
                <Button size="sm" onClick={handleSend} disabled={!draft.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom gradient accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
    </div>
  );

  // ── Normal / maximized portal ────────────────────────────────────────────
  return createPortal(
    isMaximized ? (
      <div className={`fixed inset-0 z-[99999] ${theme}`}>{innerContent}</div>
    ) : (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[99999]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative w-[95%] h-[95%] max-w-[1600px] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 25px 50px -12px rgba(59,130,246,0.4), 0 0 100px -20px rgba(99,102,241,0.3)' }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 p-[2px]">
            {innerContent}
          </div>
        </div>
      </div>
    ),
    document.body
  );
};

export default InternalVideoCallModal;
