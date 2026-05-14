import React, { useState } from 'react';
import {
  Bell, CheckCheck, X, Volume2, VolumeX,
  AtSign, MessageSquare, Heart, PhoneMissed, PhoneOff, Phone, CalendarCheck, Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '@/services/notificationService';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

/* ── per-type icon + colour config ──────────────────────────── */
const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  bg: string;
  iconClass: string;
  label: string;
}> = {
  mention:       { icon: AtSign,       bg: 'bg-primary/10',       iconClass: 'text-primary',            label: 'Mention' },
  reply:         { icon: MessageSquare, bg: 'bg-info/10',          iconClass: 'text-info',               label: 'Reply' },
  reaction:      { icon: Heart,         bg: 'bg-warning/10',       iconClass: 'text-warning',            label: 'Reaction' },
  incoming_call:  { icon: Phone,         bg: 'bg-green-500/10',     iconClass: 'text-green-500',          label: 'Incoming call' },
  meeting_invite: { icon: CalendarCheck, bg: 'bg-violet-500/10',   iconClass: 'text-violet-500',         label: 'Meeting invite' },
  missed_call:   { icon: PhoneMissed,   bg: 'bg-destructive/10',   iconClass: 'text-destructive',        label: 'Missed call' },
  call_rejected: { icon: PhoneOff,      bg: 'bg-destructive/10',   iconClass: 'text-destructive',        label: 'Call rejected' },
};

const DEFAULT_TYPE = { icon: Bell, bg: 'bg-muted', iconClass: 'text-muted-foreground', label: 'Notification' };

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? DEFAULT_TYPE;
}

/* ── group label helper ──────────────────────────────────────── */
function groupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return 'Earlier';
}

/* ── relative time ───────────────────────────────────────────── */
function relativeTime(dateStr: string, isRTL: boolean) {
  return formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: isRTL ? ar : undefined,
  });
}

/* ── component ───────────────────────────────────────────────── */
const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();
  const { soundEnabled, enableSound, disableSound } = useNotifications();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notificationUnreadCount'],
    queryFn: getUnreadCount,
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(false),
    enabled: isOpen,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
  };

  const markAsReadMutation  = useMutation({ mutationFn: markAsRead,         onSuccess: invalidate });
  const markAllAsReadMutation = useMutation({ mutationFn: markAllAsRead,    onSuccess: invalidate });
  const deleteMutation       = useMutation({ mutationFn: deleteNotification, onSuccess: invalidate });

  /* navigation routing */
  const getRoute = (n: Notification): string | null => {
    const ch = n.related_channel_id;
    switch (n.notification_type) {
      case 'mention':
      case 'reply':
      case 'reaction':
        return ch ? `/dashboard/team-chat?channelId=${ch}` : '/dashboard/team-chat';
      case 'incoming_call':
      case 'missed_call':
      case 'call_rejected':
        return ch ? `/dashboard/team-chat?channelId=${ch}` : '/dashboard/voice-calls';
      case 'meeting_invite':
        return '/dashboard/calendar';
      default:
        return ch ? `/dashboard/team-chat?channelId=${ch}` : null;
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsReadMutation.mutate(n.id);
    setIsOpen(false);
    const route = getRoute(n);
    if (route) navigate(route);
    onNotificationClick?.(n);
  };

  /* filter + group */
  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  type Group = { label: string; items: Notification[] };
  const groups: Group[] = [];
  const ORDER = ['Today', 'Yesterday', 'Earlier'];
  const byGroup: Record<string, Notification[]> = {};
  visible.forEach(n => {
    const g = groupLabel(n.created_at);
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(n);
  });
  ORDER.forEach(g => { if (byGroup[g]) groups.push({ label: g, items: byGroup[g] }); });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9 rounded-full hover:bg-muted transition-colors',
            className
          )}
        >
          <Bell className={cn('h-[18px] w-[18px] text-muted-foreground transition-colors', isOpen && 'text-foreground')} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 bg-card border-border shadow-[var(--shadow-popover)]"
        align={isRTL ? 'start' : 'end'}
        sideOffset={8}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm text-foreground tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold leading-none">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Sound toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              onClick={() => soundEnabled ? disableSound() : enableSound()}
            >
              {soundEnabled
                ? <Volume2 className="h-3.5 w-3.5" />
                : <VolumeX className="h-3.5 w-3.5" />
              }
            </Button>
            {/* Mark all read */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Mark all as read"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isLoading}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
          {(['all', 'unread'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                filter === tab
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab === 'unread' ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` : 'All'}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <ScrollArea className="max-h-[420px]">
          {isLoading ? (
            /* skeleton */
            <div className="p-3 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
                    <div className="h-2 w-1/3 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {filter === 'unread' ? 'All caught up' : 'No notifications'}
              </p>
              <p className="text-xs text-muted-foreground">
                {filter === 'unread' ? 'No unread notifications.' : "You're up to date."}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  {/* Group header */}
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {label}
                  </p>
                  {items.map((n) => {
                    const { icon: Icon, bg, iconClass } = getTypeConfig(n.notification_type);
                    const hasRoute = !!getRoute(n);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                          'hover:bg-muted/50',
                          !n.is_read && 'bg-primary/[0.03]'
                        )}
                        onClick={() => handleClick(n)}
                      >
                        {/* Unread indicator stripe */}
                        {!n.is_read && (
                          <span className={cn('absolute inset-y-2 w-0.5 rounded-full bg-primary', isRTL ? 'right-0' : 'left-0')} />
                        )}

                        {/* Type icon */}
                        <div className={cn('flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5', bg)}>
                          <Icon className={cn('h-4 w-4', iconClass)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={cn('text-sm leading-snug mb-0.5', n.is_read ? 'text-foreground font-normal' : 'text-foreground font-semibold')}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {n.message.split(/(@\w+)/).map((part, i) =>
                              part.startsWith('@') && part.length > 1
                                ? <span key={i} className="text-primary font-medium">{part}</span>
                                : part
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-muted-foreground/60">
                              {relativeTime(n.created_at, isRTL)}
                            </span>
                            {hasRoute && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                View <ArrowRight className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div className={cn(
                          'absolute top-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                          isRTL ? 'left-2' : 'right-2'
                        )}>
                          {!n.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(n.id); }}
                              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                            title="Dismiss"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ── */}
        {visible.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border">
            <button
              onClick={() => { setIsOpen(false); navigate('/dashboard/notifications'); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
