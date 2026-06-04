import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  getAvailability, getCompanyUsers, joinMeeting,
} from '@/services/calendarService';
import type { ApiCalEvent, CreateEventDto, CompanyUser } from '@/services/calendarService';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth, addMonths,
  subMonths, addWeeks, subWeeks, addDays, subDays, isToday,
  getHours, getMinutes, setHours, addHours, addMinutes,
  setMinutes, parseISO, startOfDay, endOfDay,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Clock, Users, AlignLeft,
  X, Edit2, Trash2, CalendarDays, LayoutGrid, List,
  MapPin, Video, UserPlus, AlertTriangle, Linkedin, Instagram, Facebook, Rss, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'meeting' | 'task' | 'call' | 'out-of-office' | 'reminder';
type ViewMode = 'month' | 'week' | 'day';
type CalendarTab = 'events' | 'content';

interface CalEvent {
  id: string;
  title: string;
  type: EventType;
  start: Date;
  end: Date;
  isAllDay?: boolean;
  location?: string;
  description?: string;
  attendees?: string[];
  color: string;
  livekit_room_name?: string;
  video_enabled?: boolean;
  recurrence_rule?: string;
  recurrence_interval?: number;
  recurrence_end_date?: string;
}

interface SocialPost {
  id: number;
  platform: string;
  status: string;
  content?: string;
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<EventType, {
  label: string; color: string; bg: string; border: string; dot: string;
  accent: string; gradientFrom: string; gradientTo: string; glowShadow: string; ringColor: string;
}> = {
  meeting:      { label: 'Meeting',      color: 'text-violet-700',  bg: 'bg-violet-500/20', border: 'border-violet-500/60',  dot: 'bg-violet-500',  accent: 'bg-violet-500',  gradientFrom: 'from-violet-100', gradientTo: 'to-violet-50',  glowShadow: 'shadow-violet-300/40',  ringColor: 'ring-violet-400/60'  },
  task:         { label: 'Task',         color: 'text-amber-700',   bg: 'bg-amber-500/20',  border: 'border-amber-500/60',   dot: 'bg-amber-500',   accent: 'bg-amber-500',   gradientFrom: 'from-amber-100',  gradientTo: 'to-amber-50',   glowShadow: 'shadow-amber-300/40',   ringColor: 'ring-amber-400/60'   },
  call:         { label: 'Call',         color: 'text-emerald-700', bg: 'bg-emerald-500/20',border: 'border-emerald-500/60', dot: 'bg-emerald-500', accent: 'bg-emerald-500', gradientFrom: 'from-emerald-100',gradientTo: 'to-emerald-50', glowShadow: 'shadow-emerald-300/40', ringColor: 'ring-emerald-400/60' },
  'out-of-office': { label: 'Out of Office', color: 'text-slate-700', bg: 'bg-slate-500/20', border: 'border-slate-500/60', dot: 'bg-slate-500', accent: 'bg-slate-500', gradientFrom: 'from-slate-100', gradientTo: 'to-slate-50', glowShadow: 'shadow-slate-300/30', ringColor: 'ring-slate-400/50' },
  reminder:     { label: 'Reminder',     color: 'text-cyan-700',    bg: 'bg-cyan-500/20',   border: 'border-cyan-500/60',    dot: 'bg-cyan-500',    accent: 'bg-cyan-500',    gradientFrom: 'from-cyan-100',   gradientTo: 'to-cyan-50',    glowShadow: 'shadow-cyan-300/40',    ringColor: 'ring-cyan-400/60'    },
};

function getEventStatus(event: CalEvent): 'past' | 'current' | 'upcoming' {
  const now = new Date();
  if (event.end < now) return 'past';
  if (event.start <= now && event.end >= now) return 'current';
  return 'upcoming';
}

const SOCIAL_PLATFORMS = {
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', lightBg: 'rgba(10,102,194,0.12)',  Icon: Linkedin  },
  instagram: { label: 'Instagram', color: '#E1306C', lightBg: 'rgba(225,48,108,0.11)', Icon: Instagram },
  facebook:  { label: 'Facebook',  color: '#1877F2', lightBg: 'rgba(24,119,242,0.11)', Icon: Facebook  },
};

const SOCIAL_STATUS_COLORS: Record<string, { color: string; label: string }> = {
  draft:     { color: '#94A3B8', label: 'Draft'     },
  scheduled: { color: '#D97706', label: 'Scheduled' },
  published: { color: '#059669', label: 'Published' },
  failed:    { color: '#E11D48', label: 'Failed'    },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12am – 11pm (all 24 hours)
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 64;

// Timeline free/busy constants
const TL_START = 0;
const TL_END = 24;
const TL_HOURS = TL_END - TL_START;
const TL_HOUR_MARKERS = [0, 3, 6, 9, 12, 15, 18, 21];

// ─── Social posts fetcher ─────────────────────────────────────────────────────

async function fetchSocialPosts(fromDate: string, toDate: string): Promise<SocialPost[]> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(
    `${API_BASE_URL}/api/v1/social/posts?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}&limit=200`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Failed to fetch posts');
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.posts ?? []);
}

function getPostDate(post: SocialPost): Date {
  return new Date(post.scheduled_at ?? post.published_at ?? post.created_at);
}

// ─── User helpers ─────────────────────────────────────────────────────────────

function userDisplayName(u: CompanyUser) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return full || u.email;
}

function userInitials(u: CompanyUser) {
  const f = u.first_name?.[0] ?? '';
  const l = u.last_name?.[0] ?? '';
  return (f + l).toUpperCase() || u.email[0].toUpperCase();
}

// ─── API → CalEvent converter ─────────────────────────────────────────────────

function apiToCalEvent(e: ApiCalEvent): CalEvent {
  return {
    id: String(e.id),
    title: e.title,
    type: (e.event_type as EventType) ?? 'meeting',
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    isAllDay: e.is_all_day,
    location: e.location,
    description: e.description,
    attendees: e.attendees ?? [],
    color: EVENT_TYPE_META[(e.event_type as EventType) ?? 'meeting']?.dot ?? '',
    livekit_room_name: e.livekit_room_name,
    video_enabled: e.video_enabled,
    recurrence_rule: e.recurrence_rule,
    recurrence_interval: e.recurrence_interval,
    recurrence_end_date: e.recurrence_end_date,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTimeRange(start: Date, end: Date) {
  return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
}

function toDatetimeLocal(d: Date) { return format(d, "yyyy-MM-dd'T'HH:mm"); }
function fromDatetimeLocal(s: string): Date { return parseISO(s); }

// ─── Shared sub-components ────────────────────────────────────────────────────

function TimeColumn() {
  return (
    <div className="w-16 flex-shrink-0 border-r border-border/30">
      {HOURS.map((h) => (
        <div key={h} className="relative border-b border-border/20" style={{ height: HOUR_HEIGHT }}>
          <span className="absolute top-1 right-2 text-[10px] font-mono text-muted-foreground">
            {h === 0 ? '12 AM' : h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
          </span>
        </div>
      ))}
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const h = getHours(now) + getMinutes(now) / 60;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: h * HOUR_HEIGHT }}>
      <div className="w-2 h-2 rounded-full bg-primary ml-0.5 flex-shrink-0" />
      <div className="flex-1 h-px bg-primary/70" />
    </div>
  );
}

function WeekCurrentTimeIndicator({ days }: { days: Date[] }) {
  const now = new Date();
  const h = getHours(now) + getMinutes(now) / 60;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none flex" style={{ top: h * HOUR_HEIGHT }}>
      {days.map((day) => (
        isToday(day) ? (
          <div key={day.toISOString()} className="flex-1 flex items-center">
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1 h-px bg-primary/70" />
          </div>
        ) : (
          <div key={day.toISOString()} className="flex-1 h-px border-t border-dashed border-muted-foreground/25 self-center" />
        )
      ))}
    </div>
  );
}

// ─── Event components ─────────────────────────────────────────────────────────

function EventPill({ event, onClick }: { event: CalEvent; onClick: (e: React.MouseEvent, ev: CalEvent) => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const status = getEventStatus(event);
  const isPast = status === 'past';
  const isCurrent = status === 'current';

  return (
    <button
      onClick={(e) => onClick(e, event)}
      title={event.title}
      className={cn(
        'group w-full text-left text-[11px] rounded overflow-hidden flex items-stretch transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-md active:scale-[0.99]',
        isCurrent && cn('ring-1 shadow-sm', meta.ringColor, meta.glowShadow),
      )}
    >
      {/* left accent bar */}
      <span className={cn('w-[3px] flex-shrink-0', meta.accent, isPast && 'opacity-40', isCurrent && 'animate-pulse')} />

      {/* body */}
      {isPast ? (
        <span className="flex-1 flex items-center gap-1 px-1.5 py-[3px] bg-muted/20">
          <span className={cn('text-[9px] font-bold flex-shrink-0', meta.color, 'opacity-70')}>✓</span>
          {event.recurrence_rule && <span className="text-[10px] text-muted-foreground/40 flex-shrink-0">↻</span>}
          <span className="truncate font-medium text-muted-foreground/70 line-through">{event.title}</span>
        </span>
      ) : (
        <span className={cn(
          'flex-1 flex items-center gap-1 px-1.5 py-[3px] bg-gradient-to-r',
          meta.gradientFrom, meta.gradientTo,
          'group-hover:brightness-110 transition-all duration-200',
        )}>
          {isCurrent
            ? <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse', meta.accent)} />
            : <span className={cn('w-1 h-1 rounded-full flex-shrink-0 opacity-80', meta.dot)} />
          }
          {event.livekit_room_name && <span className="flex-shrink-0 text-[9px] opacity-75">📹</span>}
          {event.recurrence_rule && <span className={cn('flex-shrink-0 text-[10px] font-mono opacity-60', meta.color)}>↻</span>}
          <span className={cn('truncate font-semibold tracking-tight', meta.color)}>{event.title}</span>
        </span>
      )}
    </button>
  );
}

function TimeEventBlock({ event, onEventClick }: { event: CalEvent; onEventClick: (e: React.MouseEvent, ev: CalEvent) => void }) {
  const meta = EVENT_TYPE_META[event.type];
  const status = getEventStatus(event);
  const isPast = status === 'past';
  const isCurrent = status === 'current';
  const startH = getHours(event.start) + getMinutes(event.start) / 60;
  const endH = getHours(event.end) + getMinutes(event.end) / 60;
  const top = startH * HOUR_HEIGHT;
  const height = Math.max((endH - startH) * HOUR_HEIGHT, 20);

  return (
    <button
      onClick={(e) => onEventClick(e, event)}
      title={event.title}
      style={{ top, height }}
      className={cn(
        'absolute left-0.5 right-0.5 flex overflow-hidden rounded-r-md text-left',
        'transition-all duration-200 hover:z-10 hover:brightness-110 hover:shadow-xl',
        isCurrent && cn('ring-1 shadow-lg', meta.ringColor, meta.glowShadow),
      )}
    >
      {/* left accent bar */}
      <div className={cn('w-[3px] flex-shrink-0', meta.accent, isPast && 'opacity-40', isCurrent && 'animate-pulse')} />

      {/* body */}
      {isPast ? (
        <div className="flex-1 min-w-0 px-1.5 py-1 bg-muted/15">
          <p className="text-[11px] font-medium leading-tight flex items-center gap-1">
            <span className={cn('text-[10px] flex-shrink-0 opacity-70', meta.color)}>✓</span>
            {event.recurrence_rule && <span className="flex-shrink-0 opacity-50 text-[10px] text-muted-foreground">↻</span>}
            <span className="truncate text-muted-foreground/70 line-through">{event.title}</span>
          </p>
          {height > 34 && (
            <p className="text-[10px] text-muted-foreground/40 font-mono mt-0.5 truncate">
              {formatTimeRange(event.start, event.end)}
            </p>
          )}
        </div>
      ) : (
        <div className={cn('flex-1 min-w-0 px-1.5 py-1 bg-gradient-to-br', meta.gradientFrom, meta.gradientTo)}>
          <p className={cn('text-[11px] font-semibold leading-tight flex items-center gap-1 min-w-0', meta.color)}>
            {isCurrent && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse', meta.accent)} />}
            {event.livekit_room_name && <span className="flex-shrink-0 text-[10px]">📹</span>}
            {event.recurrence_rule && <span className="flex-shrink-0 opacity-60 text-[10px]">↻</span>}
            <span className="truncate">{event.title}</span>
          </p>
          {height > 34 && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate opacity-75">
              {formatTimeRange(event.start, event.end)}
            </p>
          )}
          {height > 54 && event.location && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate opacity-60">📍 {event.location}</p>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Social post components ───────────────────────────────────────────────────

function SocialPostChip({ post, onEdit }: { post: SocialPost; onEdit: (e: React.MouseEvent) => void }) {
  const plat = SOCIAL_PLATFORMS[post.platform as keyof typeof SOCIAL_PLATFORMS] ?? SOCIAL_PLATFORMS.linkedin;
  const Icon = plat.Icon;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit(e); }}
      title={post.content}
      className="w-full text-left text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 truncate transition-all hover:brightness-110"
      style={{ borderLeft: `3px solid ${plat.color}`, background: plat.lightBg }}
    >
      <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: plat.color }} />
      <span className="truncate text-foreground/80">{post.content?.slice(0, 24) ?? 'Post'}</span>
    </button>
  );
}

function SocialPostTimeBlock({ post, onEdit }: { post: SocialPost; onEdit: (e: React.MouseEvent) => void }) {
  const plat = SOCIAL_PLATFORMS[post.platform as keyof typeof SOCIAL_PLATFORMS] ?? SOCIAL_PLATFORMS.linkedin;
  const Icon = plat.Icon;
  const date = getPostDate(post);
  const h = getHours(date) + getMinutes(date) / 60;
  if (h < 7 || h > 20) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit(e); }}
      title={post.content}
      className="absolute left-0.5 right-0.5 rounded px-1.5 py-1 text-left transition-all hover:brightness-110 hover:z-10 hover:shadow-md"
      style={{ top: h * HOUR_HEIGHT, height: 40, borderLeft: `3px solid ${plat.color}`, background: plat.lightBg }}
    >
      <div className="flex items-center gap-1">
        <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: plat.color }} />
        <p className="text-[10px] font-medium truncate" style={{ color: plat.color }}>
          {post.content?.slice(0, 22) ?? 'Post'}
        </p>
      </div>
      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{format(date, 'h:mm a')}</p>
    </button>
  );
}

// ─── Event calendar views ─────────────────────────────────────────────────────

function DayCell({ day, events, currentMonth, onDayClick, onEventClick }: {
  day: Date; events: CalEvent[]; currentMonth: Date;
  onDayClick: (d: Date) => void; onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const today = isToday(day);
  const inMonth = isSameMonth(day, currentMonth);
  const visible = events.slice(0, 3);
  const overflow = events.length - 3;
  return (
    <div onClick={() => onDayClick(day)} className={cn('min-h-[100px] p-1.5 border-b border-r border-border/30 cursor-pointer transition-colors hover:bg-white/4', !inMonth && 'opacity-40')}>
      <div className="flex items-center justify-center mb-1">
        <span className={cn('font-mono text-xs w-6 h-6 flex items-center justify-center rounded-full', today ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/40 ring-offset-1 ring-offset-background' : 'text-muted-foreground')}>
          {format(day, 'd')}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map((ev) => <EventPill key={ev.id} event={ev} onClick={onEventClick} />)}
        {overflow > 0 && <p className="text-[10px] text-muted-foreground pl-1 font-mono">+{overflow} more</p>}
      </div>
    </div>
  );
}

function MonthView({ currentDate, events, onDayClick, onEventClick }: {
  currentDate: Date; events: CalEvent[];
  onDayClick: (d: Date) => void; onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) });
  const eventsOnDay = useCallback((day: Date) => events.filter((ev) => isSameDay(ev.start, day)), [events]);
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/30">
        {WEEK_DAYS.map((d) => <div key={d} className="py-2 text-center text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-7 border-l border-t border-border/30 overflow-auto">
        {days.map((day) => <DayCell key={day.toISOString()} day={day} events={eventsOnDay(day)} currentMonth={currentDate} onDayClick={onDayClick} onEventClick={onEventClick} />)}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, onEventClick, onDayClick, onSlotDoubleClick }: {
  currentDate: Date; events: CalEvent[];
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
  onDayClick: (d: Date) => void; onSlotDoubleClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const eventsOnDay = useCallback((day: Date) => events.filter((ev) => isSameDay(ev.start, day)), [events]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const nowTop = (getHours(now) + getMinutes(now) / 60) * HOUR_HEIGHT;
    scrollRef.current.scrollTop = Math.max(0, nowTop - scrollRef.current.clientHeight / 2);
  }, []);
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Fixed day-name header — sits above the scroll area */}
      <div className="flex flex-shrink-0 border-b border-border/30 bg-card/95 backdrop-blur-sm">
        <div className="w-16 flex-shrink-0 border-r border-border/30" />
        <div className="flex-1 grid grid-cols-7">
          {days.map((day) => (
            <div key={day.toISOString()} className="h-10 flex flex-col items-center justify-center gap-0.5 border-r border-border/30 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onDayClick(day)}>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">{format(day, 'EEE')}</span>
              <span className={cn('text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full', isToday(day) ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground')}>{format(day, 'd')}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Scrollable body — TimeColumn scrolls together with the event grid */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
        <div className="flex">
          <TimeColumn />
          <div className="relative flex-1">
            <div className="grid grid-cols-7">
              {days.map((day) => (
                <div key={day.toISOString()} className="relative border-r border-border/20">
                  {HOURS.map((h, idx) => (
                    <div key={h} className="border-b border-border/15 cursor-cell hover:bg-primary/5 transition-colors" style={{ height: HOUR_HEIGHT }}
                      onDoubleClick={(e) => { const s = Math.round((e.nativeEvent.offsetY / HOUR_HEIGHT) * 60 / 15) * 15; onSlotDoubleClick(setMinutes(setHours(day, h), s >= 60 ? 59 : s)); }} />
                  ))}
                  <div className="absolute inset-0 pointer-events-none">
                    {eventsOnDay(day).map((ev) => <div key={ev.id} className="pointer-events-auto"><TimeEventBlock event={ev} onEventClick={onEventClick} /></div>)}
                  </div>
                </div>
              ))}
            </div>
            <WeekCurrentTimeIndicator days={days} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick, onSlotDoubleClick }: {
  currentDate: Date; events: CalEvent[];
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
  onSlotDoubleClick: (date: Date) => void;
}) {
  const dayEvents = useMemo(() => events.filter((ev) => isSameDay(ev.start, currentDate)).sort((a, b) => a.start.getTime() - b.start.getTime()), [events, currentDate]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const nowTop = (getHours(now) + getMinutes(now) / 60) * HOUR_HEIGHT;
    scrollRef.current.scrollTop = Math.max(0, nowTop - scrollRef.current.clientHeight / 2);
  }, []);
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0 h-10 border-b border-border/30 flex items-center px-4 bg-card/95 backdrop-blur-sm">
        <span className={cn('font-display text-sm font-semibold', isToday(currentDate) ? 'text-primary' : 'text-foreground')}>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
        {isToday(currentDate) && <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border-primary/30">Today</Badge>}
      </div>
      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
        <div className="flex">
          <TimeColumn />
          <div className="relative flex-1">
            {HOURS.map((h, idx) => (
              <div key={h} className="border-b border-border/20 cursor-cell hover:bg-primary/5 transition-colors" style={{ height: HOUR_HEIGHT }}
                onDoubleClick={(e) => { const s = Math.round((e.nativeEvent.offsetY / HOUR_HEIGHT) * 60 / 15) * 15; onSlotDoubleClick(setMinutes(setHours(currentDate, h), s >= 60 ? 59 : s)); }} />
            ))}
            <div className="absolute inset-0 pointer-events-none">
              {dayEvents.map((ev) => <div key={ev.id} className="pointer-events-auto"><TimeEventBlock event={ev} onEventClick={onEventClick} /></div>)}
            </div>
            {isToday(currentDate) && <CurrentTimeIndicator />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Content calendar views ───────────────────────────────────────────────────

function ContentMonthView({ currentDate, posts, platformFilter, navigate }: {
  currentDate: Date; posts: SocialPost[]; platformFilter: string; navigate: (url: string) => void;
}) {
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) });
  const filtered = platformFilter === 'all' ? posts : posts.filter((p) => p.platform === platformFilter);
  const postsOnDay = (day: Date) => filtered.filter((p) => isSameDay(getPostDate(p), day));
  const composeUrl = (day: Date) => `/dashboard/social/compose?date=${format(day, 'yyyy-MM-dd')}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/30">
        {WEEK_DAYS.map((d) => <div key={d} className="py-2 text-center text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 border-l border-t border-border/30 overflow-auto">
        {days.map((day) => {
          const dayPosts = postsOnDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} onClick={() => navigate(composeUrl(day))}
              className={cn('group min-h-[100px] p-1.5 border-b border-r border-border/30 cursor-pointer transition-colors hover:bg-white/4', !inMonth && 'opacity-40')}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn('font-mono text-xs w-6 h-6 flex items-center justify-center rounded-full', today ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/40 ring-offset-1 ring-offset-background' : 'text-muted-foreground')}>
                  {format(day, 'd')}
                </span>
                <button className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  onClick={(e) => { e.stopPropagation(); navigate(composeUrl(day)); }}>
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <SocialPostChip key={post.id} post={post} onEdit={(e) => { e.stopPropagation(); navigate(`/dashboard/social/compose?edit=${post.id}`); }} />
                ))}
                {dayPosts.length > 3 && <p className="text-[10px] text-muted-foreground pl-1 font-mono">+{dayPosts.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentWeekView({ currentDate, posts, platformFilter, navigate }: {
  currentDate: Date; posts: SocialPost[]; platformFilter: string; navigate: (url: string) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const filtered = platformFilter === 'all' ? posts : posts.filter((p) => p.platform === platformFilter);
  const postsOnDay = (day: Date) => filtered.filter((p) => isSameDay(getPostDate(p), day));

  return (
    <div className="flex-1 flex overflow-hidden">
      <TimeColumn />
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b border-border/30 sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          {days.map((day) => (
            <div key={day.toISOString()} className="h-10 flex flex-col items-center justify-center gap-0.5 border-r border-border/30">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">{format(day, 'EEE')}</span>
              <span className={cn('text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full', isToday(day) ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground')}>{format(day, 'd')}</span>
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-7">
          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-r border-border/20">
              {HOURS.map((h) => (
                <div key={h} className="border-b border-border/15 cursor-pointer hover:bg-primary/5 transition-colors" style={{ height: HOUR_HEIGHT }}
                  onDoubleClick={() => navigate(`/dashboard/social/compose?date=${format(day, 'yyyy-MM-dd')}`)} />
              ))}
              <div className="absolute inset-0 pointer-events-none">
                {postsOnDay(day).map((post) => (
                  <div key={post.id} className="pointer-events-auto">
                    <SocialPostTimeBlock post={post} onEdit={(e) => { e.stopPropagation(); navigate(`/dashboard/social/compose?edit=${post.id}`); }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentDayView({ currentDate, posts, platformFilter, navigate }: {
  currentDate: Date; posts: SocialPost[]; platformFilter: string; navigate: (url: string) => void;
}) {
  const filtered = platformFilter === 'all' ? posts : posts.filter((p) => p.platform === platformFilter);
  const dayPosts = useMemo(() => filtered.filter((p) => isSameDay(getPostDate(p), currentDate)).sort((a, b) => getPostDate(a).getTime() - getPostDate(b).getTime()), [filtered, currentDate]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <TimeColumn />
      <div className="flex-1 overflow-auto">
        <div className="h-10 border-b border-border/30 flex items-center justify-between px-4 sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className={cn('font-display text-sm font-semibold', isToday(currentDate) ? 'text-primary' : 'text-foreground')}>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
            {isToday(currentDate) && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Today</Badge>}
          </div>
          <button onClick={() => navigate(`/dashboard/social/compose?date=${format(currentDate, 'yyyy-MM-dd')}`)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-3 h-3" /> Schedule post
          </button>
        </div>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-border/20 cursor-pointer hover:bg-primary/5 transition-colors" style={{ height: HOUR_HEIGHT }}
              onDoubleClick={() => navigate(`/dashboard/social/compose?date=${format(currentDate, 'yyyy-MM-dd')}`)} />
          ))}
          <div className="absolute inset-0 pointer-events-none">
            {dayPosts.map((post) => (
              <div key={post.id} className="pointer-events-auto">
                <SocialPostTimeBlock post={post} onEdit={(e) => { e.stopPropagation(); navigate(`/dashboard/social/compose?edit=${post.id}`); }} />
              </div>
            ))}
          </div>
          {isToday(currentDate) && <CurrentTimeIndicator />}
        </div>
      </div>
    </div>
  );
}

// ─── Free/Busy Timeline ───────────────────────────────────────────────────────

function FreeBusyTimeline({ attendees, availability, selectedStart, selectedEnd }: {
  attendees: CompanyUser[]; availability: Record<string, ApiCalEvent[]>;
  selectedStart: Date; selectedEnd: Date;
}) {
  if (attendees.length === 0) return null;
  const toPercent = (d: Date) => Math.max(0, Math.min(100, ((getHours(d) + getMinutes(d) / 60 - TL_START) / TL_HOURS) * 100));
  const selLeft = toPercent(selectedStart);
  const selWidth = Math.max(toPercent(selectedEnd) - selLeft, 0.5);
  const conflictCount = attendees.filter((a) => (availability[String(a.id)] ?? []).some((ev) => new Date(ev.start_time) < selectedEnd && new Date(ev.end_time) > selectedStart)).length;

  return (
    <div className="space-y-2 pt-1 border-t border-border/20 mt-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Availability</span>
        {conflictCount > 0
          ? <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium"><AlertTriangle className="w-3 h-3" />{conflictCount} conflict{conflictCount > 1 ? 's' : ''} at selected time</div>
          : <span className="text-[10px] text-emerald-400 font-medium">All free</span>}
      </div>
      <div className="flex ml-[72px]">
        {TL_HOUR_MARKERS.map((h) => (
          <div key={h} className="text-[9px] font-mono text-muted-foreground/50 leading-none" style={{ width: `${(2 / TL_HOURS) * 100}%` }}>
            {h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
          </div>
        ))}
      </div>
      {attendees.map((a) => {
        const evs = availability[String(a.id)] ?? [];
        const hasConflict = evs.some((ev) => new Date(ev.start_time) < selectedEnd && new Date(ev.end_time) > selectedStart);
        return (
          <div key={a.id} className="flex items-center gap-2">
            <div className="w-[68px] flex-shrink-0 text-right">
              <span className={cn('text-[10px] font-medium truncate', hasConflict ? 'text-amber-400' : 'text-muted-foreground')}>{a.first_name || a.email.split('@')[0]}</span>
            </div>
            <div className="flex-1 h-4 bg-muted/20 rounded-sm relative overflow-hidden border border-border/20">
              <div className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/40" style={{ left: `${selLeft}%`, width: `${selWidth}%` }} />
              {evs.map((ev) => {
                const left = toPercent(new Date(ev.start_time));
                const width = Math.max(toPercent(new Date(ev.end_time)) - left, 0.5);
                return <div key={ev.id} title={ev.title} className="absolute top-0 bottom-0 bg-rose-500/60 rounded-[1px]" style={{ left: `${left}%`, width: `${width}%` }} />;
              })}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-0.5">
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><div className="w-3 h-2 rounded-[1px] bg-rose-500/60" /> Busy</div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><div className="w-3 h-2 rounded-[1px] bg-primary/25 border border-primary/40" /> Selected slot</div>
      </div>
    </div>
  );
}

// ─── Create/Edit Event Modal ──────────────────────────────────────────────────

interface EventForm {
  title: string; type: EventType; isAllDay: boolean;
  startStr: string; endStr: string; location: string; description: string;
  enableVideo: boolean;
  recurrenceRule: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceInterval: number;
  recurrenceEndDate: string;
}

const QUICK_DURATIONS = [
  { label: '15m', minutes: 15 }, { label: '30m', minutes: 30 },
  { label: '1h',  minutes: 60 }, { label: '1.5h', minutes: 90 },
  { label: '2h',  minutes: 120 },{ label: '3h',   minutes: 180 },
];

function CreateEventModal({ open, onClose, onSave, editing, defaultStart }: {
  open: boolean; onClose: () => void; onSave: (ev: CalEvent) => void;
  editing: CalEvent | null; defaultStart: Date;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EventForm>({ title: '', type: 'meeting', isAllDay: false, startStr: toDatetimeLocal(defaultStart), endStr: toDatetimeLocal(addHours(defaultStart, 1)), location: '', description: '', enableVideo: true, recurrenceRule: 'none', recurrenceInterval: 1, recurrenceEndDate: '' });
  const [selectedAttendees, setSelectedAttendees] = useState<CompanyUser[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: allUsers = [] } = useQuery<CompanyUser[]>({ queryKey: ['companyUsers'], queryFn: getCompanyUsers, staleTime: 5 * 60 * 1000, enabled: open });

  const suggestions = useMemo(() => {
    const q = attendeeSearch.toLowerCase().trim();
    return allUsers.filter((u) => !selectedAttendees.some((a) => a.id === u.id) && (q === '' || userDisplayName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q))).slice(0, 6);
  }, [allUsers, selectedAttendees, attendeeSearch]);

  const currentStart = useMemo(() => { try { return form.isAllDay ? startOfDay(parseISO(form.startStr)) : fromDatetimeLocal(form.startStr); } catch { return defaultStart; } }, [form.startStr, form.isAllDay, defaultStart]);
  const currentEnd = useMemo(() => { try { return form.isAllDay ? endOfDay(parseISO(form.startStr)) : fromDatetimeLocal(form.endStr); } catch { return addHours(defaultStart, 1); } }, [form.endStr, form.startStr, form.isAllDay, defaultStart]);

  const { data: availability = {} } = useQuery<Record<string, ApiCalEvent[]>>({
    queryKey: ['freeBusy', selectedAttendees.map((a) => a.id).join(','), format(currentStart, 'yyyy-MM-dd')],
    queryFn: () => getAvailability(selectedAttendees.map((a) => a.id), startOfDay(currentStart), endOfDay(currentStart)),
    enabled: open && selectedAttendees.length > 0,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, type: editing.type, isAllDay: editing.isAllDay ?? false, startStr: editing.isAllDay ? format(editing.start, 'yyyy-MM-dd') : toDatetimeLocal(editing.start), endStr: toDatetimeLocal(editing.end), location: editing.location ?? '', description: editing.description ?? '', enableVideo: !!editing.livekit_room_name, recurrenceRule: (editing.recurrence_rule as EventForm['recurrenceRule']) || 'none', recurrenceInterval: editing.recurrence_interval || 1, recurrenceEndDate: editing.recurrence_end_date ? editing.recurrence_end_date.split('T')[0] : '' });
      if (editing.attendees && allUsers.length > 0) setSelectedAttendees(editing.attendees.map((email) => allUsers.find((u) => u.email === email)).filter((u): u is CompanyUser => u !== undefined));
      else setSelectedAttendees([]);
    } else {
      setForm({ title: '', type: 'meeting', isAllDay: false, startStr: toDatetimeLocal(defaultStart), endStr: toDatetimeLocal(addHours(defaultStart, 1)), location: '', description: '', enableVideo: true, recurrenceRule: 'none', recurrenceInterval: 1, recurrenceEndDate: '' });
      setSelectedAttendees([]);
    }
    setAttendeeSearch(''); setShowSuggestions(false);
  }, [editing, open, defaultStart]);

  const field = <K extends keyof EventForm>(k: K, v: EventForm[K]) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === 'type') {
      next.enableVideo = v === 'meeting' || v === 'call';
    }
    return next;
  });

  const handleStartChange = (s: string) => {
    try {
      const dur = Math.max(fromDatetimeLocal(form.endStr).getTime() - fromDatetimeLocal(form.startStr).getTime(), 0);
      const ns = fromDatetimeLocal(s);
      setForm((f) => ({ ...f, startStr: s, endStr: toDatetimeLocal(new Date(ns.getTime() + dur)) }));
    } catch { setForm((f) => ({ ...f, startStr: s })); }
  };

  const setQuickDuration = (minutes: number) => { try { setForm((f) => ({ ...f, endStr: toDatetimeLocal(addMinutes(fromDatetimeLocal(f.startStr), minutes)) })); } catch {} };

  const toggleAllDay = (on: boolean) => {
    if (on) { setForm((f) => ({ ...f, isAllDay: true, startStr: f.startStr.split('T')[0] || format(defaultStart, 'yyyy-MM-dd') })); }
    else { const d = form.startStr.includes('T') ? form.startStr.split('T')[0] : form.startStr; const timeStr = format(defaultStart, 'HH:mm'); setForm((f) => ({ ...f, isAllDay: false, startStr: `${d}T${timeStr}`, endStr: toDatetimeLocal(addHours(fromDatetimeLocal(`${d}T${timeStr}`), 1)) })); }
  };

  const addAttendee = (u: CompanyUser) => { setSelectedAttendees((p) => [...p, u]); setAttendeeSearch(''); setShowSuggestions(false); setTimeout(() => searchRef.current?.focus(), 50); };
  const removeAttendee = (id: number) => setSelectedAttendees((p) => p.filter((a) => a.id !== id));

  const handleSave = () => {
    if (!form.title.trim()) return;
    let start: Date, end: Date;
    if (form.isAllDay) { const d = parseISO(form.startStr); start = startOfDay(d); end = endOfDay(d); }
    else { start = fromDatetimeLocal(form.startStr); end = fromDatetimeLocal(form.endStr); }

    const roomName = form.enableVideo
      ? (editing?.livekit_room_name ?? `meeting-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`)
      : undefined;

    onSave({
      id: editing?.id ?? '',
      title: form.title.trim(),
      type: form.type,
      start,
      end,
      isAllDay: form.isAllDay,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      attendees: selectedAttendees.map((a) => a.email),
      color: EVENT_TYPE_META[form.type].dot,
      livekit_room_name: roomName,
      recurrence_rule: form.recurrenceRule !== 'none' ? form.recurrenceRule : undefined,
      recurrence_interval: form.recurrenceRule !== 'none' ? form.recurrenceInterval : undefined,
      recurrence_end_date: form.recurrenceRule !== 'none' && form.recurrenceEndDate ? `${form.recurrenceEndDate}T23:59:59` : undefined,
    });
    onClose();
  };

  const durMs = currentEnd.getTime() - currentStart.getTime();
  const isVideoLink = /^https?:\/\//i.test(form.location);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl bg-card border-border/50 shadow-aurora-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-lg font-semibold">{editing ? t('calendar.editEvent') : t('calendar.newEvent')}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-1">
          <Input value={form.title} onChange={(e) => field('title', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} placeholder={t('calendar.addTitlePlaceholder')} className="bg-background/60 border-border/50 text-base font-medium h-11" autoFocus />

          <div className="flex items-center gap-3">
            <Select value={form.type} onValueChange={(v) => field('type', v as EventType)}>
              <SelectTrigger className="w-40 bg-background/60 border-border/50 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(EVENT_TYPE_META) as [EventType, (typeof EVENT_TYPE_META)[EventType]][]).map(([key, meta]) => (
                  <SelectItem key={key} value={key}><div className="flex items-center gap-2"><span className={cn('w-2 h-2 rounded-full', meta.dot)} />{t(`calendar.eventTypes.${key === 'out-of-office' ? 'outOfOffice' : key}`)}</div></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
              <button type="button" role="switch" aria-checked={form.isAllDay} onClick={() => toggleAllDay(!form.isAllDay)} className={cn('w-9 h-5 rounded-full relative transition-colors', form.isAllDay ? 'bg-primary' : 'bg-muted')}>
                <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', form.isAllDay && 'translate-x-4')} />
              </button>
              <span className="text-xs text-muted-foreground">All day</span>
            </label>
          </div>

          {form.isAllDay ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
              <Input type="date" value={form.startStr} onChange={(e) => field('startStr', e.target.value)} className="bg-background/60 border-border/50 font-mono text-sm" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start</label>
                  <Input type="datetime-local" value={form.startStr} onChange={(e) => handleStartChange(e.target.value)} className="bg-background/60 border-border/50 font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End</label>
                  <Input type="datetime-local" value={form.endStr} onChange={(e) => field('endStr', e.target.value)} className="bg-background/60 border-border/50 font-mono text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-mono">Duration:</span>
                {QUICK_DURATIONS.map(({ label, minutes }) => (
                  <button key={label} type="button" onClick={() => setQuickDuration(minutes)}
                    className={cn('px-2 py-0.5 rounded text-[10px] font-mono border transition-all', Math.abs(durMs - minutes * 60_000) < 60_000 ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{isVideoLink ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}</div>
              <Input value={form.location} onChange={(e) => field('location', e.target.value)} placeholder={t('calendar.addLocationPlaceholder')} className="bg-background/60 border-border/50 pl-8 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attendees</label>
            {selectedAttendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAttendees.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full pl-1.5 pr-2 py-0.5">
                    <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary">{userInitials(a)}</div>
                    <span className="text-xs text-foreground">{userDisplayName(a)}</span>
                    <button type="button" onClick={() => removeAttendee(a.id)} className="text-muted-foreground hover:text-foreground ml-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><UserPlus className="w-3.5 h-3.5" /></div>
              <Input ref={searchRef} value={attendeeSearch} onChange={(e) => { setAttendeeSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} placeholder={t('calendar.searchPeoplePlaceholder')} className="bg-background/60 border-border/50 pl-8 text-sm" />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border/50 rounded-lg shadow-aurora-md overflow-hidden">
                  {suggestions.map((u) => (
                    <button key={u.id} type="button" onMouseDown={() => addAttendee(u)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors">
                      {u.profile_picture_url ? <img src={u.profile_picture_url} alt={userDisplayName(u)} className="w-7 h-7 rounded-full object-cover flex-shrink-0" /> : <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{userInitials(u)}</div>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{userDisplayName(u)}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{u.email}</p>
                      </div>
                      {u.job_title && <span className="text-[10px] text-muted-foreground truncate max-w-[90px] text-right">{u.job_title}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedAttendees.length > 0 && <FreeBusyTimeline attendees={selectedAttendees} availability={availability} selectedStart={currentStart} selectedEnd={currentEnd} />}
          </div>

          {/* Video Meeting */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Video Meeting</p>
                <p className="text-[10px] text-muted-foreground">{form.enableVideo ? t('calendar.liveKitRoom') : t('calendar.addVideoCall')}</p>
              </div>
            </div>
            <button type="button" role="switch" aria-checked={form.enableVideo} onClick={() => field('enableVideo', !form.enableVideo)}
              className={cn('w-9 h-5 rounded-full relative transition-colors flex-shrink-0', form.enableVideo ? 'bg-primary' : 'bg-muted')}>
              <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', form.enableVideo && 'translate-x-4')} />
            </button>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Repeat</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['none', 'daily', 'weekly', 'monthly'] as const).map((rule) => (
                <button key={rule} type="button" onClick={() => field('recurrenceRule', rule)}
                  className={cn('px-2.5 py-1 rounded text-xs font-medium border transition-all', form.recurrenceRule === rule ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground')}>
                  {rule === 'none' ? t('calendar.noRepeat') : rule.charAt(0).toUpperCase() + rule.slice(1)}
                </button>
              ))}
            </div>
            {form.recurrenceRule !== 'none' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Every</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={1} max={30} value={form.recurrenceInterval}
                      onChange={(e) => field('recurrenceInterval', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-7 text-xs bg-background/60 border-border/50 text-center" />
                    <span className="text-xs text-muted-foreground">
                      {form.recurrenceRule === 'daily' ? 'day(s)' : form.recurrenceRule === 'weekly' ? 'week(s)' : 'month(s)'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Until</label>
                  <Input type="date" value={form.recurrenceEndDate}
                    min={form.startStr.split('T')[0]}
                    onChange={(e) => field('recurrenceEndDate', e.target.value)}
                    className="h-7 text-xs bg-background/60 border-border/50 font-mono" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
            <Textarea value={form.description} onChange={(e) => field('description', e.target.value)} placeholder={t('calendar.addNotesPlaceholder')} rows={2} className="bg-background/60 border-border/50 resize-none text-sm" />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editing ? t('calendar.saveChanges') : t('calendar.createEvent')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Event Detail Popover ─────────────────────────────────────────────────────

function AttendeeAvatar({ email }: { email: string }) {
  const initials = email.split('@')[0].slice(0, 2).toUpperCase();
  const colors = [
    'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-cyan-500',
    'bg-pink-500', 'bg-blue-500', 'bg-orange-500', 'bg-teal-500',
  ];
  const colorIndex = email.charCodeAt(0) % colors.length;
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0', colors[colorIndex])}>
      {initials}
    </div>
  );
}

function EventDetailPopover({ event, anchor, onClose, onEdit, onDelete, onJoin, onChat }: {
  event: CalEvent | null; anchor: { x: number; y: number } | null;
  onClose: () => void; onEdit: (ev: CalEvent) => void; onDelete: (id: string) => void;
  onJoin?: (ev: CalEvent) => void; onChat?: (ev: CalEvent) => void;
}) {
  const { t } = useTranslation();
  if (!event || !anchor) return null;
  const meta = EVENT_TYPE_META[event.type];
  const hasAttendees = event.attendees && event.attendees.length > 0;
  const canJoin = (event.video_enabled || event.livekit_room_name || event.type === 'meeting' || event.type === 'call') && onJoin;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl border border-border/50 bg-card shadow-aurora-md overflow-hidden flex"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: hasAttendees ? 540 : 320, maxHeight: '90vh' }}
      >
        {/* Left panel — event details */}
        <div className="flex-1 p-4 space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', meta.dot)} />
              <h3 className="font-display font-semibold text-sm text-foreground truncate">{event.title}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={cn('text-[10px] border', meta.bg, meta.color, meta.border)} variant="outline">
              {t(`calendar.eventTypes.${event.type === 'out-of-office' ? 'outOfOffice' : event.type}`)}
            </Badge>
            {event.isAllDay && <Badge className="text-[10px] border border-border/40 text-muted-foreground" variant="outline">All day</Badge>}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{event.isAllDay ? format(event.start, 'EEE, MMM d') : `${format(event.start, 'EEE, MMM d')} · ${formatTimeRange(event.start, event.end)}`}</span>
          </div>

          {event.recurrence_rule ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-sm leading-none opacity-70 flex-shrink-0">↻</span>
              <span className="capitalize">
                {event.recurrence_rule}{event.recurrence_interval && event.recurrence_interval > 1 ? ` every ${event.recurrence_interval}` : ''} · Series
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {event.location ? (
              <span className="truncate">{event.location}</span>
            ) : (
              <span className="italic opacity-50">No location added</span>
            )}
          </div>

          {event.description && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlignLeft className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-3">{event.description}</span>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-border/30">
            {canJoin && (
              <Button size="sm" className="w-full text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => { onJoin!(event); onClose(); }}>
                <Video className="w-3.5 h-3.5" /> Join Meeting
              </Button>
            )}
            {onChat && (
              <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 text-muted-foreground hover:text-primary"
                onClick={() => { onChat(event); onClose(); }}>
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </Button>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1 text-xs gap-1 text-muted-foreground hover:text-primary" onClick={() => { onEdit(event); onClose(); }}>
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs gap-1 text-muted-foreground hover:text-destructive" onClick={() => { onDelete(event.id); onClose(); }}>
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — participants list */}
        {hasAttendees && (
          <div className="w-[188px] flex-shrink-0 border-l border-border/30 bg-muted/20 p-3 flex flex-col">
            <div className="flex items-center gap-1.5 mb-3">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Participants · {event.attendees!.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {event.attendees!.map((email) => (
                <div key={email} className="flex items-center gap-2 min-w-0">
                  <AttendeeAvatar email={email} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">
                      {email.split('@')[0].replace(/[._]/g, ' ')}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { startInternalCall } = useVideoCall();
  const { user } = useAuth();
  const userName = user
    ? (user as { full_name?: string; name?: string; email?: string }).full_name ||
      (user as { full_name?: string; name?: string; email?: string }).name ||
      (user as { full_name?: string; name?: string; email?: string }).email || 'My'
    : 'My';

  const queryClient = useQueryClient();
  const [calendarTab, setCalendarTab] = useState<CalendarTab>('events');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<Date>(new Date());

  const rangeStart = startOfMonth(currentDate);
  const rangeEnd = endOfMonth(currentDate);
  const rangeKey = format(rangeStart, 'yyyy-MM');

  // Events query
  const { data: rawEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['calendarEvents', rangeKey],
    queryFn: () => listCalendarEvents(rangeStart, rangeEnd),
    enabled: calendarTab === 'events',
  });
  const events = rawEvents.map(apiToCalEvent);

  // Social posts query
  const { data: socialPosts = [], isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ['socialPostsCalendar', rangeKey],
    queryFn: () => fetchSocialPosts(rangeStart.toISOString(), rangeEnd.toISOString()),
    enabled: calendarTab === 'content',
  });

  // Social post stats for the header
  const postStats = useMemo(() => ({
    scheduled: socialPosts.filter((p) => p.status === 'scheduled').length,
    published:  socialPosts.filter((p) => p.status === 'published').length,
    drafts:     socialPosts.filter((p) => p.status === 'draft').length,
  }), [socialPosts]);

  const createMutation = useMutation({ mutationFn: (dto: CreateEventDto) => createCalendarEvent(dto), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }) });
  const updateMutation = useMutation({ mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateEventDto> }) => updateCalendarEvent(id, dto), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }) });
  const deleteMutation = useMutation({ mutationFn: (id: number) => deleteCalendarEvent(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }) });

  // Navigation
  const goBack = () => { if (view === 'month') setCurrentDate((d) => subMonths(d, 1)); else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1)); else setCurrentDate((d) => subDays(d, 1)); };
  const goForward = () => { if (view === 'month') setCurrentDate((d) => addMonths(d, 1)); else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1)); else setCurrentDate((d) => addDays(d, 1)); };
  const goToday = () => setCurrentDate(new Date());

  const headerTitle = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') { const ws = startOfWeek(currentDate); const we = endOfWeek(currentDate); return isSameMonth(ws, we) ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}` : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`; }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  }, [currentDate, view]);

  const handleEventClick = (e: React.MouseEvent, ev: CalEvent) => { e.stopPropagation(); setSelectedEvent(ev); setPopoverAnchor({ x: e.clientX, y: e.clientY }); };
  const handleDayClick = (day: Date) => { setDefaultModalDate(day); if (view === 'month') { setCurrentDate(day); setView('day'); } };
  const handleNewEvent = () => { setEditingEvent(null); setDefaultModalDate(new Date()); setModalOpen(true); };
  const handleSlotDoubleClick = (date: Date) => { setEditingEvent(null); setDefaultModalDate(date); setModalOpen(true); };
  const handleEditEvent = (ev: CalEvent) => { setEditingEvent(ev); setModalOpen(true); };
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const handleDeleteEvent = (id: string) => { setDeleteConfirmId(id); setPopoverAnchor(null); };
  const confirmDelete = () => { if (deleteConfirmId) { deleteMutation.mutate(Number(deleteConfirmId)); setSelectedEvent(null); } setDeleteConfirmId(null); };

  const handleSaveEvent = (ev: CalEvent) => {
    const dto: CreateEventDto = {
      title: ev.title,
      event_type: ev.type,
      start_time: ev.start.toISOString(),
      end_time: ev.end.toISOString(),
      is_all_day: ev.isAllDay,
      location: ev.location,
      description: ev.description,
      attendees: ev.attendees,
      livekit_room_name: ev.livekit_room_name,
      recurrence_rule: ev.recurrence_rule,
      recurrence_interval: ev.recurrence_interval,
      recurrence_end_date: ev.recurrence_end_date,
    };
    if (editingEvent?.id && !editingEvent.id.startsWith('new-')) updateMutation.mutate({ id: Number(editingEvent.id), dto });
    else createMutation.mutate(dto);
  };

  const handleJoinMeeting = async (ev: CalEvent) => {
    try {
      const result = await joinMeeting(Number(ev.id));
      // Refresh calendar cache so video_enabled=True (set by backend) is reflected
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      startInternalCall({
        roomName: result.room_name,
        livekitToken: result.token,
        livekitUrl: result.livekit_url,
        channelId: result.channel_id,
        eventId: Number(ev.id),
      });
    } catch (err) {
      console.error('Failed to join meeting', err);
    }
  };

  const handleChatEvent = async (ev: CalEvent) => {
    if (ev.video_enabled || ev.livekit_room_name || ev.type === 'meeting' || ev.type === 'call') {
      try {
        const result = await joinMeeting(Number(ev.id));
        navigate(`/dashboard/team-chat?channelId=${result.channel_id}`);
      } catch {
        navigate('/dashboard/team-chat');
      }
    } else {
      navigate('/dashboard/team-chat');
    }
  };

  const isLoading = calendarTab === 'events' ? eventsLoading : postsLoading;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border/30 space-y-3">

        {/* Top row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
              {calendarTab === 'events' ? t('calendar.title') : t('calendar.contentSchedule')}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {calendarTab === 'events' ? t('calendar.mySchedule', { name: userName.split(' ')[0] }) : t('calendar.socialPostsSchedule')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Events: legend */}
            {calendarTab === 'events' && (
              <div className="hidden lg:flex items-center gap-3">
                {(Object.entries(EVENT_TYPE_META) as [EventType, (typeof EVENT_TYPE_META)[EventType]][]).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('w-2 h-2 rounded-full', meta.dot)} />{t(`calendar.eventTypes.${key === 'out-of-office' ? 'outOfOffice' : key}`)}
                  </div>
                ))}
              </div>
            )}

            {/* Content: stats + platform filter */}
            {calendarTab === 'content' && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { count: postStats.scheduled, label: t('social.status.scheduled'), color: '#D97706' },
                    { count: postStats.published,  label: t('social.status.published'),  color: '#059669' },
                    { count: postStats.drafts,     label: t('calendar.postStatus.drafts'),     color: '#94A3B8' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: s.color }}>
                      <span className="text-sm font-bold font-mono">{s.count}</span> {s.label}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-muted/40 border border-border/40 p-0.5 rounded-lg">
                  {[{ key: 'all', label: t('calendar.allFilter') }, ...Object.entries(SOCIAL_PLATFORMS).map(([k, v]) => ({ key: k, label: v.label }))].map((p) => (
                    <button key={p.key} onClick={() => setPlatformFilter(p.key)}
                      className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', platformFilter === p.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View switcher */}
            <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/40 p-0.5 gap-0.5">
              {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all', view === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/10')}>
                  {v === 'month' && <LayoutGrid className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v === 'week'  && <CalendarDays className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v === 'day'   && <List className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v}
                </button>
              ))}
            </div>

            {/* CTA */}
            {calendarTab === 'events' ? (
              <Button size="sm" onClick={handleNewEvent} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-aurora-sm">
                <Plus className="w-4 h-4" /> New Event
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/dashboard/social/compose')} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-aurora-sm">
                <Plus className="w-4 h-4" /> New Post
              </Button>
            )}
          </div>
        </div>

        {/* Nav row — date nav + inline mode switcher + Today */}
        <div className="flex items-center gap-2">
          {/* Prev / Next */}
          <button onClick={goBack} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goForward} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Date title */}
          <h2 className="font-display text-base font-semibold text-foreground">{headerTitle}</h2>

          {/* ── Mode switcher dropdown ── */}
          <div className="relative ml-1">
            <button
              onClick={() => setModeDropdownOpen((p) => !p)}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium transition-all',
                calendarTab === 'events'
                  ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15'
                  : 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/15',
              )}
            >
              {calendarTab === 'events'
                ? <CalendarDays className="w-3.5 h-3.5" />
                : <Rss className="w-3.5 h-3.5" />}
              <span>{calendarTab === 'events' ? t('calendar.tabs.events') : t('calendar.tabs.content')}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform duration-150', modeDropdownOpen && 'rotate-180')} />
            </button>

            {modeDropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setModeDropdownOpen(false)} />
                {/* Dropdown */}
                <div className="absolute top-full left-0 mt-1.5 z-50 w-52 bg-card border border-border/50 rounded-xl shadow-aurora-md overflow-hidden">
                  <div className="px-3 pt-2.5 pb-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Switch calendar</p>
                  </div>
                  {([
                    { key: 'events'  as CalendarTab, label: t('calendar.events'),        desc: t('calendar.meetingsDesc'),       Icon: CalendarDays, accent: 'text-primary',      activeBg: 'bg-primary/10' },
                    { key: 'content' as CalendarTab, label: t('calendar.socialContent'), desc: t('calendar.socialContentDesc'),  Icon: Rss,          accent: 'text-violet-400',   activeBg: 'bg-violet-500/10' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setCalendarTab(opt.key); setModeDropdownOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        calendarTab === opt.key ? opt.activeBg : 'hover:bg-muted/50',
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', calendarTab === opt.key ? opt.activeBg : 'bg-muted/50')}>
                        <opt.Icon className={cn('w-3.5 h-3.5', calendarTab === opt.key ? opt.accent : 'text-muted-foreground')} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn('text-xs font-medium', calendarTab === opt.key ? opt.accent : 'text-foreground')}>{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                      </div>
                      {calendarTab === opt.key && (
                        <div className={cn('ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0', opt.accent.replace('text-', 'bg-'))} />
                      )}
                    </button>
                  ))}
                  <div className="h-1" />
                </div>
              </>
            )}
          </div>

          {/* Today */}
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs border-border/50 hover:bg-muted/60 ml-auto">
            Today
          </Button>
        </div>
      </div>

      {/* ── Calendar body ──────────────────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          </div>
        )}

        {/* Events tab views */}
        {calendarTab === 'events' && view === 'month' && <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} />}
        {calendarTab === 'events' && view === 'week'  && <WeekView currentDate={currentDate} events={events} onEventClick={handleEventClick} onDayClick={(day) => { setCurrentDate(day); setView('day'); }} onSlotDoubleClick={handleSlotDoubleClick} />}
        {calendarTab === 'events' && view === 'day'   && <DayView currentDate={currentDate} events={events} onEventClick={handleEventClick} onSlotDoubleClick={handleSlotDoubleClick} />}

        {/* Content tab views */}
        {calendarTab === 'content' && view === 'month' && <ContentMonthView currentDate={currentDate} posts={socialPosts} platformFilter={platformFilter} navigate={navigate} />}
        {calendarTab === 'content' && view === 'week'  && <ContentWeekView currentDate={currentDate} posts={socialPosts} platformFilter={platformFilter} navigate={navigate} />}
        {calendarTab === 'content' && view === 'day'   && <ContentDayView currentDate={currentDate} posts={socialPosts} platformFilter={platformFilter} navigate={navigate} />}
      </div>

      <EventDetailPopover event={selectedEvent} anchor={popoverAnchor} onClose={() => { setSelectedEvent(null); setPopoverAnchor(null); }} onEdit={handleEditEvent} onDelete={handleDeleteEvent} onJoin={handleJoinMeeting} onChat={handleChatEvent} />
      <CreateEventModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingEvent(null); }} onSave={handleSaveEvent} editing={editingEvent} defaultStart={defaultModalDate} />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This event will be permanently deleted and cannot be recovered.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t('calendar.deleting') : t('calendar.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
