import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Play, Pause, Square, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactItem {
  id: number;
  name?: string;
  phone_number?: string;
  email?: string;
}

interface ContactsResponse {
  contacts: ContactItem[];
  total: number;
}

interface DialerResult {
  contact_id: number;
  phone_number?: string;
  name?: string;
  outcome: string;
  call_sid?: string;
  dialed_at: string;
}

interface DialerSession {
  id: number;
  status: string;
  total: number;
  dialed: number;
  answered: number;
  failed: number;
  contact_ids: number[];
  message_template?: string;
  created_at: string;
  results: DialerResult[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function outcomeBadge(outcome: string) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'no-answer': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    skipped: 'bg-muted text-muted-foreground',
    no_phone: 'bg-muted text-muted-foreground',
  };
  return map[outcome] ?? 'bg-muted text-muted-foreground';
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DialerPage() {
  const { t } = useTranslation();
  const { authFetch, user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [template, setTemplate] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Contacts list
  const { data: contactsData } = useQuery<ContactsResponse>({
    queryKey: ['dialer-contacts', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await authFetch(`/api/v1/contacts?${params}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  // Active session polling
  const { data: session } = useQuery<DialerSession>({
    queryKey: ['dialer-session', activeSessionId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/dialer/sessions/${activeSessionId}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeSessionId,
    refetchInterval: (q) => {
      const s = q.state.data;
      return s && ['running', 'paused'].includes(s.status) ? 2000 : false;
    },
  });

  // Create session
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/v1/dialer/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: Array.from(selected),
          agent_user_id: (user as any)?.id ?? 0,
          message_template: template || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<DialerSession>;
    },
    onSuccess: (s) => {
      setActiveSessionId(s.id);
      qc.invalidateQueries({ queryKey: ['dialer-sessions'] });
      toast({ title: t('dialer.sessionCreated'), variant: 'success' });
    },
    onError: (e: Error) => toast({ title: t('dialer.error'), description: e.message, variant: 'destructive' }),
  });

  // Control mutations
  const controlMutation = useMutation({
    mutationFn: async (action: 'start' | 'pause' | 'stop') => {
      if (!activeSessionId) return;
      const res = await authFetch(`/api/v1/dialer/sessions/${activeSessionId}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dialer-session', activeSessionId] }),
    onError: (e: Error) => toast({ title: t('dialer.error'), description: e.message, variant: 'destructive' }),
  });

  const contacts = contactsData?.contacts ?? [];
  const progress = session && session.total > 0 ? (session.dialed / session.total) * 100 : 0;

  function toggleContact(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60 flex-shrink-0">
        <Phone className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t('dialer.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('dialer.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-0">
        {/* Left: Contact selector */}
        <div className="hidden md:flex md:w-80 border-r border-border/60 flex-col flex-shrink-0">
          <div className="p-4 border-b border-border/40">
            <Input
              placeholder={t('dialer.searchContacts')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1.5">{t('dialer.selected', { count: selected.size })}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(c => (
              <button
                key={c.id}
                onClick={() => toggleContact(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                  selected.has(c.id) ? 'bg-primary/5 border-l-2 border-primary' : ''
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  selected.has(c.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {(c.name?.[0] || c.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name || c.email}</p>
                  {c.phone_number && (
                    <p className="text-xs text-muted-foreground font-mono">{c.phone_number}</p>
                  )}
                </div>
              </button>
            ))}
            {contacts.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">{t('dialer.noContacts')}</div>
            )}
          </div>
        </div>

        {/* Right: Controls + Progress + Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Message template */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              {t('dialer.messageTemplate')}
            </label>
            <textarea
              className="w-full h-24 text-sm bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t('dialer.templatePlaceholder')}
              value={template}
              onChange={e => setTemplate(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            {!activeSessionId ? (
              <button
                onClick={() => createMutation.mutate()}
                disabled={selected.size === 0 || createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                <Play className="h-4 w-4" />
                {t('dialer.createSession', { count: selected.size })}
              </button>
            ) : (
              <>
                {session?.status === 'pending' || session?.status === 'paused' ? (
                  <button
                    onClick={() => controlMutation.mutate('start')}
                    disabled={controlMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    {t('dialer.start')}
                  </button>
                ) : session?.status === 'running' ? (
                  <button
                    onClick={() => controlMutation.mutate('pause')}
                    disabled={controlMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                  >
                    <Pause className="h-4 w-4" />
                    {t('dialer.pause')}
                  </button>
                ) : null}
                {session && !['completed', 'stopped'].includes(session.status) && (
                  <button
                    onClick={() => controlMutation.mutate('stop')}
                    disabled={controlMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    {t('dialer.stop')}
                  </button>
                )}
                <button
                  onClick={() => { setActiveSessionId(null); setSelected(new Set()); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  {t('dialer.newSession')}
                </button>
              </>
            )}
          </div>

          {/* Progress */}
          {session && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{t('dialer.progress')}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                  session.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  session.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  session.status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {session.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dialer.dialedOf', { dialed: session.dialed, total: session.total })}
              </p>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t('dialer.answered'), value: session.answered, icon: CheckCircle, color: 'text-emerald-500' },
                  { label: t('dialer.failed'), value: session.failed, icon: XCircle, color: 'text-red-500' },
                  { label: t('dialer.pending'), value: session.total - session.dialed, icon: Clock, color: 'text-muted-foreground' },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-3">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results table */}
          {session && session.results.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60">
                <h3 className="text-sm font-semibold text-foreground">{t('dialer.results')}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{t('dialer.contact')}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{t('dialer.phone')}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{t('dialer.outcome')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {session.results.map((r, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-2.5 font-medium text-foreground">{r.name || `Contact ${r.contact_id}`}</td>
                          <td className="px-5 py-2.5 text-muted-foreground font-mono text-xs">{r.phone_number || '—'}</td>
                          <td className="px-5 py-2.5">
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${outcomeBadge(r.outcome)}`}>
                              {r.outcome.replace('-', ' ')}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
