import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, Calendar, Clock, Mic, FileText, Download,
  Users, MapPin, ChevronDown, Search, X,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CallLogEntry {
  id: string;
  source_id: number;
  call_type: 'voice' | 'video' | 'meeting';
  direction: 'inbound' | 'outbound' | 'internal';
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  title: string;
  from_number?: string;
  to_number?: string;
  recording_url?: string;
  recording_duration_secs?: number;
  full_transcript?: string;
  csat_score?: number;
  channel_id?: number;
  channel_name?: string;
  event_id?: number;
  event_title?: string;
  attendees?: string[];
  participants: string[];
  location?: string;
  description?: string;
}

interface CallLogResponse {
  entries: CallLogEntry[];
  total: number;
  skip: number;
  limit: number;
}

// ── Quick filter pill config ───────────────────────────────────────────────────

type QuickFilter = 'all' | 'missed' | 'incoming' | 'outgoing' | 'internal' | 'meetings';

const QUICK_FILTERS: { id: QuickFilter; label: string; color: string; activeColor: string }[] = [
  { id: 'all',      label: 'All',      color: 'text-muted-foreground', activeColor: 'bg-foreground text-background' },
  { id: 'missed',   label: 'Missed',   color: 'text-red-500',          activeColor: 'bg-red-500 text-white' },
  { id: 'incoming', label: 'Incoming', color: 'text-emerald-600',      activeColor: 'bg-emerald-500 text-white' },
  { id: 'outgoing', label: 'Outgoing', color: 'text-blue-600',         activeColor: 'bg-blue-500 text-white' },
  { id: 'internal', label: 'Internal', color: 'text-violet-600',       activeColor: 'bg-violet-500 text-white' },
  { id: 'meetings', label: 'Meetings', color: 'text-amber-600',        activeColor: 'bg-amber-500 text-white' },
];

function filterToParams(qf: QuickFilter): Record<string, string> {
  if (qf === 'missed')   return { show_missed: 'true' };
  if (qf === 'incoming') return { direction: 'inbound' };
  if (qf === 'outgoing') return { direction: 'outbound' };
  if (qf === 'internal') return { call_type: 'video' };
  if (qf === 'meetings') return { call_type: 'meeting' };
  return {};
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MISSED_STATUSES = new Set(['no_answer', 'failed', 'busy', 'missed', 'rejected']);

function isMissed(e: CallLogEntry) {
  return MISSED_STATUSES.has(e.status);
}

function fmt(secs?: number | null): string {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function dateGroup(iso: string | null): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400_000);
  const thisWeekStart = new Date(today.getTime() - (today.getDay() || 7) * 86400_000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400_000);
  const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (entryDay >= today) return 'Today';
  if (entryDay >= yesterday) return 'Yesterday';
  if (entryDay >= thisWeekStart) return 'This week';
  if (entryDay >= lastWeekStart) return 'Last week';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// ── Icon circle ───────────────────────────────────────────────────────────────

function CallAvatar({ entry }: { entry: CallLogEntry }) {
  const missed = isMissed(entry);

  if (entry.call_type === 'voice') {
    const bg = missed
      ? 'bg-red-100 dark:bg-red-900/30'
      : entry.direction === 'inbound'
      ? 'bg-emerald-100 dark:bg-emerald-900/30'
      : 'bg-blue-100 dark:bg-blue-900/30';
    const Icon = missed
      ? PhoneMissed
      : entry.direction === 'inbound'
      ? PhoneIncoming
      : PhoneOutgoing;
    const iconColor = missed ? 'text-red-500' : entry.direction === 'inbound' ? 'text-emerald-600' : 'text-blue-600';
    return (
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
    );
  }

  if (entry.call_type === 'video') {
    const statusBg = entry.status === 'missed' || entry.status === 'rejected'
      ? 'bg-red-100 dark:bg-red-900/30'
      : 'bg-violet-100 dark:bg-violet-900/30';
    const iconColor = entry.status === 'missed' || entry.status === 'rejected'
      ? 'text-red-500'
      : 'text-violet-600';
    return (
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', statusBg)}>
        <Video className={cn('w-4 h-4', iconColor)} />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/30">
      <Calendar className="w-4 h-4 text-amber-600" />
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    failed:      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    missed:      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    no_answer:   'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    busy:        'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    active:      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    ringing:     'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    rejected:    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    cancelled:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    scheduled:   'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  };
  const labels: Record<string, string> = {
    no_answer: 'No answer', in_progress: 'In progress',
    completed: 'Completed', failed: 'Failed', missed: 'Missed',
    busy: 'Busy', active: 'Active', ringing: 'Ringing',
    rejected: 'Rejected', cancelled: 'Cancelled', scheduled: 'Scheduled',
  };
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap', map[status] ?? 'bg-muted text-muted-foreground')}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Recording player ──────────────────────────────────────────────────────────

function MiniPlayer({ url, duration }: { url: string; duration?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const progress = duration && duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2 mt-2 bg-muted/60 rounded-xl px-3 py-2">
      <audio ref={ref} src={url}
        onTimeUpdate={() => setCurrent(ref.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)} preload="metadata" />
      <button
        onClick={() => {
          if (!ref.current) return;
          playing ? (ref.current.pause(), setPlaying(false)) : (ref.current.play(), setPlaying(true));
        }}
        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity"
      >
        {playing
          ? <span className="text-[8px] font-bold">■</span>
          : <span className="text-[8px] font-bold ml-px">▶</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground">{fmt(current)}</span>
          <span className="text-[9px] text-muted-foreground">{fmt(duration)}</span>
        </div>
      </div>
      <a href={url} download className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <Download className="h-3 w-3" />
      </a>
    </div>
  );
}

// ── Expanded detail panel ─────────────────────────────────────────────────────

function DetailPanel({ entry }: { entry: CallLogEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mt-3 ml-14 rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 p-4 space-y-3"
    >
      {entry.call_type === 'voice' && (
        <>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">From</p>
              <p className="text-foreground font-mono">{entry.from_number ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">To</p>
              <p className="text-foreground font-mono">{entry.to_number ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">Started</p>
              <p className="text-foreground">{fmtDate(entry.started_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">Ended</p>
              <p className="text-foreground">{fmtDate(entry.ended_at)}</p>
            </div>
          </div>
          {entry.csat_score != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">CSAT</span>
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < entry.csat_score! ? 'text-amber-400' : 'text-border'}>★</span>
                ))}
              </span>
              <span className="text-xs text-muted-foreground">{entry.csat_score}/5</span>
            </div>
          )}
          {entry.recording_url && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Recording</p>
              <MiniPlayer url={entry.recording_url} duration={entry.recording_duration_secs ?? entry.duration_seconds ?? undefined} />
            </div>
          )}
          {entry.full_transcript && (
            <details>
              <summary className="text-xs text-primary cursor-pointer hover:underline list-none font-medium">
                View transcript
              </summary>
              <p className="mt-2 text-xs text-foreground/80 leading-relaxed bg-background rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap border border-border/40">
                {entry.full_transcript}
              </p>
            </details>
          )}
        </>
      )}

      {entry.call_type === 'video' && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          {entry.channel_name && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">Channel</p>
              <p className="text-foreground">#{entry.channel_name}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground font-medium mb-0.5">Duration</p>
            <p className="text-foreground">{fmt(entry.duration_seconds)}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium mb-0.5">Started</p>
            <p className="text-foreground">{fmtDate(entry.started_at)}</p>
          </div>
          {entry.participants.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground font-medium mb-1">Participants</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.participants.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-background border border-border/60 rounded-full px-2.5 py-0.5">
                    <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {p[0]?.toUpperCase()}
                    </span>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {entry.call_type === 'meeting' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">Start</p>
              <p className="text-foreground">{fmtDate(entry.started_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">End</p>
              <p className="text-foreground">{fmtDate(entry.ended_at)}</p>
            </div>
          </div>
          {entry.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{entry.location}</span>
            </div>
          )}
          {entry.description && (
            <div>
              <p className="text-muted-foreground font-medium mb-0.5">Description</p>
              <p className="text-foreground/80 leading-relaxed">{entry.description}</p>
            </div>
          )}
          {entry.attendees && entry.attendees.length > 0 && (
            <div>
              <p className="text-muted-foreground font-medium mb-1">Attendees</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.attendees.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-background border border-border/60 rounded-full px-2.5 py-0.5">
                    <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {a[0]?.toUpperCase()}
                    </span>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry, isExpanded, onToggle }: {
  entry: CallLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const missed = isMissed(entry);
  const typeLabel = entry.call_type === 'voice'
    ? (entry.direction === 'inbound' ? 'Incoming call' : 'Outgoing call')
    : entry.call_type === 'video'
    ? 'Internal video call'
    : 'Meeting';

  return (
    <div className={cn(
      'group px-5 py-1 rounded-xl transition-colors cursor-pointer',
      isExpanded ? 'bg-muted/40 dark:bg-muted/20' : 'hover:bg-muted/30 dark:hover:bg-muted/10',
    )} onClick={onToggle}>
      <div className="flex items-center gap-3 py-2.5">
        <CallAvatar entry={entry} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-sm font-semibold truncate',
              missed ? 'text-red-600 dark:text-red-400' : 'text-foreground',
            )}>
              {entry.title}
            </span>
            <StatusPill status={entry.status} />
            {entry.recording_url && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5" title="Recording">
                <Mic className="h-2.5 w-2.5" /> Rec
              </span>
            )}
            {entry.full_transcript && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5" title="Transcript">
                <FileText className="h-2.5 w-2.5" /> Transcript
              </span>
            )}
            {entry.participants.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                <Users className="h-2.5 w-2.5" /> {entry.participants.length}
              </span>
            )}
            {entry.csat_score != null && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                ★ {entry.csat_score}/5
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeLabel} · {fmtTime(entry.started_at)}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground justify-end">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {fmt(entry.duration_seconds)}
            </div>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
            isExpanded && 'rotate-180',
          )} />
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3">
              <DetailPanel entry={entry} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VoiceCallLogPage() {
  const { authFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const params = filterToParams(quickFilter);

  const { data, isLoading } = useQuery<CallLogResponse>({
    queryKey: ['unified_call_log', quickFilter, search],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: '200', ...params });
      if (search) p.set('search', search);
      const res = await authFetch(`/api/v1/calls/log?${p}`);
      if (!res.ok) return { entries: [], total: 0, skip: 0, limit: 200 };
      return res.json();
    },
    refetchInterval: 30_000,
  });

  // Fetch ALL entries unfiltered once for the stat cards
  const { data: statsData } = useQuery<CallLogResponse>({
    queryKey: ['unified_call_log_stats'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/calls/log?limit=500');
      if (!res.ok) return { entries: [], total: 0, skip: 0, limit: 500 };
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const allEntries = statsData?.entries ?? [];
  const stats: Record<string, number> = {
    missed:   allEntries.filter(isMissed).length,
    incoming: allEntries.filter(e => e.direction === 'inbound').length,
    outgoing: allEntries.filter(e => e.direction === 'outbound').length,
    internal: allEntries.filter(e => e.call_type === 'video').length,
    meetings: allEntries.filter(e => e.call_type === 'meeting').length,
  };

  const entries = data?.entries ?? [];

  // Group by date section
  const grouped: { label: string; entries: CallLogEntry[] }[] = [];
  for (const entry of entries) {
    const label = dateGroup(entry.started_at);
    const last = grouped[grouped.length - 1];
    if (last?.label === label) {
      last.entries.push(entry);
    } else {
      grouped.push({ label, entries: [entry] });
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border/50">
        <h1 className="text-base font-semibold text-foreground">Call Log</h1>
        <div className="relative w-56">
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 pr-8 h-8 text-sm bg-muted/40 border-border/50 focus:bg-background"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Quick filter pills ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border/40 overflow-x-auto scrollbar-none">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => { setQuickFilter(f.id); setExpanded(null); }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              quickFilter === f.id
                ? f.activeColor
                : `bg-muted/50 hover:bg-muted ${f.color}`,
            )}
          >
            {f.label}
            {f.id !== 'all' && stats[f.id] > 0 && (
              <span className={cn(
                'text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
                quickFilter === f.id ? 'bg-white/20' : 'bg-muted',
              )}>
                {stats[f.id] > 99 ? '99+' : stats[f.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading call log…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Phone className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No calls found</p>
            <p className="text-xs text-muted-foreground">
              {quickFilter !== 'all' ? 'Try selecting a different filter' : 'Your call history will appear here'}
            </p>
          </div>
        ) : (
          <div className="px-3 py-3 space-y-4">
            {grouped.map(group => (
              <div key={group.label}>
                {/* Date section header */}
                <div className="flex items-center gap-2 px-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground/60">{group.entries.length}</span>
                </div>

                <div className="space-y-0.5">
                  <AnimatePresence initial={false}>
                    {group.entries.map(entry => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <EntryRow
                          entry={entry}
                          isExpanded={expanded === entry.id}
                          onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
