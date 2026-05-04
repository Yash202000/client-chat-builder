import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { ConversationSummary } from '@/components/ConversationSummary';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Search,
  Plus,
  PanelLeftClose,
  PanelRightOpen,
  Phone,
  Clock,
  Send,
  Loader2,
  Sparkles,
  User as UserIcon,
  X,
  ChevronLeft,
  Pen,
} from 'lucide-react';
import { getSMSSessions, sendSMS } from '@/services/smsInboxService';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

const parseUTCDate = (ts: string) => {
  if (!ts) return new Date(ts);
  return new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');
};

const SMS_CHAR_LIMIT = 160;

// ── Animation Variants ────────────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
  hover: { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 10 } },
  tap: { scale: 0.98 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const ThreadSkeleton = () => (
  <div className="p-4 border-b border-slate-100 dark:border-white/[0.10]">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
        <div className="h-3 w-1/3 rounded skeleton" />
      </div>
    </div>
  </div>
);

interface Session {
  session_id: string;
  status: string;
  contact_name: string;
  contact_phone?: string;
  last_message_timestamp: string;
  first_message_content: string;
  channel: string;
  assignee_id?: number;
}

type TabType = 'all' | 'open' | 'resolved';
type CenterView = 'empty' | 'thread' | 'compose';

// ── Contact selector for compose panel ───────────────────────────────────────
interface ContactSelectorProps {
  contacts: any[];
  value: { id: number; name: string; phone: string } | null;
  onChange: (c: { id: number; name: string; phone: string } | null) => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({ contacts, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts.filter((c: any) => c.phone_number).slice(0, 8);
    const q = query.toLowerCase();
    return contacts
      .filter((c: any) => c.phone_number && (
        c.name?.toLowerCase().includes(q) || c.phone_number.includes(q)
      ))
      .slice(0, 8);
  }, [query, contacts]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (c: any) => {
    onChange({ id: c.id, name: c.name || c.phone_number, phone: c.phone_number });
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.08]">
      <span className="text-xs font-semibold text-slate-400 dark:text-white/35 w-8 shrink-0">To</span>
      {value ? (
        <div className="flex items-center gap-1.5 flex-1">
          <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
            {value.name} · {value.phone}
            <button
              onClick={() => onChange(null)}
              className="ml-0.5 hover:text-green-900 dark:hover:text-green-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or phone…"
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 py-0.5"
        />
      )}

      <AnimatePresence>
        {open && filtered.length > 0 && !value && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-14 right-0 top-full z-50 bg-white dark:bg-card border border-slate-200 dark:border-white/[0.10] rounded-xl shadow-lg overflow-hidden"
          >
            {filtered.map((c: any) => (
              <button
                key={c.id}
                onMouseDown={(e) => { e.preventDefault(); select(c); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {(c.name || c.phone_number)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.name || c.phone_number}</div>
                  <div className="text-xs text-slate-400 truncate">{c.phone_number}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Compose Panel ─────────────────────────────────────────────────────────────
interface ComposeSMSPanelProps {
  contacts: any[];
  onSend: (data: { contact_id: number; message: string }) => void;
  onDiscard: () => void;
  isSending: boolean;
}

const ComposeSMSPanel: React.FC<ComposeSMSPanelProps> = ({ contacts, onSend, onDiscard, isSending }) => {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState<{ id: number; name: string; phone: string } | null>(null);
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const msgCount = Math.ceil(message.length / SMS_CHAR_LIMIT) || 1;
  const canSend = !!recipient && message.trim().length > 0 && !isSending;

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-card border-slate-200 dark:border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/[0.08] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <Pen className="h-4 w-4 text-green-600" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white">{t('sms.newSMS')}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onDiscard}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Fields */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* To */}
        <ContactSelector contacts={contacts} value={recipient} onChange={setRecipient} />

        {/* Message */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 pt-4 min-h-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('sms.messagePlaceholder')}
            className="flex-1 w-full bg-transparent text-sm text-slate-800 dark:text-white resize-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-0"
          />

          {/* Char counter */}
          <div className="border-t border-slate-100 dark:border-white/[0.08] mt-3 pt-2 pb-1 flex-shrink-0">
            <span className={`text-xs ${message.length > SMS_CHAR_LIMIT ? 'text-violet-500' : 'text-slate-400'}`}>
              {message.length} chars · {msgCount} SMS segment{msgCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-white/[0.08] flex-shrink-0">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs" onClick={onDiscard}>
            {t('sms.cancel')}
          </Button>
          <Button
            onClick={() => recipient && onSend({ contact_id: recipient.id, message })}
            disabled={!canSend}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl px-5 gap-2"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('sms.sendSMS')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const SMSInboxPage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [centerView, setCenterView] = useState<CenterView>('empty');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [sidebarView, setSidebarView] = useState<'contact' | 'summary'>('contact');

  React.useEffect(() => { setSidebarView('contact'); }, [selectedSessionId]);

  const selectThread = (id: string) => {
    setSelectedSessionId(id);
    setCenterView('thread');
  };

  const openCompose = () => {
    setSelectedSessionId(null);
    setCenterView('compose');
  };

  const discardCompose = () => setCenterView('empty');

  // ── Data ──
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sms-sessions'],
    queryFn: getSMSSessions,
    refetchInterval: 15000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/contacts/?limit=200');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const sendNewSMSMutation = useMutation({
    mutationFn: sendSMS,
    onSuccess: (data) => {
      toast({ title: t('sms.sentSuccess') });
      queryClient.invalidateQueries({ queryKey: ['sms-sessions'] });
      if (data.session_id) {
        setSelectedSessionId(data.session_id);
        setCenterView('thread');
      } else {
        setCenterView('empty');
      }
    },
    onError: (err: any) => {
      toast({ title: t('sms.sendFailed'), description: err.message, variant: 'destructive' });
    },
  });

  // ── Filtering ──
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (activeTab === 'resolved') result = result.filter(s => ['resolved', 'archived'].includes(s.status));
    else if (activeTab === 'open') result = result.filter(s => !['resolved', 'archived'].includes(s.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.contact_name?.toLowerCase().includes(q) ||
        s.contact_phone?.includes(q) ||
        s.first_message_content?.toLowerCase().includes(q)
      );
    }
    return [...result].sort(
      (a, b) => parseUTCDate(b.last_message_timestamp).getTime() - parseUTCDate(a.last_message_timestamp).getTime()
    );
  }, [sessions, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    all: sessions.length,
    open: sessions.filter(s => !['resolved', 'archived'].includes(s.status)).length,
    resolved: sessions.filter(s => ['resolved', 'archived'].includes(s.status)).length,
  }), [sessions]);

  // ── SMS Thread Card ──
  const SMSCard = ({ session, index }: { session: Session; index: number }) => {
    const isSelected = selectedSessionId === session.session_id && centerView === 'thread';
    const isResolved = ['resolved', 'archived'].includes(session.status);

    return (
      <motion.button
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        onClick={() => selectThread(session.session_id)}
        className={`w-full p-4 text-left rounded-xl border transition-all duration-300 ${
          isSelected
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800 shadow-lg ring-2 ring-green-500/20'
            : 'bg-white dark:bg-white/[0.07]/50 border-slate-100 dark:border-white/[0.10]/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600'
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-shrink-0 relative">
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            {!isResolved && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-white/[0.08]" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className={`font-semibold text-sm truncate ${isResolved ? 'text-slate-500 dark:text-white/50' : 'text-slate-800 dark:text-white'}`}>
                {session.contact_name || session.contact_phone || t('sms.unknown')}
              </h4>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.last_message_timestamp
                  ? formatDistanceToNow(parseUTCDate(session.last_message_timestamp), { addSuffix: true })
                  : '—'}
              </span>
            </div>
            {session.contact_phone && (
              <p className="text-xs text-muted-foreground mb-1">{session.contact_phone}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate">{session.first_message_content}</p>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium shrink-0 ${
                  isResolved
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                }`}
              >
                {session.status}
              </Badge>
            </div>
          </div>
        </div>
      </motion.button>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full overflow-hidden bg-slate-50 dark:bg-background">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">

        {/* ── Left: Conversation List ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'} ${(selectedSessionId || centerView === 'compose') ? 'hidden md:block' : 'block'}`}
        >
          <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-card border-slate-200 dark:border-white/[0.08] relative overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute ${isRTL ? '-left-3' : '-right-3'} top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-white/[0.07] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-white/80 rounded-full p-2 shadow-sm border border-slate-200 dark:border-white/[0.10] transition-all duration-300`}
            >
              <motion.div animate={{ rotate: isSidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <PanelLeftClose className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <CardHeader className={`border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-card flex-shrink-0 py-4 ${isSidebarCollapsed ? 'px-2' : 'space-y-4'}`}>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold dark:text-white">{t('sms.title')}</CardTitle>
                          <p className="text-xs text-muted-foreground">{t('sms.subtitle')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.div key={counts.all} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-white/[0.10] text-slate-700 dark:text-white/90 font-semibold px-3 py-1 rounded-full">
                            {counts.all}
                          </Badge>
                        </motion.div>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={openCompose}>
                          <Plus className="h-3.5 w-3.5" />
                          {t('sms.newSMS')}
                        </Button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                      <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-green-500 transition-colors ${isRTL ? 'right-4' : 'left-4'}`} />
                      <Input
                        type="text"
                        placeholder={t('sms.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-white dark:bg-card/50 border-slate-200 dark:border-white/[0.10] rounded-xl h-11 ${isRTL ? 'pr-11' : 'pl-11'} transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`}
                      />
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
                      <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 dark:bg-white/[0.06] p-1 rounded-xl gap-1">
                        {([
                          { value: 'all', label: t('sms.tabAll'), count: counts.all, color: 'text-indigo-600 dark:text-blue-400' },
                          { value: 'open', label: t('sms.tabOpen'), count: counts.open, color: 'text-green-600 dark:text-green-400' },
                          { value: 'resolved', label: t('sms.tabDone'), count: counts.resolved, color: 'text-blue-600 dark:text-blue-400' },
                        ] as const).map(({ value, label, count, color }) => (
                          <TabsTrigger key={value} value={value} className="text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.12] data-[state=active]:shadow-md transition-all duration-300 py-1.5">
                            <span className="flex items-center gap-1.5">
                              <span>{label}</span>
                              <motion.span key={count} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`text-xs font-bold ${color}`}>{count}</motion.span>
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isSidebarCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 items-center py-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">{counts.all}</Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>

            <CardContent className={`flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white dark:from-background/50 dark:to-white/[0.04] ${isSidebarCollapsed ? 'p-0' : 'p-3'}`}>
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {[...Array(5)].map((_, i) => <ThreadSkeleton key={i} />)}
                </motion.div>
              ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                  {filteredSessions.map((session, idx) => (
                    <SMSCard key={session.session_id} session={session} index={idx} />
                  ))}
                </motion.div>
              ) : isSidebarCollapsed && filteredSessions.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 p-2">
                  {filteredSessions.slice(0, 10).map((session, idx) => (
                    <motion.button
                      key={session.session_id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectThread(session.session_id)}
                      className={`p-2.5 rounded-xl transition-all relative ${
                        selectedSessionId === session.session_id ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={session.contact_name || session.contact_phone}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-white/[0.07] flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-10 h-10 text-slate-400 dark:text-white/35" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-white/80 mb-2">
                      {searchQuery ? t('sms.noMatches') : t('sms.noConversations')}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mb-4">
                      {searchQuery ? t('sms.tryAdjusting') : t('sms.getStarted')}
                    </p>
                    {!searchQuery && (
                      <Button variant="outline" size="sm" onClick={openCompose}>
                        <Plus className="h-4 w-4 mr-1" /> {t('sms.newSMS')}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Center ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${
            isSidebarCollapsed && isRightCollapsed ? 'md:col-span-10' :
            isSidebarCollapsed ? 'md:col-span-8' :
            isRightCollapsed ? 'md:col-span-8' :
            'md:col-span-6'
          } ${(selectedSessionId || centerView === 'compose') ? 'block' : 'hidden md:block'}`}
        >
          <AnimatePresence mode="wait">
            {centerView === 'thread' && selectedSessionId ? (
              <motion.div key={selectedSessionId} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }} className="h-full">
                <button className="md:hidden flex items-center gap-1 text-sm text-muted-foreground p-2" onClick={() => { setSelectedSessionId(null); setCenterView('empty'); }}><ChevronLeft className="h-4 w-4" />Back</button>
                <ConversationDetail
                  sessionId={selectedSessionId}
                  agentId={1}
                  onSummaryClick={() => setSidebarView(sidebarView === 'summary' ? 'contact' : 'summary')}
                />
              </motion.div>
            ) : centerView === 'compose' ? (
              <motion.div key="compose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }} className="h-full">
                <button className="md:hidden flex items-center gap-1 text-sm text-muted-foreground p-2" onClick={() => setCenterView('empty')}><ChevronLeft className="h-4 w-4" />Back</button>
                <ComposeSMSPanel
                  contacts={contacts}
                  onSend={(data) => sendNewSMSMutation.mutate(data)}
                  onDiscard={discardCompose}
                  isSending={sendNewSMSMutation.isPending}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Card className="h-full flex items-center justify-center shadow-sm bg-white dark:bg-card border-slate-200 dark:border-white/[0.08] overflow-hidden">
                  <div className="text-center p-8">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="inline-block mb-6">
                      <div className="w-24 h-24 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-green-500 dark:text-green-400" />
                      </div>
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold mb-3 text-slate-800 dark:text-white">
                      {t('sms.selectConversation')}
                    </motion.h3>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-500 dark:text-white/50 max-w-sm mx-auto leading-relaxed mb-6">
                      {t('sms.selectConversationDesc')}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Button onClick={openCompose}>
                        <Plus className="h-4 w-4 mr-2" /> {t('sms.newSMS')}
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Right: Contact / Summary ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${isRightCollapsed ? 'md:col-span-1' : 'md:col-span-3'} hidden md:block`}
        >
          <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-card border-slate-200 dark:border-white/[0.08] relative overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className={`absolute ${isRTL ? '-right-3' : '-left-3'} top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-white/[0.07] hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-white/80 rounded-full p-2 shadow-sm border border-slate-200 dark:border-white/[0.10] transition-all duration-300`}
            >
              <motion.div animate={{ rotate: isRightCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <PanelRightOpen className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <AnimatePresence mode="wait">
              {centerView === 'thread' && selectedSessionId ? (
                isRightCollapsed ? (
                  <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full p-2 gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/[0.07] flex items-center justify-center">
                      {sidebarView === 'summary' ? <Sparkles className="h-6 w-6 text-slate-600 dark:text-white/80" /> : <UserIcon className="h-6 w-6 text-slate-600 dark:text-white/80" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium" style={{ writingMode: 'vertical-rl' }}>
                      {sidebarView === 'summary' ? t('sms.summary') : t('sms.contact')}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-hidden">
                    {sidebarView === 'summary'
                      ? <ConversationSummary sessionId={selectedSessionId} onBack={() => setSidebarView('contact')} />
                      : <ContactProfile sessionId={selectedSessionId} />
                    }
                  </motion.div>
                )
              ) : (
                isRightCollapsed ? (
                  <motion.div key="collapsed-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full p-2">
                    <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-green-500" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="expanded-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                        <UserIcon className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">{t('sms.contactDetails')}</h3>
                      <p className="text-slate-500 dark:text-white/50 text-sm max-w-[180px] mx-auto">
                        {t('sms.selectConversationContact')}
                      </p>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SMSInboxPage;
