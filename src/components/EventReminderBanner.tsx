import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Video, Clock, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { joinMeeting } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { BACKEND_URL } from '@/config/env';

interface ReminderPayload {
  event_id: number;
  title: string;
  start_time: string;
  location?: string;
  livekit_room_name?: string;
  label: string;  // "Starting now" | "in 5 minutes"
}

export default function EventReminderBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startInternalCall } = useVideoCall();
  const [queue, setQueue] = useState<ReminderPayload[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Personal user WebSocket — always connected when logged in
  const wsUrl = user?.id
    ? `${BACKEND_URL.replace(/^http/, 'ws')}/api/v1/ws/user?token=${localStorage.getItem('accessToken')}`
    : null;

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type !== 'calendar_reminder') return;

      const payload: ReminderPayload = msg.payload;

      // Deduplicate — don't show the same event twice at once
      setQueue((prev) =>
        prev.some((r) => r.event_id === payload.event_id) ? prev : [...prev, payload],
      );

      // Also fire a native browser notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notif = new Notification(
          payload.label === 'Starting now'
            ? `Starting now: ${payload.title}`
            : `${payload.title} starts in 5 minutes`,
          {
            body: format(new Date(payload.start_time), 'h:mm a'),
            icon: '/favicon.ico',
            tag: `cal-${payload.event_id}`,
            requireInteraction: false,
          },
        );
        notif.onclick = async () => {
          window.focus();
          notif.close();
          if (payload.livekit_room_name) {
            try {
              const result = await joinMeeting(payload.event_id);
              startInternalCall({
                roomName: result.room_name,
                livekitToken: result.token,
                livekitUrl: result.livekit_url,
                channelId: result.channel_id,
              });
            } catch {
              navigate('/dashboard/calendar');
            }
          } else {
            navigate('/dashboard/calendar');
          }
        };
      }
    } catch {
      // ignore malformed messages
    }
  }, [navigate, startInternalCall]);

  useWebSocket(wsUrl, { onMessage: handleMessage, enabled: !!wsUrl });

  // Request notification permission once
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const dismiss = (eventId: number) =>
    setQueue((prev) => prev.filter((r) => r.event_id !== eventId));

  const handleJoin = async (payload: ReminderPayload) => {
    if (!payload.livekit_room_name) return;
    setJoiningId(payload.event_id);
    try {
      const result = await joinMeeting(payload.event_id);
      dismiss(payload.event_id);
      startInternalCall({
        roomName: result.room_name,
        livekitToken: result.token,
        livekitUrl: result.livekit_url,
        channelId: result.channel_id,
      });
    } catch {
      // silently fail
    } finally {
      setJoiningId(null);
    }
  };

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
      {queue.map((payload) => {
        const start = new Date(payload.start_time);
        const isNow = payload.label === 'Starting now';
        const hasVideo = !!payload.livekit_room_name;

        return (
          <div
            key={payload.event_id}
            className={cn(
              'pointer-events-auto rounded-xl border shadow-2xl p-4',
              'bg-card border-primary/25 shadow-primary/10',
              'animate-in slide-in-from-right-4 fade-in duration-300',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                isNow ? 'bg-primary/20' : 'bg-amber-500/15',
              )}>
                {hasVideo
                  ? <Video className={cn('w-4 h-4', isNow ? 'text-primary' : 'text-amber-400')} />
                  : <Bell className={cn('w-4 h-4', isNow ? 'text-primary' : 'text-amber-400')} />}
              </div>

              <div className="flex-1 min-w-0">
                <span className={cn(
                  'inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  isNow ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-400',
                )}>
                  {isNow ? 'Now' : payload.label}
                </span>
                <p className="text-sm font-semibold text-foreground truncate mt-1">{payload.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>{format(start, 'h:mm a')}</span>
                  {payload.location && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{payload.location.replace(/^https?:\/\//i, '')}</span>
                    </>
                  )}
                </div>
              </div>

              <button onClick={() => dismiss(payload.event_id)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              {hasVideo && (
                <Button size="sm"
                  className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90 gap-1.5"
                  onClick={() => handleJoin(payload)}
                  disabled={joiningId === payload.event_id}>
                  <Video className="w-3 h-3" />
                  {joiningId === payload.event_id ? 'Joining…' : 'Join'}
                </Button>
              )}
              <Button size="sm" variant="outline"
                className={cn('h-7 text-xs border-border/50 text-muted-foreground hover:text-foreground', !hasVideo && 'flex-1')}
                onClick={() => { navigate('/dashboard/calendar'); dismiss(payload.event_id); }}>
                View
              </Button>
              <Button size="sm" variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => dismiss(payload.event_id)}>
                Dismiss
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
