import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Phone, PhoneIncoming, Clock, Users, Activity,
  Headphones, Mic, Eye,
} from 'lucide-react';
import { CallControlsModal } from '@/components/CallControlsModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActiveCall {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  started_at: string;
  duration_secs: number;
  contact_id?: number;
  conversation_id?: string;
}

interface QueueEntry {
  id: number;
  call_sid: string;
  caller_number: string;
  caller_name?: string;
  status: string;
  priority: number;
  required_skill?: string;
  entered_at: string;
  wait_secs: number;
  assigned_agent_id?: number;
}

interface AgentPresence {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  presence_status: string;
  skills?: string[];
  current_call_sid?: string;
}

interface LiveSnapshot {
  active_calls: ActiveCall[];
  queue: QueueEntry[];
  agents: AgentPresence[];
  snapshot_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    in_call: 'bg-blue-500',
    offline: 'bg-gray-400',
  };
  return map[status] ?? 'bg-gray-400';
}

function priorityBadge(priority: number): string {
  if (priority >= 2) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (priority >= 1) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
}

// ── Duration counter (ticks every second) ─────────────────────────────────────

function LiveDuration({ startedAt, initialSecs }: { startedAt: string; initialSecs: number }) {
  const [secs, setSecs] = useState(initialSecs);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-sm tabular-nums">{fmt(secs)}</span>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveCallCard({ call, onControl }: { call: ActiveCall; onControl: (sid: string) => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <PhoneIncoming className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{call.from_number}</p>
          <p className="text-xs text-muted-foreground">{t('supervisor.to')}: {call.to_number}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <LiveDuration startedAt={call.started_at} initialSecs={call.duration_secs} />
          </div>
        </div>
      </div>
      <button
        onClick={() => onControl(call.call_sid)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <Headphones className="h-3.5 w-3.5" />
        {t('supervisor.bargeWhisper')}
      </button>
    </motion.div>
  );
}

function QueueCard({ entry }: { entry: QueueEntry }) {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{entry.caller_name || entry.caller_number}</span>
          {entry.priority > 0 && (
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${priorityBadge(entry.priority)}`}>
              {entry.priority >= 2 ? t('callQueue.priorityUrgent') : t('callQueue.priorityHigh')}
            </span>
          )}
          {entry.required_skill && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {entry.required_skill}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{fmt(entry.wait_secs)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function AgentCard({ agent }: { agent: AgentPresence }) {
  const { t } = useTranslation();
  const name = [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.email;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {(agent.first_name?.[0] || agent.email[0]).toUpperCase()}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColor(agent.presence_status)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground capitalize">{agent.presence_status.replace('_', ' ')}</p>
        </div>
      </div>
      {agent.current_call_sid && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
          <Activity className="h-3 w-3" />
          <span className="font-mono truncate">{agent.current_call_sid}</span>
        </div>
      )}
      {agent.skills && agent.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.skills.map(skill => (
            <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {skill}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SupervisorDashboardPage() {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const [controlCallSid, setControlCallSid] = useState<string | null>(null);

  const { data, isLoading } = useQuery<LiveSnapshot>({
    queryKey: ['supervisor-live'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/voice/supervisor/live');
      if (!res.ok) throw new Error('Failed to fetch live data');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const activeCalls = data?.active_calls ?? [];
  const queue = data?.queue ?? [];
  const agents = data?.agents ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 flex-shrink-0">
        <Radio className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t('supervisor.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('supervisor.subtitle')}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">{t('supervisor.live')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: t('supervisor.activeCalls'), value: activeCalls.length, icon: Phone, color: 'text-blue-600' },
            { label: t('supervisor.inQueue'), value: queue.length, icon: Clock, color: 'text-amber-600' },
            { label: t('supervisor.agentsOnline'), value: agents.filter(a => a.presence_status !== 'offline').length, icon: Users, color: 'text-emerald-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Calls */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            {t('supervisor.liveCalls')}
          </h2>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">{t('supervisor.loading')}</div>
          ) : activeCalls.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">
              {t('supervisor.noActiveCalls')}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {activeCalls.map(call => (
                  <LiveCallCard key={call.call_sid} call={call} onControl={setControlCallSid} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Queue */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            {t('supervisor.callQueue')} ({queue.length})
          </h2>
          {queue.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 text-center">
              {t('callQueue.queueEmpty')}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {queue.map(entry => (
                  <QueueCard key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Agents */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            {t('supervisor.agents')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Call controls modal */}
      {controlCallSid && (
        <CallControlsModal callSid={controlCallSid} onClose={() => setControlCallSid(null)} />
      )}
    </div>
  );
}
