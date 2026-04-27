import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Clock, Mic, FileText, Search, Download,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface VoiceCall {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  status: string;
  started_at: string;
  duration_seconds?: number;
  recording_url?: string;
  recording_duration_secs?: number;
  full_transcript?: string;
  conversation_id?: string;
  contact_id?: number;
  csat_score?: number;
  csat_sent_at?: string;
}

interface VoiceCallListResponse {
  calls: VoiceCall[];
  total: number;
  skip: number;
  limit: number;
}

function fmt(secs?: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    no_answer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    busy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  if (status === 'no_answer' || status === 'failed') return <PhoneMissed className="h-4 w-4 text-red-500" />;
  if (direction === 'inbound') return <PhoneIncoming className="h-4 w-4 text-emerald-500" />;
  return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
}

function MiniPlayer({ url, duration }: { url: string; duration?: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const progress = duration && duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 mt-2 bg-muted/50 rounded-lg px-2 py-1.5">
      <audio ref={ref} src={url}
        onTimeUpdate={() => setCurrent(ref.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)} preload="metadata" />
      <button
        onClick={() => {
          if (!ref.current) return;
          if (playing) { ref.current.pause(); setPlaying(false); }
          else { ref.current.play(); setPlaying(true); }
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

export default function VoiceCallLogPage() {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery<VoiceCallListResponse>({
    queryKey: ['voice_call_log', direction, status],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (direction) params.set('direction', direction);
      if (status) params.set('status', status);
      const res = await authFetch(`/api/v1/twilio/calls?${params}`);
      if (!res.ok) return { calls: [], total: 0, skip: 0, limit: 100 };
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const calls = (data?.calls ?? []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.from_number.includes(q) || c.to_number.includes(q) || (c.call_sid ?? '').includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{t('voiceCallLog.title')}</h1>
          {data?.total != null && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.total} {t('voiceCallLog.total')}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border/40">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder={t('voiceCallLog.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={direction}
          onChange={e => setDirection(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value="">{t('voiceCallLog.allDirections')}</option>
          <option value="inbound">{t('voiceCallLog.inbound')}</option>
          <option value="outbound">{t('voiceCallLog.outbound')}</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value="">{t('voiceCallLog.allStatuses')}</option>
          <option value="completed">{t('voiceCallLog.completed')}</option>
          <option value="in_progress">{t('voiceCallLog.inProgress')}</option>
          <option value="no_answer">{t('voiceCallLog.noAnswer')}</option>
          <option value="failed">{t('voiceCallLog.failed')}</option>
          <option value="busy">{t('voiceCallLog.busy')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">{t('voiceCallLog.loading')}</div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Phone className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{t('voiceCallLog.noCallsFound')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            <AnimatePresence initial={false}>
              {calls.map(call => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-3"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpanded(expanded === call.id ? null : call.id)}
                  >
                    <DirectionIcon direction={call.direction} status={call.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {call.direction === 'inbound' ? call.from_number : call.to_number}
                        </span>
                        <StatusBadge status={call.status} />
                        <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                          {call.direction}
                        </span>
                        {call.recording_url && (
                          <Mic className="h-3 w-3 text-primary/60" title="Recording available" />
                        )}
                        {call.full_transcript && (
                          <FileText className="h-3 w-3 text-primary/60" title="Transcript available" />
                        )}
                        {call.csat_score != null && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {'⭐'.repeat(call.csat_score)}{call.csat_score}/5
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(call.started_at)}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {fmt(call.duration_seconds)}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded === call.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pl-7 space-y-2">
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-medium">{t('voiceCallLog.sid')}:</span> {call.call_sid}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-medium">{t('voiceCallLog.from')}:</span> {call.from_number}
                            {' · '}
                            <span className="font-medium">{t('voiceCallLog.to')}:</span> {call.to_number}
                          </div>
                          {call.recording_url && (
                            <MiniPlayer
                              url={call.recording_url}
                              duration={call.recording_duration_secs ?? call.duration_seconds}
                            />
                          )}
                          {call.full_transcript && (
                            <details className="group">
                              <summary className="text-[10px] text-primary cursor-pointer hover:underline list-none">
                                {t('voiceCallLog.viewTranscript')}
                              </summary>
                              <p className="mt-1 text-[11px] text-foreground/80 leading-relaxed bg-muted/40 rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                {call.full_transcript}
                              </p>
                            </details>
                          )}
                        </div>
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
