import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Phone, PhoneIncoming, PhoneCall, Clock, Loader2, CheckCircle, PhoneForwarded } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CallControlsModal } from '@/components/CallControlsModal';

interface QueueEntry {
  id: number;
  call_sid: string;
  source: string;
  caller_number: string;
  caller_name?: string;
  status: string;
  priority: number;
  entered_at: string;
  wait_secs?: number;
  assigned_agent_id?: number;
}

interface QueueStats {
  waiting: number;
  ringing: number;
  connected: number;
  avg_wait_secs: number;
  max_wait_secs: number;
}

function fmtWait(secs?: number): string {
  if (!secs) return '0s';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function PriorityBadge({ priority }: { priority: number }) {
  const { t } = useTranslation();
  if (priority === 0) return null;
  const label = priority >= 2 ? t('callQueue.priorityUrgent') : t('callQueue.priorityHigh');
  const cls = priority >= 2
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export function CallQueuePanel() {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [transferSid, setTransferSid] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<QueueEntry[]>({
    queryKey: ['call_queue'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/voice/queue/?status=waiting');
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<QueueStats>({
    queryKey: ['call_queue_stats'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/voice/queue/stats');
      if (!res.ok) return { waiting: 0, ringing: 0, connected: 0, avg_wait_secs: 0, max_wait_secs: 0 };
      return res.json();
    },
    refetchInterval: 5000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/voice/queue/${id}/accept`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to accept');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call_queue'] });
      queryClient.invalidateQueries({ queryKey: ['call_queue_stats'] });
      toast({ title: t('callQueue.accepted'), description: t('callQueue.acceptedDesc'), variant: 'success' });
    },
    onError: () => toast({ title: t('callQueue.acceptFailed'), variant: 'destructive' }),
  });

  const statsItems = [
    { label: t('callQueue.waiting'), value: stats?.waiting ?? 0, icon: <PhoneIncoming className="h-3.5 w-3.5" />, color: 'text-amber-500' },
    { label: t('callQueue.onCall'), value: stats?.connected ?? 0, icon: <PhoneCall className="h-3.5 w-3.5" />, color: 'text-emerald-500' },
    { label: t('callQueue.avgWait'), value: fmtWait(stats?.avg_wait_secs), icon: <Clock className="h-3.5 w-3.5" />, color: 'text-blue-500' },
  ];

  return (
    <div className="flex flex-col h-full">
      {transferSid && (
        <CallControlsModal callSid={transferSid} onClose={() => setTransferSid(null)} />
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/60">
        {statsItems.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg py-2">
            <span className={s.color}>{s.icon}</span>
            <span className="text-sm font-bold text-foreground">{s.value}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <CheckCircle className="h-8 w-8 text-emerald-500/50 mb-2" />
            <p className="text-sm font-medium text-foreground/70">{t('callQueue.queueEmpty')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('callQueue.noCallsWaiting')}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {entries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card border border-border rounded-xl p-3 flex items-start gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">#{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {entry.caller_name || entry.caller_number}
                      </span>
                      <PriorityBadge priority={entry.priority} />
                      <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {entry.source}
                      </span>
                    </div>
                    {entry.caller_name && (
                      <p className="text-[11px] text-muted-foreground">{entry.caller_number}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {t('callQueue.waitingFor', { time: fmtWait(entry.wait_secs) })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {entry.status === 'connected' && (
                      <button
                        onClick={() => setTransferSid(entry.call_sid)}
                        className="h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white transition-colors shadow-sm"
                        title={t('callQueue.transferSupervise')}
                      >
                        <PhoneForwarded className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {entry.status === 'waiting' && (
                      <button
                        onClick={() => acceptMutation.mutate(entry.id)}
                        disabled={acceptMutation.isPending}
                        className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors shadow-sm disabled:opacity-60"
                        title={t('callQueue.acceptCall')}
                      >
                        {acceptMutation.isPending && acceptMutation.variables === entry.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Phone className="h-3.5 w-3.5" />
                        }
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
