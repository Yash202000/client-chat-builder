import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Video, Clock, X, Bell, PhoneIncoming } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { joinMeeting } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { BACKEND_URL } from '@/config/env';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { startRingtone, stopRingtone } from '@/utils/ringtone';

interface ReminderPayload {
  event_id: number;
  title: string;
  start_time: string;
  location?: string;
  livekit_room_name?: string;
  label: string;
  is_invite?: boolean;
}

export default function EventReminderBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { startInternalCall } = useVideoCall();
  const { playNotificationSound, showDesktopNotification, enableSound } = useNotifications();
  const [queue, setQueue] = useState<ReminderPayload[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Stop ringing when all invites are cleared
  useEffect(() => {
    const hasInvite = queue.some((r) => r.is_invite);
    if (!hasInvite) stopRingtone();
  }, [queue]);

  // Auto-dismiss invites after 30s
  useEffect(() => {
    const invites = queue.filter((r) => r.is_invite);
    if (invites.length === 0) return;
    const timers = invites.map((r) =>
      window.setTimeout(() => {
        setQueue((prev) => prev.filter((x) => x.event_id !== r.event_id));
      }, 30_000)
    );
    return () => timers.forEach(clearTimeout);
  }, [queue.map((r) => r.event_id).join(',')]);

  const wsUrl = user?.id
    ? `${BACKEND_URL.replace(/^http/, 'ws')}/api/v1/ws/user?token=${localStorage.getItem('accessToken')}`
    : null;

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type !== 'calendar_reminder' && msg.type !== 'meeting_invite') return;

      const isInvite = msg.type === 'meeting_invite';
      const payload: ReminderPayload = { ...msg.payload, is_invite: isInvite };

      setQueue((prev) =>
        prev.some((r) => r.event_id === payload.event_id) ? prev : [...prev, payload],
      );

      if (isInvite) {
        startRingtone();
        showDesktopNotification({
          title: `📞 ${payload.label}: ${payload.title}`,
          body: 'Tap to join the meeting',
          icon: '/favicon.ico',
          tag: `invite-${payload.event_id}`,
        });
      } else {
        enableSound().then(() => playNotificationSound()).catch(() => {});
        showDesktopNotification({
          title: payload.label === 'Starting now'
            ? `Starting now: ${payload.title}`
            : `${payload.title} starts in 5 minutes`,
          body: format(new Date(payload.start_time), 'h:mm a'),
          icon: '/favicon.ico',
          tag: `cal-${payload.event_id}`,
        });
      }
    } catch { /* ignore */ }
  }, [enableSound, playNotificationSound, showDesktopNotification]);

  useWebSocket(wsUrl, { onMessage: handleMessage, enabled: !!wsUrl });

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const dismiss = (eventId: number) => {
    setQueue((prev) => {
      const remaining = prev.filter((r) => r.event_id !== eventId);
      if (!remaining.some((r) => r.is_invite)) stopRingtone();
      return remaining;
    });
  };

  const handleJoin = async (payload: ReminderPayload) => {
    if (!payload.livekit_room_name) return;
    stopRingtone();
    setJoiningId(payload.event_id);
    try {
      const result = await joinMeeting(payload.event_id);
      dismiss(payload.event_id);
      startInternalCall({
        roomName: result.room_name,
        livekitToken: result.token,
        livekitUrl: result.livekit_url,
        channelId: result.channel_id,
        eventId: payload.event_id,
      });
    } catch { /* silently fail */ } finally {
      setJoiningId(null);
    }
  };

  return (
    <>
      {queue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-[360px] pointer-events-none">
          {queue.map((payload) => {
            const start = new Date(payload.start_time);
            const isNow = payload.label === 'Starting now' || payload.is_invite;
            const hasVideo = !!payload.livekit_room_name;
            const isInvite = !!payload.is_invite;

            if (isInvite) {
              return (
                <div key={payload.event_id}
                  className={`pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-border bg-card animate-in slide-in-from-bottom-4 fade-in duration-200 ${theme}`}>
                  <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400" />
                  <div className="p-6">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative flex-shrink-0">
                        <span className="absolute inset-0 rounded-full bg-green-400/25 animate-ping" />
                        <span className="absolute inset-[-6px] rounded-full border-2 border-green-400/30 animate-pulse" />
                        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center ring-2 ring-green-400/50 text-white font-bold text-2xl shadow-lg">
                          {payload.title[0]?.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-green-500 uppercase tracking-widest mb-1">
                          Meeting invite
                        </p>
                        <p className="text-foreground font-bold text-lg truncate leading-snug">{payload.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{payload.label} · {format(start, 'h:mm a')}</p>
                      </div>
                      <button onClick={() => dismiss(payload.event_id)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 self-start">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button onClick={() => dismiss(payload.event_id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-500 hover:text-white text-sm font-semibold transition-all group">
                        <PhoneIncoming className="w-4 h-4 rotate-[135deg] group-hover:scale-110 transition-transform" />
                        Decline
                      </button>
                      <button onClick={() => handleJoin(payload)} disabled={joiningId === payload.event_id}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 border border-green-500 text-white text-sm font-semibold transition-all shadow-lg shadow-green-500/25 disabled:opacity-60 group">
                        <Video className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {joiningId === payload.event_id ? 'Joining…' : 'Join now'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            /* Standard reminder card */
            return (
              <div key={payload.event_id}
                className={cn(
                  'pointer-events-auto rounded-xl border shadow-2xl p-4',
                  'bg-popover text-popover-foreground border-primary/25 shadow-primary/10',
                  'animate-in slide-in-from-right-4 fade-in duration-300',
                )}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    isNow ? 'bg-primary/20' : 'bg-amber-500/15')}>
                    {hasVideo
                      ? <Video className={cn('w-4 h-4', isNow ? 'text-primary' : 'text-amber-400')} />
                      : <Bell className={cn('w-4 h-4', isNow ? 'text-primary' : 'text-amber-400')} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      isNow ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-400')}>
                      {isNow ? 'Now' : payload.label}
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate mt-1">{payload.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{format(start, 'h:mm a')}</span>
                      {payload.location && (<><span className="opacity-40">·</span><span className="truncate">{payload.location.replace(/^https?:\/\//i, '')}</span></>)}
                    </div>
                  </div>
                  <button onClick={() => dismiss(payload.event_id)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {hasVideo && (
                    <Button size="sm" className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90 gap-1.5"
                      onClick={() => handleJoin(payload)} disabled={joiningId === payload.event_id}>
                      <Video className="w-3 h-3" />
                      {joiningId === payload.event_id ? 'Joining…' : 'Join'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline"
                    className={cn('h-7 text-xs border-border/50 text-muted-foreground hover:text-foreground', !hasVideo && 'flex-1')}
                    onClick={() => { navigate('/dashboard/calendar'); dismiss(payload.event_id); }}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                    onClick={() => dismiss(payload.event_id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
