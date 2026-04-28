import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
} from '@/services/calendarService';
import type { ApiCalEvent, CreateEventDto } from '@/services/calendarService';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameDay, isSameMonth, addMonths,
  subMonths, addWeeks, subWeeks, addDays, subDays, isToday,
  getHours, getMinutes, setHours,
  setMinutes, parseISO,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Users, AlignLeft,
  X, Edit2, Trash2, CalendarDays, LayoutGrid, List,
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
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'meeting' | 'task' | 'call' | 'out-of-office' | 'reminder';
type ViewMode = 'month' | 'week' | 'day';

interface CalEvent {
  id: string;
  title: string;
  type: EventType;
  start: Date;
  end: Date;
  description?: string;
  attendees?: string[];
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<EventType, { label: string; color: string; bg: string; border: string; dot: string }> = {
  meeting: {
    label: 'Meeting',
    color: 'text-violet-300',
    bg: 'bg-violet-500/20 border-violet-500/40',
    border: 'border-violet-500/60',
    dot: 'bg-violet-400',
  },
  task: {
    label: 'Task',
    color: 'text-amber-300',
    bg: 'bg-amber-500/20 border-amber-500/40',
    border: 'border-amber-500/60',
    dot: 'bg-amber-400',
  },
  call: {
    label: 'Call',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/20 border-emerald-500/40',
    border: 'border-emerald-500/60',
    dot: 'bg-emerald-400',
  },
  'out-of-office': {
    label: 'Out of Office',
    color: 'text-slate-300',
    bg: 'bg-slate-500/20 border-slate-500/40',
    border: 'border-slate-500/60',
    dot: 'bg-slate-400',
  },
  reminder: {
    label: 'Reminder',
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/20 border-cyan-500/40',
    border: 'border-cyan-500/60',
    dot: 'bg-cyan-400',
  },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am – 8pm
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 64; // px per hour in week/day view

// ─── API → local type converter ───────────────────────────────────────────────

function apiToCalEvent(e: ApiCalEvent): CalEvent {
  return {
    id: String(e.id),
    title: e.title,
    type: (e.event_type as EventType) ?? 'meeting',
    start: new Date(e.start_time),
    end: new Date(e.end_time),
    description: e.description,
    attendees: e.attendees ?? [],
    color: EVENT_TYPE_META[(e.event_type as EventType) ?? 'meeting']?.dot ?? '',
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatTimeRange(start: Date, end: Date) {
  return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
}

function toDatetimeLocal(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function fromDatetimeLocal(s: string): Date {
  return parseISO(s);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Event pill used in month view
function EventPill({
  event,
  onClick,
}: {
  event: CalEvent;
  onClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const meta = EVENT_TYPE_META[event.type];
  return (
    <button
      onClick={(e) => onClick(e, event)}
      className={cn(
        'w-full text-left text-xs px-1.5 py-0.5 rounded truncate border',
        'transition-all duration-150 hover:brightness-125 hover:scale-[1.02]',
        meta.bg, meta.color,
      )}
      title={event.title}
    >
      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle', meta.dot)} />
      {event.title}
    </button>
  );
}

// Day cell in month view
function DayCell({
  day,
  events,
  currentMonth,
  onDayClick,
  onEventClick,
}: {
  day: Date;
  events: CalEvent[];
  currentMonth: Date;
  onDayClick: (d: Date) => void;
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const today = isToday(day);
  const inMonth = isSameMonth(day, currentMonth);
  const maxVisible = 3;
  const visible = events.slice(0, maxVisible);
  const overflow = events.length - maxVisible;

  return (
    <div
      onClick={() => onDayClick(day)}
      className={cn(
        'min-h-[100px] p-1.5 border-b border-r border-border/30',
        'cursor-pointer transition-colors duration-150',
        'hover:bg-white/4 dark:hover:bg-white/[0.03]',
        !inMonth && 'opacity-40',
      )}
    >
      <div className="flex items-center justify-center mb-1">
        <span
          className={cn(
            'font-mono text-xs w-6 h-6 flex items-center justify-center rounded-full',
            today
              ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/40 ring-offset-1 ring-offset-background'
              : 'text-muted-foreground',
          )}
        >
          {format(day, 'd')}
        </span>
      </div>
      <div className="space-y-0.5">
        {visible.map((ev) => (
          <EventPill key={ev.id} event={ev} onClick={onEventClick} />
        ))}
        {overflow > 0 && (
          <p className="text-[10px] text-muted-foreground pl-1 font-mono">
            +{overflow} more
          </p>
        )}
      </div>
    </div>
  );
}

// Month view grid
function MonthView({
  currentDate,
  events,
  onDayClick,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsOnDay = useCallback(
    (day: Date) => events.filter((ev) => isSameDay(ev.start, day)),
    [events],
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day grid */}
      <div className="flex-1 grid grid-cols-7 border-l border-t border-border/30 overflow-auto">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            events={eventsOnDay(day)}
            currentMonth={currentDate}
            onDayClick={onDayClick}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}

// Time column for week/day views
function TimeColumn() {
  return (
    <div className="w-16 flex-shrink-0 border-r border-border/30">
      <div className="h-10 border-b border-border/30" /> {/* header spacer */}
      {HOURS.map((h) => (
        <div
          key={h}
          className="relative border-b border-border/20"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-2.5 right-2 text-[10px] font-mono text-muted-foreground">
            {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
          </span>
        </div>
      ))}
    </div>
  );
}

// A single positioned event block in week/day view
function TimeEventBlock({
  event,
  onEventClick,
  columnWidth,
  leftOffset,
}: {
  event: CalEvent;
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
  columnWidth?: string;
  leftOffset?: string;
}) {
  const meta = EVENT_TYPE_META[event.type];
  const startH = getHours(event.start) + getMinutes(event.start) / 60;
  const endH = getHours(event.end) + getMinutes(event.end) / 60;
  const topOffset = (startH - 7) * HOUR_HEIGHT; // relative to 7am
  const height = Math.max((endH - startH) * HOUR_HEIGHT, 20);

  return (
    <button
      onClick={(e) => onEventClick(e, event)}
      className={cn(
        'absolute left-0.5 right-0.5 rounded border px-1.5 py-1 text-left',
        'transition-all duration-150 hover:brightness-125 hover:z-10 hover:shadow-lg',
        meta.bg, meta.border,
      )}
      style={{
        top: topOffset,
        height,
        width: columnWidth,
        left: leftOffset,
      }}
      title={event.title}
    >
      <p className={cn('text-xs font-medium truncate', meta.color)}>{event.title}</p>
      {height > 32 && (
        <p className="text-[10px] text-muted-foreground font-mono truncate">
          {formatTimeRange(event.start, event.end)}
        </p>
      )}
    </button>
  );
}

// Week view
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
  onDayClick: (d: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsOnDay = useCallback(
    (day: Date) => events.filter((ev) => isSameDay(ev.start, day)),
    [events],
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      <TimeColumn />
      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/30 sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="h-10 flex flex-col items-center justify-center gap-0.5 border-r border-border/30 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => onDayClick(day)}
            >
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full',
                  isToday(day)
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
          ))}
        </div>
        {/* Hour grid */}
        <div className="relative grid grid-cols-7">
          {days.map((day) => {
            const dayEvents = eventsOnDay(day);
            return (
              <div key={day.toISOString()} className="relative border-r border-border/20">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-border/15"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {/* Events */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="pointer-events-auto">
                      <TimeEventBlock event={ev} onEventClick={onEventClick} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Day view
function DayView({
  currentDate,
  events,
  onEventClick,
}: {
  currentDate: Date;
  events: CalEvent[];
  onEventClick: (e: React.MouseEvent, ev: CalEvent) => void;
}) {
  const dayEvents = useMemo(
    () => events.filter((ev) => isSameDay(ev.start, currentDate)).sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    ),
    [events, currentDate],
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      <TimeColumn />
      <div className="flex-1 overflow-auto">
        {/* Day header */}
        <div className="h-10 border-b border-border/30 flex items-center px-4 sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          <span
            className={cn(
              'font-display text-sm font-semibold',
              isToday(currentDate) ? 'text-primary' : 'text-foreground',
            )}
          >
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </span>
          {isToday(currentDate) && (
            <Badge className="ml-2 text-[10px] bg-primary/20 text-primary border-primary/30">
              Today
            </Badge>
          )}
        </div>
        {/* Hour grid */}
        <div className="relative">
          {HOURS.map((h) => (
            <div
              key={h}
              className="border-b border-border/20"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}
          {/* Events */}
          <div className="absolute inset-0">
            {dayEvents.map((ev) => (
              <TimeEventBlock
                key={ev.id}
                event={ev}
                onEventClick={onEventClick}
              />
            ))}
          </div>
          {/* Current time indicator */}
          {isToday(currentDate) && <CurrentTimeIndicator />}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const h = getHours(now) + getMinutes(now) / 60;
  if (h < 7 || h > 20) return null;
  const top = (h - 7) * HOUR_HEIGHT;
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-primary ml-0.5 flex-shrink-0" />
      <div className="flex-1 h-px bg-primary/70" />
    </div>
  );
}

// Create/Edit Event Modal
interface EventForm {
  title: string;
  type: EventType;
  startStr: string;
  endStr: string;
  description: string;
  attendees: string;
}

function CreateEventModal({
  open,
  onClose,
  onSave,
  editing,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (ev: CalEvent) => void;
  editing: CalEvent | null;
  defaultDate: Date;
}) {
  const defaultStart = setMinutes(setHours(defaultDate, 9), 0);
  const defaultEnd = setMinutes(setHours(defaultDate, 10), 0);

  const [form, setForm] = useState<EventForm>({
    title: '',
    type: 'meeting',
    startStr: toDatetimeLocal(defaultStart),
    endStr: toDatetimeLocal(defaultEnd),
    description: '',
    attendees: '',
  });

  // Sync form when editing changes
  React.useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        type: editing.type,
        startStr: toDatetimeLocal(editing.start),
        endStr: toDatetimeLocal(editing.end),
        description: editing.description ?? '',
        attendees: (editing.attendees ?? []).join(', '),
      });
    } else {
      const s = setMinutes(setHours(defaultDate, 9), 0);
      const e = setMinutes(setHours(defaultDate, 10), 0);
      setForm({
        title: '',
        type: 'meeting',
        startStr: toDatetimeLocal(s),
        endStr: toDatetimeLocal(e),
        description: '',
        attendees: '',
      });
    }
  }, [editing, open, defaultDate]);

  const field = (k: keyof EventForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    const start = fromDatetimeLocal(form.startStr);
    const end = fromDatetimeLocal(form.endStr);
    const meta = EVENT_TYPE_META[form.type];
    onSave({
      id: editing?.id ?? '',
      title: form.title.trim(),
      type: form.type,
      start,
      end,
      description: form.description.trim() || undefined,
      attendees: form.attendees
        ? form.attendees.split(',').map((a) => a.trim()).filter(Boolean)
        : undefined,
      color: meta.dot,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border/50 shadow-aurora-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold">
            {editing ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="Event title…"
              className="bg-background/60 border-border/50 focus:ring-primary/30"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Type
            </label>
            <Select value={form.type} onValueChange={(v) => field('type', v as EventType)}>
              <SelectTrigger className="bg-background/60 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(EVENT_TYPE_META) as [EventType, typeof EVENT_TYPE_META[EventType]][]).map(
                  ([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', meta.dot)} />
                        {meta.label}
                      </div>
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Start
              </label>
              <Input
                type="datetime-local"
                value={form.startStr}
                onChange={(e) => field('startStr', e.target.value)}
                className="bg-background/60 border-border/50 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                End
              </label>
              <Input
                type="datetime-local"
                value={form.endStr}
                onChange={(e) => field('endStr', e.target.value)}
                className="bg-background/60 border-border/50 font-mono text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              className="bg-background/60 border-border/50 resize-none text-sm"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Attendees (comma-separated emails)
            </label>
            <Input
              value={form.attendees}
              onChange={(e) => field('attendees', e.target.value)}
              placeholder="alice@co.com, bob@co.com"
              className="bg-background/60 border-border/50 font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {editing ? 'Save Changes' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Event detail popover
function EventDetailPopover({
  event,
  anchor,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalEvent | null;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onEdit: (ev: CalEvent) => void;
  onDelete: (id: string) => void;
}) {
  if (!event || !anchor) return null;

  const meta = EVENT_TYPE_META[event.type];

  // Position: keep within viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = 280;
  const left = Math.min(anchor.x + 8, vw - width - 16);
  const top = Math.min(anchor.y + 8, vh - 300);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Popover card */}
      <div
        className="fixed z-50 w-[280px] rounded-lg border border-border/50 bg-card shadow-aurora-md p-4 space-y-3"
        style={{ left, top }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', meta.dot)} />
            <h3 className="font-display font-semibold text-sm text-foreground truncate">
              {event.title}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Type badge */}
        <Badge
          className={cn('text-[10px] border', meta.bg, meta.color, meta.border)}
          variant="outline"
        >
          {meta.label}
        </Badge>

        {/* Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {format(event.start, 'EEE, MMM d')} · {formatTimeRange(event.start, event.end)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlignLeft className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-3">{event.description}</span>
          </div>
        )}

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="font-mono break-all">{event.attendees.join(', ')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border/30">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs gap-1 text-muted-foreground hover:text-primary"
            onClick={() => { onEdit(event); onClose(); }}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-xs gap-1 text-muted-foreground hover:text-destructive"
            onClick={() => { onDelete(event.id); onClose(); }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuth();
  const userName = user
    ? (user as { full_name?: string; name?: string; email?: string }).full_name ||
      (user as { full_name?: string; name?: string; email?: string }).name ||
      (user as { full_name?: string; name?: string; email?: string }).email ||
      'My'
    : 'My';

  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const rangeStart = startOfMonth(currentDate);
  const rangeEnd = endOfMonth(currentDate);

  const { data: rawEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['calendarEvents', format(rangeStart, 'yyyy-MM')],
    queryFn: () => listCalendarEvents(rangeStart, rangeEnd),
  });

  const events = rawEvents.map(apiToCalEvent);

  const createMutation = useMutation({
    mutationFn: (dto: CreateEventDto) => createCalendarEvent(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<CreateEventDto> }) =>
      updateCalendarEvent(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCalendarEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });

  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<Date>(new Date());

  // Navigation
  const goBack = () => {
    if (view === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const goForward = () => {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const headerTitle = useMemo(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return isSameMonth(ws, we)
        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  }, [currentDate, view]);

  // Event handlers
  const handleEventClick = (e: React.MouseEvent, ev: CalEvent) => {
    e.stopPropagation();
    setSelectedEvent(ev);
    setPopoverAnchor({ x: e.clientX, y: e.clientY });
  };

  const handleDayClick = (day: Date) => {
    setDefaultModalDate(day);
    if (view === 'month') {
      setCurrentDate(day);
      setView('day');
    }
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setDefaultModalDate(currentDate);
    setModalOpen(true);
  };

  const handleEditEvent = (ev: CalEvent) => {
    setEditingEvent(ev);
    setModalOpen(true);
  };

  const handleSaveEvent = (ev: CalEvent) => {
    const dto: CreateEventDto = {
      title: ev.title,
      event_type: ev.type,
      start_time: ev.start.toISOString(),
      end_time: ev.end.toISOString(),
      description: ev.description,
      attendees: ev.attendees,
    };
    if (editingEvent?.id && !editingEvent.id.startsWith('new-')) {
      updateMutation.mutate({ id: Number(editingEvent.id), dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const handleDeleteEvent = (id: string) => {
    deleteMutation.mutate(Number(id));
    setSelectedEvent(null);
  };

  // Legend items
  const legendItems = Object.entries(EVENT_TYPE_META) as [EventType, typeof EVENT_TYPE_META[EventType]][];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border/30">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: title + legend */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
                  Workspace Calendar
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {userName.split(' ')[0]}'s schedule
                </p>
              </div>
            </div>
          </div>

          {/* Right: view switcher + new event */}
          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="hidden lg:flex items-center gap-3">
              {legendItems.map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-full', meta.dot)} />
                  {meta.label}
                </div>
              ))}
            </div>

            {/* View switcher */}
            <div className="flex rounded-lg overflow-hidden border border-border/50 bg-muted/40 p-0.5 gap-0.5">
              {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-150',
                    view === v
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10',
                  )}
                >
                  {v === 'month' && <LayoutGrid className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v === 'week' && <CalendarDays className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v === 'day' && <List className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {v}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleNewEvent}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-aurora-sm"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Nav row */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={goBack}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goForward}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h2 className="font-display text-base font-semibold text-foreground min-w-[200px]">
            {headerTitle}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="text-xs border-border/50 hover:bg-muted/60 ml-auto"
          >
            Today
          </Button>
        </div>
      </div>

      {/* ── Calendar body ────────────────────────────────────────────── */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {eventsLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading events…
            </div>
          </div>
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onDayClick={(day) => { setCurrentDate(day); setView('day'); }}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* ── Event detail popover ──────────────────────────────────────── */}
      <EventDetailPopover
        event={selectedEvent}
        anchor={popoverAnchor}
        onClose={() => { setSelectedEvent(null); setPopoverAnchor(null); }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      {/* ── Create/Edit modal ─────────────────────────────────────────── */}
      <CreateEventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
        editing={editingEvent}
        defaultDate={defaultModalDate}
      />
    </div>
  );
}
