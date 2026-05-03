import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { ConversationSummary } from '@/components/ConversationSummary';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Mail,
  Search,
  Plus,
  PanelLeftClose,
  PanelRightOpen,
  Clock,
  Send,
  Loader2,
  Sparkles,
  User as UserIcon,
  X,
  ChevronDown,
  ChevronLeft,
  Pen,
} from 'lucide-react';
import { getEmailSessions, composeEmail } from '@/services/emailInboxService';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

const parseUTCDate = (ts: string) => {
  if (!ts) return new Date(ts);
  return new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');
};

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

const ThreadSkeleton = () => (
  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
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
  last_message_timestamp: string;
  first_message_content: string;
  channel: string;
  assignee_id?: number;
  context?: Record<string, any>;
}

type TabType = 'all' | 'open' | 'resolved';
type CenterView = 'empty' | 'thread' | 'compose';

// ── Recipient Field (chip-based multi-select) ─────────────────────────────────
interface Recipient {
  id?: number;
  email: string;
  name?: string;
}

interface RecipientFieldProps {
  label: string;
  recipients: Recipient[];
  contacts: any[];
  onChange: (recipients: Recipient[]) => void;
  placeholder?: string;
}

const RecipientField: React.FC<RecipientFieldProps> = ({ label, recipients, contacts, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return [];
    const q = inputValue.toLowerCase();
    return contacts
      .filter(c => c.email && (
        c.name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      ))
      .filter(c => !recipients.some(r => r.email === c.email))
      .slice(0, 6);
  }, [inputValue, contacts, recipients]);

  const addRecipient = (r: Recipient) => {
    if (!r.email || recipients.some(x => x.email === r.email)) return;
    onChange([...recipients, r]);
    setInputValue('');
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeRecipient = (email: string) => {
    onChange(recipients.filter(r => r.email !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && inputValue.trim()) {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, '');
      if (email.includes('@')) addRecipient({ email });
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-start gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-12 shrink-0 pt-1.5">{label}</span>
      <div
        className="flex flex-wrap gap-1.5 flex-1 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {recipients.map(r => (
          <span
            key={r.email}
            className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800"
          >
            {r.name ? `${r.name} <${r.email}>` : r.email}
            <button
              onClick={(e) => { e.stopPropagation(); removeRecipient(r.email); }}
              className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setDropdownOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setDropdownOpen(true)}
          placeholder={recipients.length === 0 ? (placeholder || 'Type name or email...') : ''}
          className="flex-1 min-w-32 bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 py-0.5"
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {dropdownOpen && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-16 right-0 top-full z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden"
          >
            {filtered.map((c: any) => (
              <button
                key={c.id}
                onMouseDown={(e) => { e.preventDefault(); addRecipient({ id: c.id, email: c.email, name: c.name }); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {(c.name || c.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.name || c.email}</div>
                  {c.name && <div className="text-xs text-slate-400 truncate">{c.email}</div>}
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
interface ComposePanelProps {
  contacts: any[];
  signature: string;
  onSend: (data: { to: string[]; contact_id?: number; subject: string; body: string; cc?: string[]; bcc?: string[] }) => void;
  onDiscard: () => void;
  isSending: boolean;
}

const ComposePanel: React.FC<ComposePanelProps> = ({ contacts, signature, onSend, onDiscard, isSending }) => {
  const { t } = useTranslation();
  const [toRecipients, setToRecipients] = useState<Recipient[]>([]);
  const [ccRecipients, setCcRecipients] = useState<Recipient[]>([]);
  const [bccRecipients, setBccRecipients] = useState<Recipient[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [editableSignature, setEditableSignature] = useState(signature);
  const [isSignatureCollapsed, setIsSignatureCollapsed] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bodyRef.current?.focus(); }, []);

  const handleSend = () => {
    const fullBody = body + (editableSignature ? `\n\n--\n${editableSignature}` : '');
    onSend({
      to: toRecipients.map(r => r.email),
      contact_id: toRecipients.find(r => r.id)?.id,
      subject,
      body: fullBody,
      cc: ccRecipients.length ? ccRecipients.map(r => r.email) : undefined,
      bcc: bccRecipients.length ? bccRecipients.map(r => r.email) : undefined,
    });
  };

  const canSend = toRecipients.length > 0 && !!subject && !isSending;

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Pen className="h-4 w-4 text-red-500" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white">{t('email.newEmail')}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Cc / Bcc toggle buttons */}
          {!showCc && (
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-slate-400 hover:text-slate-600" onClick={() => setShowCc(true)}>
              {t('email.fieldCc')}
            </Button>
          )}
          {!showBcc && (
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-slate-400 hover:text-slate-600" onClick={() => setShowBcc(true)}>
              {t('email.fieldBcc')}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg ml-1" onClick={onDiscard}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* To */}
        <RecipientField
          label={t('email.fieldTo')}
          recipients={toRecipients}
          contacts={contacts}
          onChange={setToRecipients}
          placeholder={t('email.toPlaceholder')}
        />

        {/* CC */}
        <AnimatePresence initial={false}>
          {showCc && (
            <motion.div
              key="cc"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <RecipientField
                  label={t('email.fieldCc')}
                  recipients={ccRecipients}
                  contacts={contacts}
                  onChange={setCcRecipients}
                />
                <button
                  onClick={() => { setShowCc(false); setCcRecipients([]); }}
                  className="absolute right-4 top-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BCC */}
        <AnimatePresence initial={false}>
          {showBcc && (
            <motion.div
              key="bcc"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <RecipientField
                  label={t('email.fieldBcc')}
                  recipients={bccRecipients}
                  contacts={contacts}
                  onChange={setBccRecipients}
                />
                <button
                  onClick={() => { setShowBcc(false); setBccRecipients([]); }}
                  className="absolute right-4 top-2 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-12 shrink-0">{t('email.fieldSubject')}</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('email.subjectPlaceholder')}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 pt-4 min-h-0">
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('email.bodyPlaceholder')}
            className="flex-1 w-full bg-transparent text-sm text-slate-800 dark:text-white resize-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-0"
          />

          {/* Signature */}
          {editableSignature !== undefined && (
            <div className="border-t border-slate-100 dark:border-slate-800 mt-3 pt-3 flex-shrink-0">
              <button
                onClick={() => setIsSignatureCollapsed(!isSignatureCollapsed)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-2 transition-colors"
              >
                <motion.div animate={{ rotate: isSignatureCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
                {t('email.signature')}
              </button>
              <AnimatePresence initial={false}>
                {!isSignatureCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={editableSignature}
                      onChange={(e) => setEditableSignature(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 dark:text-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs" onClick={onDiscard}>
            {t('email.discard')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-5 gap-2"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('email.send')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const EmailInboxPage: React.FC = () => {
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

  const discardCompose = () => {
    setCenterView('empty');
  };

  // ── Data ──
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['email-sessions'],
    queryFn: getEmailSessions,
    refetchInterval: 30000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/contacts/?limit=200');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/company-settings/');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const signature = companySettings?.email_signature || '';

  const composeMutation = useMutation({
    mutationFn: composeEmail,
    onSuccess: (data) => {
      toast({ title: t('email.sentSuccess') });
      queryClient.invalidateQueries({ queryKey: ['email-sessions'] });
      if (data.session_id) {
        setSelectedSessionId(data.session_id);
        setCenterView('thread');
      } else {
        setCenterView('empty');
      }
    },
    onError: (err: any) => {
      toast({ title: t('email.sendFailed'), description: err.message, variant: 'destructive' });
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
        s.first_message_content?.toLowerCase().includes(q) ||
        (s.context?.subject as string)?.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      parseUTCDate(b.last_message_timestamp).getTime() - parseUTCDate(a.last_message_timestamp).getTime()
    );
  }, [sessions, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    all: sessions.length,
    open: sessions.filter(s => !['resolved', 'archived'].includes(s.status)).length,
    resolved: sessions.filter(s => ['resolved', 'archived'].includes(s.status)).length,
  }), [sessions]);

  // ── Thread Card ──
  const ThreadCard = ({ session, index }: { session: Session; index: number }) => {
    const isSelected = selectedSessionId === session.session_id && centerView === 'thread';
    const isResolved = ['resolved', 'archived'].includes(session.status);
    const subject = session.context?.subject || t('email.noSubject');

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
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800 shadow-lg ring-2 ring-blue-500/20'
            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600'
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Mail className="h-4 w-4 text-red-500 dark:text-red-400" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className={`font-semibold text-sm truncate ${isResolved ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {session.contact_name || t('email.unknown')}
              </h4>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.last_message_timestamp
                  ? formatDistanceToNow(parseUTCDate(session.last_message_timestamp), { addSuffix: true })
                  : '—'}
              </span>
            </div>
            <p className={`text-xs font-medium truncate mb-1 ${isResolved ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {subject}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate">{session.first_message_content}</p>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium shrink-0 ${
                isResolved
                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400'
              }`}>
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
    <div className="h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">

        {/* ── Left: Thread List ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'} ${(selectedSessionId || centerView === 'compose') ? 'hidden md:block' : 'block'}`}
        >
          <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute ${isRTL ? '-left-3' : '-right-3'} top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full p-2 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300`}
            >
              <motion.div animate={{ rotate: isSidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <PanelLeftClose className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <CardHeader className={`border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 py-4 ${isSidebarCollapsed ? 'px-2' : 'space-y-4'}`}>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-red-500 dark:text-red-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold dark:text-white">{t('email.title')}</CardTitle>
                          <p className="text-xs text-muted-foreground">{t('email.subtitle')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.div key={counts.all} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1 rounded-full">
                            {counts.all}
                          </Badge>
                        </motion.div>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={openCompose}>
                          <Plus className="h-3.5 w-3.5" /> {t('email.compose')}
                        </Button>
                      </div>
                    </div>

                    <div className="relative group">
                      <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors ${isRTL ? 'right-4' : 'left-4'}`} />
                      <Input
                        type="text"
                        placeholder={t('email.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl h-11 ${isRTL ? 'pr-11' : 'pl-11'} transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
                      <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                        {([
                          { value: 'all', label: t('email.tabAll'), count: counts.all, color: 'text-indigo-600 dark:text-blue-400' },
                          { value: 'open', label: t('email.tabOpen'), count: counts.open, color: 'text-blue-600 dark:text-blue-400' },
                          { value: 'resolved', label: t('email.tabDone'), count: counts.resolved, color: 'text-green-600 dark:text-green-400' },
                        ] as const).map(({ value, label, count, color }) => (
                          <TabsTrigger key={value} value={value} className="text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300 py-1.5">
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
                    <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">{counts.all}</Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>

            <CardContent className={`flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800 ${isSidebarCollapsed ? 'p-0' : 'p-3'}`}>
              {isLoading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {[...Array(5)].map((_, i) => <ThreadSkeleton key={i} />)}
                </motion.div>
              ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                  {filteredSessions.map((session, idx) => (
                    <ThreadCard key={session.session_id} session={session} index={idx} />
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
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => selectThread(session.session_id)}
                      className={`p-2.5 rounded-xl transition-all ${selectedSessionId === session.session_id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      title={session.contact_name}
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-red-500" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {searchQuery ? t('email.noMatches') : t('email.noThreads')}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mb-4">
                      {searchQuery ? t('email.tryAdjusting') : t('email.getStarted')}
                    </p>
                    {!searchQuery && (
                      <Button variant="outline" size="sm" onClick={openCompose}>
                        <Plus className="h-4 w-4 mr-1" /> {t('email.compose')}
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
                <ComposePanel
                  contacts={contacts}
                  signature={signature}
                  onSend={(data) => composeMutation.mutate(data)}
                  onDiscard={discardCompose}
                  isSending={composeMutation.isPending}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <Card className="h-full flex items-center justify-center shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="text-center p-8">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="inline-block mb-6">
                      <div className="w-24 h-24 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <Mail className="w-12 h-12 text-red-400 dark:text-red-400" />
                      </div>
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-2xl font-bold mb-3 text-slate-800 dark:text-white">
                      {t('email.selectThread')}
                    </motion.h3>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
                      {t('email.selectThreadDesc')}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Button onClick={openCompose}>
                        <Plus className="h-4 w-4 mr-2" /> {t('email.composeEmail')}
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
          <Card className="h-full flex flex-col shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className={`absolute ${isRTL ? '-right-3' : '-left-3'} top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full p-2 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300`}
            >
              <motion.div animate={{ rotate: isRightCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
                <PanelRightOpen className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <AnimatePresence mode="wait">
              {centerView === 'thread' && selectedSessionId ? (
                isRightCollapsed ? (
                  <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full p-2 gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {sidebarView === 'summary' ? <Sparkles className="h-6 w-6 text-slate-600 dark:text-slate-300" /> : <UserIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium" style={{ writingMode: 'vertical-rl' }}>
                      {sidebarView === 'summary' ? t('email.summary') : t('email.contact')}
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
                    <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-red-400" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="expanded-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                        <UserIcon className="w-10 h-10 text-red-400" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">{t('email.contactDetails')}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[180px] mx-auto">
                        {t('email.selectThreadContact')}
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

export default EmailInboxPage;
