import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react';
import { VideoBackgroundEffects } from './VideoBackgroundEffects';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
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
import {
  X, Minimize2, Maximize2, GripHorizontal, MessageSquare, Send, ChevronDown,
  Expand, Shrink, UserPlus, UserMinus, Video, VideoOff, UserRoundPlus, Search, Check,
} from 'lucide-react';
import axios from 'axios';
import { inviteToMeeting, getCompanyUsers } from '@/services/calendarService';

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_activity?: boolean;
  sender: { id: number; email: string; first_name?: string; last_name?: string };
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

// ── Participant activity tracker (must live inside <LiveKitRoom>) ─────────────
// Tracks participant count only — message posting is handled by handleLeave (for
// the local user leaving) and the 1500ms timer below (for the local user joining).
// This prevents N duplicate join/leave messages when N clients watch the same channel.
function ParticipantActivityTracker({
  channelId,
  displayName,
  isLastInRoomRef,
}: {
  channelId: number;
  displayName: string;
  isLastInRoomRef: React.MutableRefObject<boolean>;
}) {
  const room = useRoomContext();
  const postedJoin = useRef(false);
  const remoteCountRef = useRef(0);

  useEffect(() => {
    if (!room || postedJoin.current) return;
    postedJoin.current = true;

    const onJoined = (_p: RemoteParticipant) => {
      remoteCountRef.current++;
      isLastInRoomRef.current = false;
    };
    const onLeft = (_p: RemoteParticipant) => {
      remoteCountRef.current = Math.max(0, remoteCountRef.current - 1);
      isLastInRoomRef.current = remoteCountRef.current === 0;
    };

    room.on(RoomEvent.ParticipantConnected, onJoined);
    room.on(RoomEvent.ParticipantDisconnected, onLeft);

    // Snapshot after room syncs existing participants, then post own join message once
    const timer = setTimeout(() => {
      const currentCount = room.remoteParticipants.size;
      remoteCountRef.current = currentCount;
      isLastInRoomRef.current = currentCount === 0;
      createChannelMessage(channelId, `${displayName} joined the meeting`, true).catch(() => {});
    }, 1500);

    return () => {
      clearTimeout(timer);
      room.off(RoomEvent.ParticipantConnected, onJoined);
      room.off(RoomEvent.ParticipantDisconnected, onLeft);
    };
  }, [room, channelId, displayName, isLastInRoomRef]);

  return null;
}

// ── Main modal ────────────────────────────────────────────────────────────────
const InternalVideoCallModal: React.FC = () => {
  const { activeInternalCall, endInternalCall, updateInternalCall } = useVideoCall();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playCallEndSound } = useNotifications();
  const queryClient = useQueryClient();

  // Default false — tracker corrects this after the 1500ms room sync
  const isLastInRoomRef = useRef(false);
  const hasLeftRef = useRef(false);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<number[]>([]);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [draft, setDraft] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const { roomName, livekitToken, livekitUrl, channelId, callId, eventId } = activeInternalCall ?? {};

  // Reset the leave guard whenever a new call starts
  useEffect(() => { hasLeftRef.current = false; }, [callId]);

  const { position, isDragging, handleMouseDown, setPosition } = useDraggable({
    x: window.innerWidth - 340,
    y: window.innerHeight - 264,
  });

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
        } else if (msg.type === 'call_ended' && callId) {
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

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['companyUsers'],
    queryFn: getCompanyUsers,
    enabled: isInviteOpen,
    staleTime: 5 * 60 * 1000,
  });

  const filteredUsers = companyUsers.filter((u) => {
    if (u.id === user?.id) return false;
    const q = inviteSearch.toLowerCase();
    return !q || (u.first_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const handleSendInvites = async () => {
    if (selectedInvitees.length === 0) return;
    setIsSendingInvite(true);
    try {
      if (eventId) {
        await inviteToMeeting(eventId, selectedInvitees);
      } else if (channelId) {
        const token = localStorage.getItem('accessToken');
        const res = await axios.post(
          `${API_BASE_URL}/api/v1/video-calls/channels/${channelId}/invite`,
          { user_ids: selectedInvitees },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // If the backend upgraded a DM channel to a GROUP channel, switch to the new one
        if (res.data?.chat_channel_id && res.data.chat_channel_id !== channelId) {
          updateInternalCall({ channelId: res.data.chat_channel_id });
        }
      }
      setSelectedInvitees([]);
      setIsInviteOpen(false);
    } catch { /* ignore */ } finally {
      setIsSendingInvite(false);
    }
  };

  const sendMutation = useMutation({
    mutationFn: (text: string) => createChannelMessage(Number(channelId!), text),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<ChatMessage[]>(['channelMessages', channelId], (prev = []) =>
        prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage],
      );
    },
  });

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
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    playCallEndSound();
    if (channelId) {
      const name = user?.first_name || user?.email || 'Someone';
      try { await createChannelMessage(Number(channelId), `${name} left the meeting`, true); } catch { /* ignore */ }
    }
    if (isLastInRoomRef.current && eventId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/calendar/events/${eventId}/end-meeting`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        if (channelId) queryClient.invalidateQueries({ queryKey: ['activeVideoCall', channelId] });
      } catch { /* ignore */ }
    }
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
    setIsMaximized(false);
  };

  if (!activeInternalCall || !livekitToken || !livekitUrl || !roomName) return null;

  // ─────────────────────────────────────────────────────────────────────────────
  // IMPORTANT: There is ONE LiveKitRoom rendered in ONE structural position in the
  // tree below. Minimize / maximize only change CSS around it — the component never
  // unmounts, so the LiveKit WebRTC connection is preserved across UI state changes.
  // Two separate return branches (old code) caused the room to disconnect/reconnect
  // on every minimize/maximize toggle.
  // ─────────────────────────────────────────────────────────────────────────────

  return createPortal(
    <>
      {/* Backdrop — only visible in normal/maximized mode */}
      {!isMinimized && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99998] pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      )}

      {/* Main container — same element always, style changes shape */}
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
            : {
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }
        }
      >
        {/* Inner wrapper: gradient border + rounded chrome */}
        <div
          className={cn(
            'bg-gradient-to-r from-indigo-500 to-blue-500',
            isMinimized ? 'absolute inset-0 rounded-2xl p-[2px]' : isMaximized ? 'absolute inset-0 p-[2px]' : 'relative w-[95%] h-[95%] max-w-[1600px] rounded-2xl p-[2px]',
          )}
          style={!isMinimized && !isMaximized ? { boxShadow: '0 25px 50px -12px rgba(59,130,246,0.4), 0 0 100px -20px rgba(99,102,241,0.3)' } : undefined}
        >
          <div className={cn(
            'w-full h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900',
            isMinimized || isMaximized ? '' : 'rounded-2xl',
            theme,
          )}>
            <style>{`
              .lk-video-conference .lk-chat { display: none !important; }
              .lk-control-bar .lk-chat-toggle { display: none !important; }
            `}</style>

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
                    <span className="text-gray-900 dark:text-white/90 text-xs font-medium">Meeting</span>
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
                    onClick={handleLeave}
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
                    <h3 className="text-gray-900 dark:text-white font-semibold">Meeting in Progress</h3>
                    <p className="text-blue-500/70 dark:text-blue-300/70 text-xs">Connected · HD Quality</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(eventId || channelId) && (
                    <button
                      onClick={() => setIsInviteOpen(p => !p)}
                      className={cn('px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium group',
                        isInviteOpen
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-600 dark:text-green-300 hover:text-white'
                      )}
                    >
                      <UserRoundPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Invite</span>
                    </button>
                  )}
                  {channelId && (
                    <button
                      onClick={() => setIsChatOpen(p => !p)}
                      className={cn('px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium group',
                        isChatOpen
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-600 dark:text-blue-200 hover:text-white'
                      )}
                    >
                      <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                  )}
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
                    onClick={handleLeave}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 transition-all flex items-center gap-2 text-red-300 hover:text-white text-sm font-medium group"
                  >
                    <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">End Call</span>
                  </button>
                </div>
              </div>
            )}

            {/* Video area + sidebars */}
            <div className="flex-1 overflow-hidden flex min-h-0">
              {/* ── The single LiveKitRoom — always mounted here ── */}
              <div className={cn("flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950", isMinimized && "lk-mini-controls")}>
                <LiveKitRoom
                  video={true}
                  audio={true}
                  token={livekitToken}
                  serverUrl={livekitUrl}
                  data-lk-theme="default"
                  style={{ height: '100%', width: '100%' }}
                  onDisconnected={handleLeave}
                  onError={(e) => console.error('[InternalVideoCallModal]', e)}
                >
                  {channelId && (
                    <ParticipantActivityTracker
                      channelId={channelId}
                      displayName={user?.first_name || user?.email || 'Someone'}
                      isLastInRoomRef={isLastInRoomRef}
                    />
                  )}
                  <div className="relative h-full w-full">
                    <VideoConference />
                    {!isMinimized && <VideoBackgroundEffects />}
                  </div>
                </LiveKitRoom>
              </div>

              {/* Invite sidebar */}
              {!isMinimized && (eventId || channelId) && isInviteOpen && (
                <div className="w-[280px] flex flex-col border-l border-green-500/20 bg-white dark:bg-slate-900">
                  <div className="px-4 py-3 border-b border-green-500/20 flex items-center gap-2">
                    <UserRoundPlus className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Invite People</span>
                  </div>
                  <div className="p-3 border-b border-green-500/10">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        value={inviteSearch}
                        onChange={(e) => setInviteSearch(e.target.value)}
                        placeholder="Search people…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto py-1">
                    {filteredUsers.length === 0
                      ? <p className="text-center text-xs text-gray-400 mt-6">No users found</p>
                      : filteredUsers.map((u) => {
                          const selected = selectedInvitees.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              onClick={() => setSelectedInvitees(p => selected ? p.filter(id => id !== u.id) : [...p, u.id])}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.first_name || u.email}</p>
                                <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                              </div>
                              {selected && <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                            </button>
                          );
                        })
                    }
                  </div>
                  <div className="p-3 border-t border-green-500/20">
                    <button
                      onClick={handleSendInvites}
                      disabled={selectedInvitees.length === 0 || isSendingInvite}
                      className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                    >
                      {isSendingInvite ? 'Sending…' : `Invite${selectedInvitees.length > 0 ? ` (${selectedInvitees.length})` : ''}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Chat sidebar */}
              {!isMinimized && channelId && isChatOpen && (
                <div className="w-[300px] flex flex-col border-l border-blue-500/20 bg-white dark:bg-slate-900">
                  <div className="px-4 py-3 border-b border-blue-500/20 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Meeting Chat</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <div ref={messagesContainerRef} className="h-full p-3 overflow-y-auto">
                      {messages.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">No messages yet</p>
                      ) : messages.map((msg) => {
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
                      })}
                    </div>
                    {showScrollBtn && (
                      <button
                        onClick={scrollToBottom}
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
                        placeholder="Send a message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        className="text-sm bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600"
                      />
                      <Button size="sm" onClick={handleSend} disabled={!draft.trim()}>
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

export default InternalVideoCallModal;
