import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, Calendar, Clock, Mic, FileText, Search,
  Download, Users, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

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
  // voice
  from_number?: string;
  to_number?: string;
  recording_url?: string;
  recording_duration_secs?: number;
  full_transcript?: string;
  csat_score?: number;
  // video / meeting
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(secs?: number | null): string {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
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

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeIcon({ type, direction, status }: { type: string; direction: string; status: string }) {
  if (type === 'voice') {
    if (status === 'no_answer' || status === 'failed' || status === 'missed')
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    if (direction === 'inbound') return <PhoneIncoming className="h-4 w-4 text-emerald-500" />;
    return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
  }
  if (type === 'video') return <Video className="h-4 w-4 text-violet-500" />;
  return <Calendar className="h-4 w-4 text-amber-500" />;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    voice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    video: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    meeting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const label: Record<string, string> = { voice: 'Voice', video: 'Video', meeting: 'Meeting' };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${map[type] ?? 'bg-muted text-muted-foreground'}`}>
      {label[type] ?? type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    missed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    no_answer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    busy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ringing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    scheduled: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  const map: Record<string, string> = {
    inbound: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    outbound: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
    internal: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`text-[10px] font-medium capitalize px-1.5 py-0.5 rounded ${map[direction] ?? 'bg-muted text-muted-foreground'}`}>
      {direction}
    </span>
  );
}

function MiniPlayer({ url, duration }: { url: string; duration?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const progress = duration && duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 mt-1.5 bg-muted/50 rounded-lg px-2 py-1.5">
      <audio ref={ref} src={url}
        onTimeUpdate={() => setCurrent(ref.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)} preload="metadata" />
      <button
        onClick={() => {
          if (!ref.current) return;
          playing ? (ref.current.pause(), setPlaying(false)) : (ref.current.play(), setPlaying(true));
        }}
        className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0"
      >
        {playing
          ? <span className="text-[8px] font-bold">■</span>
          : <span className="text-[8px] font-bold ml-px">▶</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground">{fmt(current)}</span>
          <span className="text-[9px] text-muted-foreground">{fmt(duration)}</span>
        </div>
      </div>
      <a href={url} download className="text-muted-foreground hover:text-foreground">
        <Download className="h-3 w-3" />
      </a>
    </div>
  );
}

function EntryDetail({ entry }: { entry: CallLogEntry }) {
  return (
    <div className="pt-2 pl-7 space-y-2">
      {entry.call_type === 'voice' && (
        <>
          <div className="text-[10px] text-muted-foreground">
            <span className="font-medium">From:</span> {entry.from_number}
            {' · '}
            <span className="font-medium">To:</span> {entry.to_number}
          </div>
          {entry.recording_url && (
            <MiniPlayer url={entry.recording_url} duration={entry.recording_duration_secs ?? entry.duration_seconds ?? undefined} />
          )}
          {entry.full_transcript && (
            <details className="group">
              <summary className="text-[10px] text-primary cursor-pointer hover:underline list-none">
                View transcript
              </summary>
              <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed bg-muted/40 rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {entry.full_transcript}
              </p>
            </details>
          )}
          {entry.csat_score != null && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium">CSAT:</span>{' '}
              <span className="text-yellow-500">{'★'.repeat(entry.csat_score)}{'☆'.repeat(5 - entry.csat_score)}</span>
              {' '}{entry.csat_score}/5
            </div>
          )}
        </>
      )}

      {entry.call_type === 'video' && (
        <>
          {entry.channel_name && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium">Channel:</span> #{entry.channel_name}
            </div>
          )}
          {entry.participants.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium">Participants:</span> {entry.participants.join(', ')}
            </div>
          )}
        </>
      )}

      {entry.call_type === 'meeting' && (
        <>
          {entry.description && (
            <div className="text-[10px] text-muted-foreground max-w-lg">
              <span className="font-medium">Description:</span> {entry.description}
            </div>
          )}
          {entry.location && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {entry.location}
            </div>
          )}
          {entry.attendees && entry.attendees.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium">Attendees:</span> {entry.attendees.join(', ')}
            </div>
          )}
        </>
      )}

      <div className="text-[10px] text-muted-foreground/60">
        {entry.started_at && <span>Started: {fmtDate(entry.started_at)}</span>}
        {entry.ended_at && <span className="ml-3">Ended: {fmtDate(entry.ended_at)}</span>}
      </div>
    </div>
  );
}

// ── Filter bar constants ───────────────────────────────────────────────────────

const TYPE_TABS = [
  { value: '', label: 'All' },
  { value: 'voice', label: 'Voice' },
  { value: 'video', label: 'Video' },
  { value: 'meeting', label: 'Meeting' },
];

const DIRECTION_OPTIONS = [
  { value: '', label: 'All directions' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'internal', label: 'Internal' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'active', label: 'Active' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ringing', label: 'Ringing' },
  { value: 'missed', label: 'Missed' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
  { value: 'scheduled', label: 'Scheduled' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VoiceCallLogPage() {
  const { authFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [callType, setCallType] = useState('');
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery<CallLogResponse>({
    queryKey: ['unified_call_log', callType, direction, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '200' });
      if (callType) params.set('call_type', callType);
      if (direction) params.set('direction', direction);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const res = await authFetch(`/api/v1/calls/log?${params}`);
      if (!res.ok) return { entries: [], total: 0, skip: 0, limit: 200 };
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const entries = data?.entries ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-primary" />
            <Video className="h-4 w-4 text-violet-500" />
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <h1 className="text-lg font-semibold">Call Log</h1>
          {data?.total != null && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.total} entries
            </span>
          )}
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-border/40 pb-0">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setCallType(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              callType === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border/40 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search number, name, channel…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={direction}
          onChange={e => setDirection(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          {DIRECTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Loading call log…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Phone className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No calls found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <AnimatePresence initial={false}>
              {entries.map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-3"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    {/* Type icon */}
                    <TypeIcon type={entry.call_type} direction={entry.direction} status={entry.status} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                          {entry.title}
                        </span>
                        <TypeBadge type={entry.call_type} />
                        <DirectionBadge direction={entry.direction} />
                        <StatusBadge status={entry.status} />
                        {/* Extras */}
                        {entry.recording_url && (
                          <Mic className="h-3 w-3 text-primary/60" title="Recording" />
                        )}
                        {entry.full_transcript && (
                          <FileText className="h-3 w-3 text-primary/60" title="Transcript" />
                        )}
                        {entry.participants.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Users className="h-2.5 w-2.5" />
                            {entry.participants.length}
                          </span>
                        )}
                        {entry.csat_score != null && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            ⭐{entry.csat_score}/5
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(entry.started_at)}</p>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {fmt(entry.duration_seconds)}
                    </div>

                    {/* Expand chevron */}
                    <div className="text-muted-foreground flex-shrink-0">
                      {expanded === entry.id
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expanded === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <EntryDetail entry={entry} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
