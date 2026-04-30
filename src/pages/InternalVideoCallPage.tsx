import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
import '@livekit/components-styles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createChannelMessage } from '@/services/chatService';
import { inviteToMeeting, getCompanyUsers } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { API_BASE_URL } from '@/config/api';
import { UserRoundPlus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

// Silently records join/leave activity to the backend channel
function MeetingActivityTracker({
  channelId,
  displayName,
  isLastInRoomRef,
}: {
  channelId: number;
  displayName: string;
  isLastInRoomRef: React.MutableRefObject<boolean>;
}) {
  const room = useRoomContext();
  const queryClient = useQueryClient();
  const postedJoin = useRef(false);
  const remoteCountRef = useRef(0);

  const postActivity = useCallback(async (text: string) => {
    try {
      await createChannelMessage(channelId, text, true);
      queryClient.invalidateQueries({ queryKey: ['channelMessages', String(channelId)] });
    } catch { /* ignore */ }
  }, [channelId, queryClient]);

  useEffect(() => {
    if (!room || postedJoin.current) return;
    postedJoin.current = true;

    // Track remote participant count for isLastInRoomRef — no message posting here
    // (each participant posts their own join/leave via the timer below and handleLeave)
    const onJoin = (_p: RemoteParticipant) => {
      remoteCountRef.current++;
      isLastInRoomRef.current = false;
    };
    const onLeave = (_p: RemoteParticipant) => {
      remoteCountRef.current = Math.max(0, remoteCountRef.current - 1);
      isLastInRoomRef.current = remoteCountRef.current === 0;
    };

    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);

    // Delay the initial snapshot so the room has time to sync existing participants.
    // Also posts this user's own join message after confirming room state.
    const timer = setTimeout(() => {
      const currentCount = room.remoteParticipants.size;
      remoteCountRef.current = currentCount;
      isLastInRoomRef.current = currentCount === 0;
      postActivity(`${displayName} joined the meeting`);
    }, 1500);

    return () => {
      clearTimeout(timer);
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, displayName, postActivity, isLastInRoomRef]);

  return null;
}

// Floating invite button + slide-in panel
function InvitePanel({ channelId }: { channelId: number }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  // Look up the active call for this channel to get event_id (calendar meetings only)
  const { data: activeCallInfo } = useQuery({
    queryKey: ['activeVideoCall', channelId],
    queryFn: async () => {
      try {
        const r = await axios.get(
          `${API_BASE_URL}/api/v1/video-calls/channels/${channelId}/active`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
        );
        return r.data as { source: string; event_id?: number };
      } catch { return null; }
    },
    staleTime: 60_000,
  });

  const eventId = activeCallInfo?.event_id;

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['companyUsers'],
    queryFn: getCompanyUsers,
    enabled: isOpen,
    staleTime: 5 * 60_000,
  });

  const filtered = companyUsers.filter((u) => {
    if (u.id === user?.id) return false;
    const q = search.toLowerCase();
    return !q || (u.first_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const handleSend = async () => {
    if (!eventId || selected.length === 0) return;
    setSending(true);
    try {
      await inviteToMeeting(eventId, selected);
      setSelected([]);
      setIsOpen(false);
    } finally {
      setSending(false);
    }
  };

  if (!eventId) return null;

  return (
    <>
      {/* Invite button — fixed top-right inside the call page */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(p => !p)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
            isOpen
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-700 dark:text-green-300'
          )}
        >
          <UserRoundPlus className="w-4 h-4" />
          Invite
        </button>
      </div>

      {/* Slide-in invite panel */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 border-l border-border shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold text-sm text-foreground">Invite People</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.map((u) => {
              const isSelected = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(p => isSelected ? p.filter(id => id !== u.id) : [...p, u.id])}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    isSelected ? 'bg-green-500/15 text-green-700 dark:text-green-300' : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.email}</p>
                    {u.first_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                  </div>
                  {isSelected && <span className="text-green-500 text-xs font-semibold">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t border-border">
            <button
              onClick={handleSend}
              disabled={selected.length === 0 || sending}
              className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-sm font-semibold transition-all"
            >
              {sending ? 'Sending…' : `Invite${selected.length > 0 ? ` (${selected.length})` : ''}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const InternalVideoCallPage: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const { user }  = useAuth();
  const { playCallEndSound } = useNotifications();
  const isLastInRoomRef = useRef(false);

  const queryParams  = new URLSearchParams(location.search);
  const livekitToken = queryParams.get('livekitToken');
  const livekitUrl   = queryParams.get('livekitUrl');
  const channelId    = queryParams.get('channelId');
  const callId       = queryParams.get('callId');
  const eventId      = queryParams.get('eventId');
  const sessionId    = queryParams.get('sessionId');
  const returnTo     = (location.state as { returnTo?: string } | null)?.returnTo || '/dashboard/conversations';

  const handleLeave = async () => {
    if (channelId) {
      const name = user?.first_name || user?.email || 'Someone';
      try { await createChannelMessage(Number(channelId), `${name} left the meeting`, true); } catch { /* ignore */ }
    }
    playCallEndSound();
    // Last participant out — clear the meeting room so others see "Start Call"
    if (isLastInRoomRef.current && eventId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/calendar/events/${eventId}/end-meeting`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    if (callId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/video-calls/${callId}/end`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    if (sessionId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/handoff/end`, { session_id: sessionId },
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    try {
      const prev = localStorage.getItem('previousPresenceStatus') || 'online';
      await axios.post(`${API_BASE_URL}/api/v1/auth/presence?presence_status=${prev}`, {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      localStorage.removeItem('previousPresenceStatus');
    } catch { /* ignore */ }
    navigate(returnTo);
  };

  if (!livekitToken || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading video call...
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-screen h-screen bg-white dark:bg-gray-900 ${theme}`}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={livekitToken}
        serverUrl={livekitUrl}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
        onDisconnected={handleLeave}
        onError={(e) => console.error('[VideoCall]', e)}
      >
        <VideoConference />
        {channelId && (
          <MeetingActivityTracker
            channelId={Number(channelId)}
            displayName={user?.first_name || user?.email || 'Someone'}
            isLastInRoomRef={isLastInRoomRef}
          />
        )}
      </LiveKitRoom>
      {channelId && <InvitePanel channelId={Number(channelId)} />}
    </div>
  );
};

export default InternalVideoCallPage;
