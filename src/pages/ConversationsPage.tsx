import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { ConversationSummary } from '@/components/ConversationSummary';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Session, User, PRIORITY_CONFIG } from '@/types';
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare, Phone, Globe, Instagram, Mail, Send, Search, Filter,
  Archive, PanelLeftClose, PanelRightOpen, AlertTriangle, ArrowUp, Minus,
  ArrowDown, Inbox, Users, CheckCircle2, LayoutGrid, Sparkles, Clock,
  User as UserIcon, Loader2, ChevronLeft
} from 'lucide-react';
import SLATimer from '@/components/SLATimer';
import { getWebSocketUrl } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const MessengerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);
const TwilioIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zM9.75 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
  </svg>
);
const ApiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l4.62 4.62 2.5 2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-4.62-4.62-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l4.62-4.62-2.5-2.5L12 18z"/>
  </svg>
);

const CHANNEL_CONFIG: Record<string, {
  titleKey: string;
  subtitleKey: string;
  iconClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  web_chat:     { titleKey: 'navigation.activeClients', subtitleKey: 'conversations.channelSubtitle.webChat',    iconClass: 'text-blue-600 dark:text-blue-400',    Icon: ({ className }) => <Globe className={className} /> },
  whatsapp:     { titleKey: 'navigation.whatsappInbox', subtitleKey: 'conversations.channelSubtitle.whatsapp',  iconClass: 'text-green-600 dark:text-green-400',  Icon: WhatsAppIcon },
  instagram:    { titleKey: 'navigation.instagramInbox',subtitleKey: 'conversations.channelSubtitle.instagram', iconClass: 'text-pink-600 dark:text-pink-400',    Icon: InstagramIcon },
  messenger:    { titleKey: 'navigation.messengerInbox',subtitleKey: 'conversations.channelSubtitle.messenger', iconClass: 'text-blue-500 dark:text-blue-400',    Icon: MessengerIcon },
  telegram:     { titleKey: 'navigation.telegramInbox', subtitleKey: 'conversations.channelSubtitle.telegram',  iconClass: 'text-sky-500 dark:text-sky-400',      Icon: TelegramIcon },
  twilio_voice: { titleKey: 'navigation.twilioInbox',   subtitleKey: 'conversations.channelSubtitle.twilio',   iconClass: 'text-red-500 dark:text-red-400',       Icon: TwilioIcon },
  api:          { titleKey: 'navigation.apiInbox',      subtitleKey: 'conversations.channelSubtitle.api',      iconClass: 'text-cyan-600 dark:text-cyan-400',     Icon: ApiIcon },
};

const parseUTCDate = (ts: string) => {
  if (!ts) return new Date(ts);
  // Backend sends naive UTC datetimes without 'Z' — append it so browser parses as UTC
  return new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');
};
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

// ─── Motion variants ──────────────────────────────────────────────────────────
const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
  hover: { x: 1, transition: { duration: 0.1 } },
  tap: { scale: 0.99 },
};

// ─── Channel avatar bg helper ─────────────────────────────────────────────────
const channelAvatarBg = (ch?: string) => {
  switch (ch) {
    case 'whatsapp':     return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'instagram':    return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
    case 'messenger':    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'telegram':     return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
    case 'twilio_voice': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    default:             return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
};

// ─── Avatar color derived from contact name ───────────────────────────────────
const getAvatarColor = (name: string) => {
  const palette = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

// ─── Channel badge config ─────────────────────────────────────────────────────
const CHANNEL_BADGE_MAP: Record<string, { label: string; cls: string }> = {
  web_chat:     { label: 'Web',   cls: 'conv-channel-badge-web' },
  web:          { label: 'Web',   cls: 'conv-channel-badge-web' },
  websocket:    { label: 'Web',   cls: 'conv-channel-badge-web' },
  whatsapp:     { label: 'WA',    cls: 'conv-channel-badge-whatsapp' },
  instagram:    { label: 'IG',    cls: 'conv-channel-badge-instagram' },
  messenger:    { label: 'FB',    cls: 'conv-channel-badge-messenger' },
  telegram:     { label: 'TG',    cls: 'conv-channel-badge-telegram' },
  twilio_voice: { label: 'Voice', cls: 'conv-channel-badge-voice' },
  freeswitch:   { label: 'Voice', cls: 'conv-channel-badge-voice' },
  gmail:        { label: 'Email', cls: 'conv-channel-badge-email' },
  api:          { label: 'API',   cls: 'conv-channel-badge-api' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const ConversationSkeleton = () => (
  <div className="conv-skeleton">
    <div className="conv-skeleton-avatar" />
    <div className="flex-1 space-y-2 pt-0.5">
      <div className="flex justify-between gap-2">
        <div className="conv-skeleton-line h-3 w-2/5" />
        <div className="conv-skeleton-line h-2.5 w-10" />
      </div>
      <div className="conv-skeleton-line h-2.5 w-3/4" />
      <div className="flex gap-1.5">
        <div className="conv-skeleton-line h-4 w-12" />
        <div className="conv-skeleton-line h-4 w-10" />
      </div>
    </div>
  </div>
);

interface ConversationsPageProps {
  channel?: string;
}

const ConversationsPage: React.FC<ConversationsPageProps> = ({ channel }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { user, token, authFetch, isLoading: isAuthLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'open' | 'resolved' | 'all'>('open');
  const [unreadAssignments, setUnreadAssignments] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [reopenedSessions, setReopenedSessions] = useState<Set<string>>(new Set());
  const [sidebarView, setSidebarView] = useState<'contact' | 'summary'>('contact');
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssigneeId, setBulkAssigneeId] = useState<string>('');
  const [quickFilters, setQuickFilters] = useState<Set<string>>(new Set());
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const companyId = useMemo(() => user?.company_id, [user]);

  // Update browser tab title with unread count
  React.useEffect(() => {
    if (unreadAssignments > 0) {
      document.title = `(${unreadAssignments}) ${t('conversations.newAssignments')}`;
    } else {
      document.title = t('conversations.pageTitle');
    }
  }, [unreadAssignments, t]);

  // Clear unread counter when viewing 'mine' tab
  React.useEffect(() => {
    if (activeTab === 'mine') {
      setUnreadAssignments(0);
    }
  }, [activeTab]);

  // Reset sidebar view to contact when session changes
  React.useEffect(() => {
    setSidebarView('contact');
  }, [selectedSessionId]);

  // Cmd+K / Ctrl+K opens global search modal
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') setIsSearchModalOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounce global search query
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(globalSearchQuery), 350);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!companyId,
  });

  // Global message search
  const { data: searchResults, isFetching: isSearchFetching } = useQuery<any[]>({
    queryKey: ['conversationSearch', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 2) return [];
      const res = await authFetch(`/api/v1/conversations/search?q=${encodeURIComponent(debouncedSearchQuery.trim())}&limit=20`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedSearchQuery.trim().length >= 2,
  });

  // Fetch session counts (always fetch for badge display)
  const { data: sessionCounts, isLoading: isLoadingCounts } = useQuery<{ mine: number; open: number; resolved: number; all: number }>({
    queryKey: ['sessionCounts', companyId, user?.id, channel],
    queryFn: async () => {
      if (!companyId) return { mine: 0, open: 0, resolved: 0, all: 0 };
      const channelParam = channel ? `?channel=${encodeURIComponent(channel)}` : '';
      const response = await authFetch(`/api/v1/conversations/sessions/counts${channelParam}`);
      if (!response.ok) throw new Error('Failed to fetch session counts');
      const counts = await response.json();

      // Also fetch all sessions to count "mine" (sessions assigned to current user)
      const mineUrl = channel
        ? `/api/v1/conversations/sessions?status_filter=open&channel=${encodeURIComponent(channel)}`
        : `/api/v1/conversations/sessions?status_filter=open`;
      const sessionsResponse = await authFetch(mineUrl);
      const allSessions = await sessionsResponse.json();
      // Count sessions assigned to current user (assignee_id is source of truth, not status)
      const mineCount = allSessions.filter(s => s.assignee_id === user?.id).length;

      return { ...counts, mine: mineCount };
    },
    enabled: !!companyId && !!user?.id,
    refetchOnWindowFocus: false, // Rely on WebSocket for real-time updates
    // Removed refetchInterval - WebSocket events will trigger updates via invalidateQueries
  });

  // Fetch sessions based on active tab (server-side filtering)
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', companyId, activeTab, user?.id, channel],
    queryFn: async () => {
      if (!companyId) return [];

      const channelParam = channel ? `&channel=${encodeURIComponent(channel)}` : '';

      // For 'mine' tab, fetch all open and filter to sessions assigned to current user
      if (activeTab === 'mine') {
        const response = await authFetch(`/api/v1/conversations/sessions?status_filter=open${channelParam}`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const allSessions = await response.json();
        // Filter to only show sessions assigned to current user (assignee_id is source of truth)
        return allSessions.filter(s => s.assignee_id === user?.id);
      }

      const statusFilter = activeTab === 'all' ? '' : activeTab; // 'open', 'resolved', or ''
      const url = statusFilter
        ? `/api/v1/conversations/sessions?status_filter=${statusFilter}${channelParam}`
        : `/api/v1/conversations/sessions${channelParam ? `?${channelParam.slice(1)}` : ''}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!companyId,
    refetchOnWindowFocus: false, // Rely on WebSocket for real-time updates
  });

  const wsUrl = companyId ? `${getWebSocketUrl()}/ws/${companyId}?token=${token}` : null;

  // Memoize WebSocket options to prevent unnecessary reconnections
  const wsOptions = useMemo(() => ({
    onMessage: (event) => {
        const eventData = JSON.parse(event.data);
        console.log('[WebSocket] Received event:', eventData.type, eventData);

        if (eventData.type === 'new_session') {
          console.log('[WebSocket] 🆕 New session created:', eventData.session);
          toast({
            title: t('conversations.notifications.newConversation'),
            description: t('conversations.notifications.newConversationDesc'),
            variant: "info",
          });
          // Invalidate queries to refetch session list and counts
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });
        } else if (eventData.type === 'new_message') {
          toast({
            title: t('conversations.notifications.newMessage'),
            description: t('conversations.notifications.newMessageDesc'),
            variant: "info",
          });
          // Invalidate queries to refetch session list and counts
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });
          // If the updated session is the one currently selected, invalidate its messages too
          if (selectedSessionId === eventData.session.conversation_id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedSessionId, companyId] });
          }
        } else if (eventData.type === 'conversation_assigned') {
          console.log('[Assignment] Received assignment notification');
          console.log('[Assignment] Assigned to ID:', eventData.assigned_to_id);
          console.log('[Assignment] Current user ID:', user?.id);
          console.log('[Assignment] Match:', eventData.assigned_to_id === user?.id);

          // Check if this assignment is for the current user
          if (eventData.assigned_to_id === user?.id) {
            console.log('[Assignment] ✅ Showing notification for current user');
            // Increment unread counter
            setUnreadAssignments(prev => prev + 1);

            // Play notification sound (optional)
            const audio = new Audio('/teams_notification.mp3');
            audio.play().catch(() => {
              // Silently fail if audio doesn't play (user interaction required)
            });

            // Show toast notification with bell icon
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🔔</span>
                  <span className="font-bold">{t('conversations.notifications.newAssignment')}</span>
                </div>
              ) as any,
              description: (
                <div className="space-y-1">
                  <p className="font-semibold">{eventData.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('conversations.notifications.assignmentInfo', {
                      channel: eventData.channel,
                      status: eventData.is_client_connected ? t('conversations.notifications.clientOnline') : t('conversations.notifications.clientOffline')
                    })}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSessionId(eventData.session_id);
                      setActiveTab('mine');
                      setUnreadAssignments(0);
                    }}
                    className="mt-2 text-xs bg-violet-500 text-white px-3 py-1 rounded hover:bg-violet-600"
                  >
                    {t('conversations.notifications.viewConversation')}
                  </button>
                </div>
              ) as any,
              duration: 10000,
            });

            // Invalidate queries to show the new assignment
            queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
            queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });

            // Switch to 'mine' tab if not already there
            if (activeTab !== 'mine') {
              setActiveTab('mine');
            }
          }
        } else if (eventData.type === 'session_reopened') {
          // Handle conversation reopening from resolved status
          console.log('[WebSocket] 🔄 Session reopened:', eventData.session_id);

          // Mark session as reopened for animation
          setReopenedSessions(prev => new Set(prev).add(eventData.session_id));
          // Remove animation after 2 seconds
          setTimeout(() => {
            setReopenedSessions(prev => {
              const newSet = new Set(prev);
              newSet.delete(eventData.session_id);
              return newSet;
            });
          }, 2000);

          // Calculate time since resolution
          const timeSinceResolution = eventData.time_since_resolution
            ? `${Math.round(eventData.time_since_resolution / 3600)} hours ago`
            : 'recently';

          // Handler for "Assign to Me" button
          const handleAssignToMe = async () => {
            try {
              const response = await authFetch(`/api/v1/conversations/${encodeURIComponent(eventData.session_id)}/assignee`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
              });
              if (response.ok) {
                toast({
                  title: t('conversations.notifications.assignedSuccess'),
                  description: t('conversations.notifications.assignedSuccessDesc'),
                  variant: "default",
                });
                queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
              }
            } catch (error) {
              console.error('Failed to assign conversation:', error);
            }
          };

          // Determine if this is assigned to current user (assignee_id is source of truth)
          const isAssignedToCurrentUser = eventData.assignee_id === user?.id;

          // Show enhanced toast notification with quick actions
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                <span className="font-bold">
                  {isAssignedToCurrentUser ? t('conversations.notifications.sessionReopenedYours') : t('conversations.notifications.sessionReopened')}
                </span>
              </div>
            ) as any,
            description: (
              <div className="space-y-2">
                <p className="font-semibold">
                  {isAssignedToCurrentUser
                    ? t('conversations.notifications.sessionReopenedDescYours')
                    : t('conversations.notifications.sessionReopenedDesc')}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t('conversations.notifications.reopenedTime', { time: timeSinceResolution })}</p>
                  <p>{t('conversations.notifications.reopenCount', { count: eventData.reopen_count || 1 })}</p>
                  {eventData.contact_name && (
                    <p>{t('conversations.notifications.contactName', { name: eventData.contact_name })}</p>
                  )}
                  {isAssignedToCurrentUser && (
                    <p className="text-violet-600 dark:text-violet-400 font-semibold">{t('conversations.notifications.assignedToYou')}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSelectedSessionId(eventData.session_id);
                      // If assigned to me, go to 'mine', otherwise 'open'
                      if (eventData.assignee_id === user?.id) {
                        setActiveTab('mine');
                      } else {
                        setActiveTab('open');
                      }
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 font-medium transition-colors"
                  >
                    {t('conversations.notifications.viewNow')}
                  </button>
                  {(!eventData.assignee_id || eventData.assignee_id !== user?.id) && (
                    <button
                      onClick={handleAssignToMe}
                      className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-indigo-600 font-medium transition-colors"
                    >
                      {t('conversations.notifications.assignToMe')}
                    </button>
                  )}
                </div>
              </div>
            ) as any,
            duration: 10000,
          });

          // Invalidate queries to refetch session list and counts
          // This ensures the conversation moves from resolved to open tab
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });
        } else if (eventData.type === 'session_status_update') {
          // Handle real-time status updates (active/inactive/resolved) and connection status
          console.log(`Session ${eventData.session_id} status changed to: ${eventData.status}, connected: ${eventData.is_client_connected}, assignee: ${eventData.assignee_id}`);

          // Invalidate counts immediately
          queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });

          // If this is the currently selected session, invalidate its details to refresh assignee
          if (selectedSessionId === eventData.session_id) {
            queryClient.invalidateQueries({ queryKey: ['sessionDetails', selectedSessionId] });
          }

          // Update the current tab's sessions list
          queryClient.setQueryData<Session[]>(['sessions', companyId, activeTab, user?.id], (oldSessions) => {
            if (!oldSessions) return oldSessions;

            const sessionExists = oldSessions.some(s => s.session_id === eventData.session_id);

            if (sessionExists) {
              // Check if the session still belongs in the current tab after status change
              const isResolvedStatus = ['resolved', 'archived'].includes(eventData.status);
              // assignee_id is source of truth for assignment
              const isAssignedToMe = eventData.assignee_id === user?.id;

              const shouldStayInTab =
                (activeTab === 'mine' && isAssignedToMe) ||
                (activeTab === 'open' && !isResolvedStatus) ||
                (activeTab === 'resolved' && isResolvedStatus) ||
                activeTab === 'all';

              if (shouldStayInTab) {
                // Update the status, connection state, and assignee
                return oldSessions.map(session =>
                  session.session_id === eventData.session_id
                    ? {
                        ...session,
                        status: eventData.status,
                        assignee_id: eventData.assignee_id ?? session.assignee_id,
                        is_client_connected: eventData.is_client_connected ?? session.is_client_connected
                      }
                    : session
                );
              } else {
                // Remove from current tab (moved to different category)
                return oldSessions.filter(s => s.session_id !== eventData.session_id);
              }
            }

            return oldSessions;
          });

          // Also invalidate all tab queries to ensure consistency
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
        } else if (eventData.type === 'contact_updated') {
          // Handle real-time contact updates when AI collects contact information
          console.log('[WebSocket] 📇 Contact updated:', eventData);

          // Invalidate contact query to refresh ContactProfile component
          if (selectedSessionId === eventData.session_id) {
            queryClient.invalidateQueries({ queryKey: ['contact', selectedSessionId] });
            queryClient.invalidateQueries({ queryKey: ['sessionDetails', selectedSessionId] });
          }

          // Also refresh sessions list to show updated contact name
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
        }
      },
      enabled: !!wsUrl,
    }), [companyId, queryClient, selectedSessionId, user?.id, activeTab, wsUrl]);

  // Connect to the company-wide WebSocket for real-time updates
  useWebSocket(wsUrl, wsOptions);

  const getAssigneeEmail = (assigneeId?: number) => {
    if (!assigneeId || !users || !Array.isArray(users)) return 'N/A';
    const u = users.find(u => u.id === assigneeId);
    return u ? u.email : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'assigned': return 'default';
      case 'resolved': return 'outline';
      case 'active': return 'secondary';
      case 'inactive': return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 dark:bg-green-950 border-l-green-500';
      case 'inactive': return 'bg-gray-50 dark:bg-gray-900 border-l-gray-400';
      case 'resolved': return 'bg-blue-50 dark:bg-blue-950 border-l-blue-500 opacity-70';
      case 'assigned': return 'bg-blue-50 dark:bg-indigo-950 border-l-blue-500';
      case 'pending': return 'bg-red-50 dark:bg-red-950 border-l-red-500';
      default: return 'bg-white dark:bg-slate-800 border-l-gray-300';
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'whatsapp': return (
        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      );
      case 'messenger': return (
        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
        </svg>
      );
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'gmail': return <Mail className="h-4 w-4 text-red-500" />;
      case 'telegram': return (
        <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      );
      case 'twilio_voice': return (
        <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zM9.75 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      );
      case 'freeswitch': return (
        <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
        </svg>
      );
      case 'api': return (
        <svg className="h-4 w-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l4.62 4.62 2.5 2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-4.62-4.62-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l4.62-4.62-2.5-2.5L12 18z"/>
        </svg>
      );
      case 'web':
      default:
        return <Globe className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 4: return <AlertTriangle className="h-3 w-3" />;
      case 3: return <ArrowUp className="h-3 w-3" />;
      case 2: return <Minus className="h-3 w-3" />;
      case 1: return <ArrowDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const PriorityBadge = ({ priority }: { priority: number }) => {
    if (priority === 0) return null;
    const config = PRIORITY_CONFIG[priority];
    return (
      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgColor} ${config.color}`}>
        {getPriorityIcon(priority)}
        <span>{t(`conversations.priority.${config.label.toLowerCase()}`)}</span>
      </span>
    );
  };

  const getPriorityBorderColor = (priority?: number) => {
    if (!priority || priority === 0) return '';
    return PRIORITY_CONFIG[priority]?.borderColor || '';
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggleQuickFilter = (f: string) => {
    setQuickFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  // Filter sessions by search query and sort by priority (tab filtering is done server-side)
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    let result = sessions;

    // Filter by search query (client-side for instant feedback)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(session =>
        session.contact_name?.toLowerCase().includes(query) ||
        session.contact_phone?.toLowerCase().includes(query) ||
        session.first_message_content?.toLowerCase().includes(query)
      );
    }

    // Apply quick filters
    if (quickFilters.has('unassigned')) result = result.filter(s => !s.assignee_id);
    if (quickFilters.has('high_priority')) result = result.filter(s => (s.priority || 0) >= 3);
    if (quickFilters.has('connected')) result = result.filter(s => s.is_client_connected);
    if (quickFilters.has('my_team')) result = result.filter(s => s.assignee_id === user?.id);

    // Sort by priority (high to low), then by timestamp (recent first)
    return [...result].sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.last_message_timestamp).getTime() - new Date(a.last_message_timestamp).getTime();
    });
  }, [sessions, searchQuery, quickFilters, user?.id]);

  // Check if conversation is assigned to current user
  // Note: assignee_id indicates assignment regardless of status field
  // (status can be 'active', 'assigned', etc. but assignee_id is the source of truth)
  const isAssignedToMe = (session: Session) => {
    return session.assignee_id === user?.id;
  };

  // Check if channel supports real-time connection status
  // Only websocket/web channels can show online/offline - external platforms cannot
  const isWebChannel = (channel?: string) => {
    return !channel || channel === 'web' || channel === 'websocket' || channel === 'web_chat';
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredSessions.map(s => s.conversation_id)));
  const clearSelection = () => setSelectedIds(new Set());

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, assigneeId }: { action: string; assigneeId?: number }) => {
      const res = await authFetch('/api/v1/conversations/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_ids: Array.from(selectedIds), action, assignee_id: assigneeId }),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Updated ${data.updated} conversation${data.updated !== 1 ? 's' : ''}` });
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });
    },
  });

  // ─── Conversation Card ────────────────────────────────────────────────────────
  const ConversationCard = ({ session, index }: { session: Session; index: number }) => {
    const isChecked = selectedIds.has(session.conversation_id);
    const assignedToMe = isAssignedToMe(session);
    const isRecentlyReopened = reopenedSessions.has(session.conversation_id);
    const hasBeenReopened = (session.reopen_count ?? 0) > 0;
    const hasPriority = (session.priority || 0) > 0;
    const isSelected = selectedSessionId === session.conversation_id;
    const hasUnread = (session.unread_count ?? 0) > 0 && !isSelected && session.last_message_sender === 'user';

    const contactName = session.contact_name || session.contact_phone || t('conversations.card.unknownContact');
    const avatarLetter = contactName.charAt(0).toUpperCase();
    const avatarColorClass = getAvatarColor(contactName);

    const channelKey = session.channel ?? 'web';
    const channelBadge = CHANNEL_BADGE_MAP[channelKey] ?? CHANNEL_BADGE_MAP['web'];

    const previewText = session.last_message_content || session.first_message_content || ' ';

    const cardClass = [
      'conv-card',
      isSelected && 'conv-card-active',
      !isSelected && hasUnread && 'bg-muted/60',
      !isSelected && !hasUnread && assignedToMe && 'conv-card-assigned',
      isRecentlyReopened && 'ring-1 ring-inset ring-orange-300 dark:ring-orange-700',
    ].filter(Boolean).join(' ');

    const statusClass = assignedToMe
      ? 'conv-status-badge conv-status-mine'
      : session.status === 'active'   ? 'conv-status-badge conv-status-active'
      : session.status === 'inactive' ? 'conv-status-badge conv-status-inactive'
      : session.status === 'pending'  ? 'conv-status-badge conv-status-pending'
      : session.status === 'resolved' ? 'conv-status-badge conv-status-resolved'
      : 'conv-status-badge conv-status-inactive';

    return (
      <button
        type="button"
        onClick={() => setSelectedSessionId(session.conversation_id)}
        className={cardClass}
      >
        {/* Checkbox */}
        <div
          onClick={(e) => toggleSelect(session.conversation_id, e)}
          className={`conv-checkbox ${isChecked ? 'conv-checkbox-checked' : ''}`}
        >
          {isChecked && (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Avatar */}
        <div className="conv-avatar">
          <div className={`conv-avatar-ring ${avatarColorClass}`}>
            {avatarLetter}
          </div>
          <AnimatePresence>
            {isWebChannel(session.channel) && session.is_client_connected && (
              <motion.span
                key="online"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="conv-status-dot conv-status-online"
              />
            )}
            {isWebChannel(session.channel) && !session.is_client_connected && assignedToMe && (
              <motion.span
                key="offline"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="conv-status-dot conv-status-offline"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="conv-card-content">
          {/* Row 1: name + time + unread badge */}
          <div className="conv-card-row1">
            <span className={`conv-card-name ${hasUnread ? 'font-semibold text-foreground' : ''}`}>{contactName}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {session.last_message_timestamp && (
                <span className={`conv-card-time ${hasUnread ? 'font-medium text-foreground/80' : ''}`}>
                  {parseUTCDate(session.last_message_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {hasUnread && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                  {(session.unread_count ?? 0) > 99 ? '99+' : session.unread_count}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: message preview */}
          <p className={`conv-card-preview ${hasUnread ? 'text-foreground/80' : ''}`}>
            {previewText}
          </p>

          {/* Row 3: badges */}
          <div className="conv-card-row3">
            <span className={`conv-channel-badge ${channelBadge.cls}`}>
              {channelBadge.label}
            </span>
            <span className={statusClass}>
              {assignedToMe ? t('conversations.status.mine') : session.status}
            </span>
            {hasPriority && <PriorityBadge priority={session.priority || 0} />}
            {hasBeenReopened && (
              <span className="conv-reopen-badge">{session.reopen_count}×</span>
            )}
          </div>

          {/* Reopened label */}
          {hasBeenReopened && session.last_reopened_at && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="conv-reopened-label"
            >
              <span className="conv-reopened-dot" />
              Reopened {formatDistanceToNow(parseUTCDate(session.last_reopened_at), { addSuffix: true })}
            </motion.p>
          )}
        </div>
      </button>
    );
  };

  // ─── Group separator header ───────────────────────────────────────────────────
  const GroupHeader = ({ label, count, dotColor }: { label: string; count: number; dotColor: string }) => (
    <div className="conv-group-header">
      <span className={`conv-group-dot ${dotColor}`} />
      <span className="conv-group-label">{label}</span>
      <div className="conv-group-line" />
      <span className="conv-group-count">{count}</span>
    </div>
  );

  // ─── Tab config ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'open',     label: t('conversations.tabs.open'),     count: sessionCounts?.open     ?? 0, countClass: 'text-blue-600 dark:text-blue-400' },
    { id: 'mine',     label: t('conversations.tabs.mine'),     count: sessionCounts?.mine     ?? 0, countClass: 'text-violet-600 dark:text-violet-400' },
    { id: 'resolved', label: t('conversations.tabs.resolved'), count: sessionCounts?.resolved ?? 0, countClass: 'text-green-600 dark:text-green-400' },
    { id: 'all',      label: t('conversations.tabs.all'),      count: sessionCounts?.all      ?? 0, countClass: 'text-muted-foreground' },
  ] as const;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex bg-background overflow-hidden">

      {/* ── LEFT PANEL ───────────────────────────────────────────────────────── */}
      <div className={`${selectedSessionId ? 'hidden md:flex' : 'flex'} md:flex-shrink-0 flex-col bg-card transition-all duration-300 relative overflow-hidden ${isSidebarCollapsed ? 'w-14' : 'w-80 md:w-64 lg:w-80'}`}>
        {/* Aurora gradient right border */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-px z-10 bg-gradient-to-b from-violet-500/20 via-border to-cyan-500/10" />
        {/* Subtle bloom */}
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-600/[0.04] dark:bg-violet-500/[0.06] blur-[70px]" />

        <AnimatePresence mode="wait">
          {!isSidebarCollapsed ? (
            <motion.div
              key="expanded-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0 border-b border-border"
            >
              {/* Row 1: icon + title + count + search btn + collapse btn */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                {(() => {
                  const cfg = channel ? CHANNEL_CONFIG[channel] : null;
                  const IconComponent = cfg?.Icon ?? (({ className }: { className?: string }) => <Inbox className={className} />);
                  const iconClass = cfg?.iconClass ?? 'text-blue-600 dark:text-blue-400';
                  return (
                    <div className="h-[26px] w-[26px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <IconComponent className={`w-3.5 h-3.5 ${iconClass}`} />
                    </div>
                  );
                })()}
                <span className="font-display text-[15px] font-bold text-foreground truncate flex-1 tracking-tight">
                  {channel ? t(CHANNEL_CONFIG[channel]?.titleKey ?? 'conversations.inbox') : t('conversations.inbox')}
                </span>
                <motion.span
                  key={sessionCounts?.all}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {sessionCounts?.all ?? 0}
                </motion.span>
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Search (Ctrl+K)"
                >
                  <Search className="w-3 h-3" />
                  <kbd className="text-[9px] font-mono opacity-60">⌘K</kbd>
                </button>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={t('conversations.collapseSidebar')}
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Search input */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    type="text"
                    placeholder={t('conversations.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`h-8 text-xs rounded-xl bg-background border-border ${isRTL ? 'pr-9' : 'pl-9'} focus-visible:ring-1`}
                  />
                </div>
              </div>

              {/* Row 3: Quick filter chips */}
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {[
                  { id: 'unassigned',    label: 'Unassigned' },
                  { id: 'high_priority', label: '🔥 Priority' },
                  { id: 'connected',     label: '🟢 Online' },
                  { id: 'my_team',       label: '⭐ Mine' },
                ].map(f => {
                  const active = quickFilters.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleQuickFilter(f.id)}
                      className={`conv-chip ${active ? 'conv-chip-active' : ''}`}
                    >
                      {f.label}
                    </button>
                  );
                })}
                {quickFilters.size > 0 && (
                  <button
                    onClick={() => setQuickFilters(new Set())}
                    className="conv-chip"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Row 4: Tab bar */}
              <div className="px-3 pb-3">
                <div className="conv-tabs">
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); clearSelection(); }}
                        className={`conv-tab ${isActive ? 'conv-tab-active' : ''}`}
                      >
                        <span>{tab.label}</span>
                        <motion.span
                          key={tab.count}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                          className={`conv-tab-count ${isActive ? tab.countClass : 'text-muted-foreground/60'}`}
                        >
                          {tab.count}
                        </motion.span>
                        {tab.id === 'mine' && unreadAssignments > 0 && (
                          <AnimatePresence>
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                            >
                              {unreadAssignments}
                            </motion.span>
                          </AnimatePresence>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 flex flex-col items-center gap-3 py-3 border-b border-border"
            >
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={t('conversations.expandSidebar')}
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-muted-foreground/70 tabular-nums">
                {sessionCounts?.all ?? 0}
              </span>
              {unreadAssignments > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
                >
                  {unreadAssignments}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && !isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-primary/[0.06] border-b border-primary/20 px-3 py-2 flex items-center gap-2 flex-wrap flex-shrink-0"
            >
              <span className="text-xs font-bold text-foreground min-w-max">{selectedIds.size} selected</span>
              <button onClick={selectAll} className="text-[11px] text-primary underline underline-offset-2">
                All {filteredSessions.length}
              </button>
              <button onClick={clearSelection} className="text-[11px] text-muted-foreground underline underline-offset-2">
                Clear
              </button>
              <div className="flex-1" />
              <button
                onClick={() => bulkActionMutation.mutate({ action: 'resolve' })}
                disabled={bulkActionMutation.isLoading}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40"
              >
                <CheckCircle2 className="w-3 h-3" /> Resolve
              </button>
              <div className="flex items-center gap-1">
                <select
                  value={bulkAssigneeId}
                  onChange={e => setBulkAssigneeId(e.target.value)}
                  className="text-xs rounded-lg border border-border bg-background text-foreground px-2 py-1 h-7 focus:outline-none"
                >
                  <option value="">Assign to…</option>
                  {Array.isArray(users) && users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
                <button
                  onClick={() => { if (bulkAssigneeId) bulkActionMutation.mutate({ action: 'assign', assigneeId: Number(bulkAssigneeId) }); }}
                  disabled={!bulkAssigneeId || bulkActionMutation.isLoading}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/[0.10] text-primary hover:bg-primary/[0.15] disabled:opacity-40 transition-colors"
                >
                  Go
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        <div className="conv-list">
          {isLoadingSessions ? (
            <div className="divide-y divide-border/50">
              {[...Array(6)].map((_, i) => <ConversationSkeleton key={i} />)}
            </div>
          ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
            <div>
              {(() => {
                const activeUnassigned  = filteredSessions.filter(s => s.status === 'active'   && !s.assignee_id);
                const inactiveUnassigned= filteredSessions.filter(s => s.status === 'inactive' && !s.assignee_id);
                const assigned          = filteredSessions.filter(s => s.status === 'assigned' || s.assignee_id != null);
                const pending           = filteredSessions.filter(s => s.status === 'pending');
                const resolved          = filteredSessions.filter(s => s.status === 'resolved');
                const archived          = filteredSessions.filter(s => s.status === 'archived');

                return (
                  <>
                    {activeUnassigned.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.active')} count={activeUnassigned.length} dotColor="bg-green-500" />
                        {activeUnassigned.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                    {inactiveUnassigned.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.inactive')} count={inactiveUnassigned.length} dotColor="bg-slate-400" />
                        {inactiveUnassigned.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                    {assigned.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.assigned')} count={assigned.length} dotColor="bg-violet-500" />
                        {assigned.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                    {pending.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.pending')} count={pending.length} dotColor="bg-red-500" />
                        {pending.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                    {resolved.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.resolved')} count={resolved.length} dotColor="bg-blue-400" />
                        {resolved.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                    {archived.length > 0 && (
                      <>
                        <GroupHeader label={t('conversations.statusGroups.archived')} count={archived.length} dotColor="bg-slate-300" />
                        {archived.map((s, i) => <ConversationCard key={s.conversation_id} session={s} index={i} />)}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          ) : isSidebarCollapsed && filteredSessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-1 p-1.5"
            >
              {filteredSessions.slice(0, 10).map((session, idx) => {
                const assignedToMe = session.assignee_id === user?.id;
                const contactName = session.contact_name || session.contact_phone || '?';
                const avatarColor = getAvatarColor(contactName);
                return (
                  <motion.button
                    key={session.conversation_id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSessionId(session.conversation_id)}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${avatarColor} ${
                      selectedSessionId === session.conversation_id
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-card'
                        : 'hover:ring-2 hover:ring-border hover:ring-offset-1 hover:ring-offset-card'
                    }`}
                    title={contactName}
                  >
                    {contactName.charAt(0).toUpperCase()}
                    {assignedToMe && session.is_client_connected && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
                    )}
                    {assignedToMe && !session.is_client_connected && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-card" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="conv-empty"
            >
              <div className="conv-empty-orb">
                <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <div>
                <p className="conv-empty-title">
                  {searchQuery ? t('conversations.emptyState.noMatches') : 'No conversations'}
                </p>
                <p className="conv-empty-desc">
                  {searchQuery ? 'Try adjusting your search' : `No ${activeTab} conversations`}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          {selectedSessionId ? (
            <motion.div
              key={selectedSessionId}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              <button
                className="md:hidden flex items-center gap-1 text-sm text-muted-foreground px-3 pt-2 pb-1 flex-shrink-0"
                onClick={() => setSelectedSessionId(null)}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex-1 overflow-hidden min-h-0">
                <ConversationDetail
                  sessionId={selectedSessionId}
                  agentId={1}
                  onSummaryClick={() => setSidebarView(sidebarView === 'summary' ? 'contact' : 'summary')}
                  onContactClick={() => setMobileContactOpen(true)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center bg-background"
            >
              <div className="flex flex-col items-center gap-5 select-none">
                {/* Stacked bubble illustration */}
                <div className="relative w-20 h-20">
                  <div className="absolute bottom-0 left-0 w-14 h-12 bg-muted rounded-2xl rounded-bl-none rotate-[-8deg] opacity-40" />
                  <div className="absolute bottom-2 left-4 w-14 h-12 bg-muted rounded-2xl rounded-bl-none rotate-[-3deg] opacity-60" />
                  <div className="absolute bottom-4 left-7 w-14 h-12 bg-muted rounded-2xl rounded-bl-none" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {t('conversations.emptyState.noSelection')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {t('conversations.emptyState.noSelectionDesc')}
                  </p>
                </div>
                {/* Channel context row */}
                <div className="flex items-center gap-2.5 mt-1">
                  {['whatsapp', 'instagram', 'messenger', 'telegram', 'web_chat'].map((ch) => {
                    const cfg = CHANNEL_CONFIG[ch];
                    if (!cfg) return null;
                    const IconC = cfg.Icon;
                    return (
                      <div
                        key={ch}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${channelAvatarBg(ch)}`}
                        title={ch}
                      >
                        <IconC className="w-4 h-4" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────────── */}
      <div className={`hidden md:flex flex-shrink-0 relative flex-col border-l border-border bg-card transition-all duration-300 ${isRightSidebarCollapsed ? 'w-10' : 'md:w-52 lg:w-72'}`}>
        {/* Collapse toggle — only shown when collapsed */}
        {isRightSidebarCollapsed && (
          <button
            onClick={() => setIsRightSidebarCollapsed(false)}
            className="absolute top-2 left-1.5 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t('conversations.expandSidebar')}
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {selectedSessionId ? (
            isRightSidebarCollapsed ? (
              <motion.div
                key="right-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center pt-4 gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  {sidebarView === 'summary'
                    ? <Sparkles className="h-4 w-4 text-muted-foreground" />
                    : <UserIcon className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <span
                  className="text-[10px] font-medium text-muted-foreground"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {sidebarView === 'summary' ? 'Summary' : 'Contact'}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="right-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                {sidebarView === 'summary' ? (
                  <ConversationSummary
                    sessionId={selectedSessionId}
                    onBack={() => setSidebarView('contact')}
                  />
                ) : (
                  <ContactProfile sessionId={selectedSessionId} onToggle={() => setIsRightSidebarCollapsed(true)} />
                )}
              </motion.div>
            )
          ) : (
            isRightSidebarCollapsed ? (
              <motion.div
                key="right-collapsed-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center pt-4"
              >
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="right-expanded-empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <UserIcon className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {t('conversations.emptyState.contactDetails')}
                </p>
                <p className="text-xs text-muted-foreground max-w-[160px]">
                  {t('conversations.emptyState.contactDetailsDesc')}
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* ── GLOBAL SEARCH MODAL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSearchModalOpen(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.18, type: 'spring', stiffness: 420, damping: 32 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
            >
              <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Input row */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  {isSearchFetching
                    ? <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
                    : <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                  <input
                    autoFocus
                    type="text"
                    value={globalSearchQuery}
                    onChange={e => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search all conversations…"
                    className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={() => setGlobalSearchQuery('')}
                      className="text-muted-foreground hover:text-foreground text-xs px-1 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono border border-border">
                    Esc
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[420px] overflow-y-auto">
                  {debouncedSearchQuery.trim().length < 2 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search
                    </div>
                  ) : isSearchFetching ? (
                    <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                    </div>
                  ) : !searchResults || searchResults.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No messages found for "<span className="font-semibold text-foreground">{debouncedSearchQuery}</span>"
                    </div>
                  ) : (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-[11px] text-muted-foreground font-medium">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </div>
                      {searchResults.map((result) => {
                        const snippet = result.snippet as string;
                        const q = result.query as string;
                        const parts = snippet.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

                        return (
                          <button
                            key={result.message_id}
                            onClick={() => {
                              setSelectedSessionId(result.session_id);
                              setIsSearchModalOpen(false);
                              setGlobalSearchQuery('');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border last:border-0 group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Channel icon */}
                              <div className="flex-shrink-0 mt-0.5">
                                {getChannelIcon(result.channel)}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Contact + channel + status row */}
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <span className="text-[13px] font-semibold text-foreground truncate">
                                    {result.contact_name}
                                  </span>
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                    {result.channel?.replace('_', ' ')}
                                  </span>
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                    result.status === 'resolved'
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                      : result.status === 'active'
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {result.status}
                                  </span>
                                </div>
                                {/* Highlighted snippet */}
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  {parts.map((part, i) =>
                                    part.toLowerCase() === q.toLowerCase()
                                      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 rounded px-0.5 not-italic font-medium">{part}</mark>
                                      : part
                                  )}
                                </p>
                                {/* Timestamp */}
                                {result.timestamp && (
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    {formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                              {/* Arrow */}
                              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer shortcuts */}
                <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd>
                    Open conversation
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE CONTACT SHEET ─────────────────────────────────────────────── */}
      <Sheet open={mobileContactOpen} onOpenChange={setMobileContactOpen}>
        <SheetContent side="right" className="w-full sm:w-[360px] p-0 flex flex-col md:hidden">
          <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <SheetTitle className="text-sm font-semibold">Contact Details</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedSessionId && (
              sidebarView === 'summary'
                ? <ConversationSummary sessionId={selectedSessionId} onBack={() => setSidebarView('contact')} />
                : <ContactProfile sessionId={selectedSessionId} onToggle={() => setMobileContactOpen(false)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ConversationsPage;
