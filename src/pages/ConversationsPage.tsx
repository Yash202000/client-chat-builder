import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { ConversationSummary } from '@/components/ConversationSummary';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Session, User, PRIORITY_CONFIG } from '@/types';
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Phone, Globe, Instagram, Mail, Send, Search, Filter, Archive, PanelLeftClose, PanelRightOpen, AlertTriangle, ArrowUp, Minus, ArrowDown, Inbox, Users, CheckCircle2, LayoutGrid, Sparkles, Clock, User as UserIcon } from 'lucide-react';
import { getWebSocketUrl } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  tap: {
    scale: 0.98
  }
};

const sidebarVariants = {
  expanded: {
    width: "100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  collapsed: {
    width: "100%",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// Skeleton Component for loading states
const ConversationSkeleton = () => (
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

const ConversationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { user, token, authFetch, isLoading: isAuthLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'open' | 'resolved' | 'all'>('open');
  const [unreadAssignments, setUnreadAssignments] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [reopenedSessions, setReopenedSessions] = useState<Set<string>>(new Set());
  const [sidebarView, setSidebarView] = useState<'contact' | 'summary'>('contact');

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

  // Fetch session counts (always fetch for badge display)
  const { data: sessionCounts, isLoading: isLoadingCounts } = useQuery<{ mine: number; open: number; resolved: number; all: number }>({
    queryKey: ['sessionCounts', companyId, user?.id],
    queryFn: async () => {
      if (!companyId) return { mine: 0, open: 0, resolved: 0, all: 0 };
      const response = await authFetch(`/api/v1/conversations/sessions/counts`);
      if (!response.ok) throw new Error('Failed to fetch session counts');
      const counts = await response.json();

      // Also fetch all sessions to count "mine" (sessions assigned to current user)
      const sessionsResponse = await authFetch(`/api/v1/conversations/sessions?status_filter=open`);
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
    queryKey: ['sessions', companyId, activeTab, user?.id],
    queryFn: async () => {
      if (!companyId) return [];

      // For 'mine' tab, fetch all open and filter to sessions assigned to current user
      if (activeTab === 'mine') {
        const response = await authFetch(`/api/v1/conversations/sessions?status_filter=open`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const allSessions = await response.json();
        // Filter to only show sessions assigned to current user (assignee_id is source of truth)
        return allSessions.filter(s => s.assignee_id === user?.id);
      }

      const statusFilter = activeTab === 'all' ? '' : activeTab; // 'open', 'resolved', or ''
      const url = statusFilter
        ? `/api/v1/conversations/sessions?status_filter=${statusFilter}`
        : `/api/v1/conversations/sessions`;
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
            const audio = new Audio('/notification.mp3');
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
                    className="mt-2 text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
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
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">{t('conversations.notifications.assignedToYou')}</p>
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
                      className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600 font-medium transition-colors"
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
    const user = users.find(u => u.id === assigneeId);
    return user ? user.email : 'Unknown';
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
      case 'assigned': return 'bg-purple-50 dark:bg-purple-950 border-l-purple-500';
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
        <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
        </svg>
      );
      case 'api': return (
        <svg className="h-4 w-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 12l-2 2-2-2 2-2 2 2zm-2-6l2.12 2.12 2.5-2.5L12 1 7.38 5.62l2.5 2.5L12 6zm-6 6l2.12-2.12-2.5-2.5L1 12l4.62 4.62 2.5-2.5L6 12zm12 0l-2.12 2.12 2.5 2.5L23 12l-4.62-4.62-2.5 2.5L18 12zm-6 6l-2.12-2.12-2.5 2.5L12 23l4.62-4.62-2.5-2.5L12 18z"/>
        </svg>
      );
      case 'web':
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse-ring mx-auto mb-6 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">{t('conversations.loading') || 'Loading conversations...'}</p>
        </motion.div>
      </div>
    );
  }

  // Filter sessions by search query and sort by priority (tab filtering is done server-side)
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    let result = sessions;

    // Filter by search query (client-side for instant feedback)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = sessions.filter(session =>
        session.contact_name?.toLowerCase().includes(query) ||
        session.contact_phone?.toLowerCase().includes(query) ||
        session.first_message_content?.toLowerCase().includes(query)
      );
    }

    // Sort by priority (high to low), then by timestamp (recent first)
    return [...result].sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.last_message_timestamp).getTime() - new Date(a.last_message_timestamp).getTime();
    });
  }, [sessions, searchQuery]);

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

  // Enhanced Conversation Card Component with animations
  const ConversationCard = ({ session, index }: { session: Session; index: number }) => {
    const assignedToMe = isAssignedToMe(session);
    const isDisconnected = assignedToMe && !session.is_client_connected;
    const isRecentlyReopened = reopenedSessions.has(session.conversation_id);
    const hasBeenReopened = (session.reopen_count ?? 0) > 0;
    const hasPriority = (session.priority || 0) > 0;
    const isSelected = selectedSessionId === session.conversation_id;

    const getCardClasses = () => {
      const base = "conversation-card w-full p-4 text-left rounded-xl border transition-all duration-300";

      if (isSelected) {
        return `${base} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800 shadow-lg ring-2 ring-blue-500/20`;
      }

      if (assignedToMe) {
        return `${base} conversation-card-assigned border-amber-200 dark:border-amber-800/50 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700`;
      }

      return `${base} bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600`;
    };

    const getPriorityClass = () => {
      if (!hasPriority) return '';
      const priority = session.priority || 0;
      switch (priority) {
        case 4: return 'priority-critical';
        case 3: return 'priority-high';
        case 2: return 'priority-medium';
        case 1: return 'priority-low';
        default: return '';
      }
    };

    return (
      <motion.button
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        onClick={() => setSelectedSessionId(session.conversation_id)}
        className={`${getCardClasses()} ${hasPriority ? `border-l-4 ${getPriorityClass()}` : ''} ${isRecentlyReopened ? 'conversation-reopened' : ''}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Channel Icon with Status */}
          <div className="channel-icon-container flex-shrink-0 relative">
            {getChannelIcon(session.channel)}

            {/* Status indicator */}
            <AnimatePresence>
              {assignedToMe && isWebChannel(session.channel) && session.is_client_connected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-3 w-3 bg-green-500 rounded-full status-dot status-dot-online border-2 border-white dark:border-slate-800`}
                  title="Client connected"
                />
              )}
              {assignedToMe && isWebChannel(session.channel) && !session.is_client_connected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-3 w-3 bg-red-500 rounded-full status-dot status-dot-offline border-2 border-white dark:border-slate-800`}
                  title="Client disconnected"
                />
              )}
              {!assignedToMe && session.status === 'active' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-3 w-3 bg-green-500 rounded-full status-dot status-dot-online border-2 border-white dark:border-slate-800`}
                />
              )}
              {!assignedToMe && session.status === 'inactive' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} h-3 w-3 bg-gray-400 rounded-full border-2 border-white dark:border-slate-800`}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {assignedToMe && (
                  <motion.span
                    initial={{ rotate: -30, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </motion.span>
                )}
                <h4 className={`font-semibold text-sm truncate ${
                  session.status === 'resolved'
                    ? 'text-slate-500 dark:text-slate-400'
                    : assignedToMe
                    ? 'text-amber-900 dark:text-amber-100'
                    : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {session.contact_name || session.contact_phone || t('conversations.card.unknownContact')}
                </h4>
              </div>

              <div className="flex items-center gap-1.5">
                {hasPriority && <PriorityBadge priority={session.priority || 0} />}
                {hasBeenReopened && (
                  <Badge className="text-[10px] px-1.5 py-0.5 reopened-badge border-0 font-medium">
                    {session.reopen_count}x
                  </Badge>
                )}
              </div>
            </div>

            {/* Status Badges Row */}
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium transition-colors ${
                  session.status === 'active'
                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                    : session.status === 'inactive'
                    ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    : session.status === 'resolved'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                    : assignedToMe
                    ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                    : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                }`}
              >
                {assignedToMe ? t('conversations.status.mine') : session.status}
              </Badge>

              {/* Connection/Time indicator */}
              {assignedToMe && isWebChannel(session.channel) && (
                <span className={`flex items-center gap-1 text-[10px] font-medium ${
                  session.is_client_connected
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${session.is_client_connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {session.is_client_connected ? 'Online' : 'Offline'}
                </span>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {session.last_message_timestamp
                  ? formatDistanceToNow(new Date(session.last_message_timestamp), { addSuffix: true })
                  : 'No messages'
                }
              </span>

              {session.assignee_id && !assignedToMe && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <UserIcon className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{getAssigneeEmail(session.assignee_id)}</span>
                </span>
              )}
            </div>

            {/* Additional status messages */}
            {hasBeenReopened && session.last_reopened_at && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Reopened {formatDistanceToNow(new Date(session.last_reopened_at), { addSuffix: true })}
              </motion.p>
            )}
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">
        {/* Left Sidebar - Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'}`}
        >
          <Card className="h-full flex flex-col card-shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            {/* Decorative gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            {/* Collapse/Expand Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute ${isRTL ? '-left-3' : '-right-3'} top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300`}
              title={isSidebarCollapsed ? t('conversations.expandSidebar') : t('conversations.collapseSidebar')}
            >
              <motion.div
                animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isRTL ? (
                  <PanelRightOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </motion.div>
            </motion.button>

            <CardHeader className={`border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 flex-shrink-0 py-4 ${isSidebarCollapsed ? 'px-2' : 'space-y-4'}`}>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Header with count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                          <Inbox className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold dark:text-white">{t('conversations.inbox')}</CardTitle>
                          <p className="text-xs text-muted-foreground">Active conversations</p>
                        </div>
                      </div>
                      <motion.div
                        key={sessionCounts?.all}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <Badge variant="secondary" className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1 rounded-full">
                          {sessionCounts?.all || 0}
                        </Badge>
                      </motion.div>
                    </div>

                    {/* Enhanced Search Bar */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors ${isRTL ? 'right-4' : 'left-4'}`} />
                        <Input
                          type="text"
                          placeholder={t('conversations.search')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl h-11 input-modern ${isRTL ? 'pr-11' : 'pl-11'} transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        />
                      </div>
                    </div>

                    {/* Enhanced Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mine' | 'open' | 'resolved' | 'all')} className="w-full">
                      <TabsList className="w-full grid grid-cols-4 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl gap-1">
                        <TabsTrigger
                          value="open"
                          className="tab-modern text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
                        >
                          <span className="flex flex-col items-center gap-0.5">
                            <Inbox className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px]">{t('conversations.tabs.open')}</span>
                            <motion.span
                              key={sessionCounts?.open}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400"
                            >
                              {sessionCounts?.open || 0}
                            </motion.span>
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="mine"
                          className="tab-modern text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5 relative"
                        >
                          <span className="flex flex-col items-center gap-0.5">
                            <Sparkles className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px]">{t('conversations.tabs.mine')}</span>
                            <motion.span
                              key={sessionCounts?.mine}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-amber-600 dark:text-amber-400"
                            >
                              {sessionCounts?.mine || 0}
                            </motion.span>
                          </span>
                          <AnimatePresence>
                            {unreadAssignments > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
                              >
                                {unreadAssignments}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </TabsTrigger>
                        <TabsTrigger
                          value="resolved"
                          className="tab-modern text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
                        >
                          <span className="flex flex-col items-center gap-0.5">
                            <CheckCircle2 className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px]">{t('conversations.tabs.resolved')}</span>
                            <motion.span
                              key={sessionCounts?.resolved}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-green-600 dark:text-green-400"
                            >
                              {sessionCounts?.resolved || 0}
                            </motion.span>
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="all"
                          className="tab-modern text-xs font-medium rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-md transition-all duration-300 py-2.5"
                        >
                          <span className="flex flex-col items-center gap-0.5">
                            <LayoutGrid className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px]">{t('conversations.tabs.all')}</span>
                            <motion.span
                              key={sessionCounts?.all}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-purple-600 dark:text-purple-400"
                            >
                              {sessionCounts?.all || 0}
                            </motion.span>
                          </span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed view */}
              <AnimatePresence mode="wait">
                {isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3 items-center py-2"
                  >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                      <Inbox className="w-4 h-4 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs font-bold">
                      {sessionCounts?.all || 0}
                    </Badge>
                    {unreadAssignments > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center"
                      >
                        {unreadAssignments}
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardHeader>
            <CardContent className={`flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800 ${isSidebarCollapsed ? 'p-0' : 'p-3'}`}>
              {isLoadingSessions ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {[...Array(5)].map((_, i) => (
                    <ConversationSkeleton key={i} />
                  ))}
                </motion.div>
              ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {/* Status Group Header Component */}
                  {(() => {
                    const StatusGroupHeader = ({ label, count, colorClass, icon: Icon }: { label: string; count: number; colorClass: string; icon: any }) => (
                      <motion.div
                        variants={itemVariants}
                        className={`group-header px-4 py-2.5 rounded-lg mx-1 mb-2 flex items-center justify-between ${colorClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold rounded-full">
                          {count}
                        </Badge>
                      </motion.div>
                    );

                    const activeUnassigned = filteredSessions.filter(s => s.status === 'active' && !s.assignee_id);
                    const inactiveUnassigned = filteredSessions.filter(s => s.status === 'inactive' && !s.assignee_id);
                    const assigned = filteredSessions.filter(s => s.status === 'assigned' || s.assignee_id != null);
                    const pending = filteredSessions.filter(s => s.status === 'pending');
                    const resolved = filteredSessions.filter(s => s.status === 'resolved');
                    const archived = filteredSessions.filter(s => s.status === 'archived');

                    return (
                      <>
                        {activeUnassigned.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.active')}
                              count={activeUnassigned.length}
                              colorClass="bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              icon={Sparkles}
                            />
                            <div className="space-y-2 px-1">
                              {activeUnassigned.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {inactiveUnassigned.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.inactive')}
                              count={inactiveUnassigned.length}
                              colorClass="bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                              icon={Clock}
                            />
                            <div className="space-y-2 px-1">
                              {inactiveUnassigned.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {assigned.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.assigned')}
                              count={assigned.length}
                              colorClass="bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              icon={Users}
                            />
                            <div className="space-y-2 px-1">
                              {assigned.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {pending.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.pending')}
                              count={pending.length}
                              colorClass="bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              icon={AlertTriangle}
                            />
                            <div className="space-y-2 px-1">
                              {pending.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {resolved.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.resolved')}
                              count={resolved.length}
                              colorClass="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              icon={CheckCircle2}
                            />
                            <div className="space-y-2 px-1">
                              {resolved.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {archived.length > 0 && (
                          <div className="mb-4">
                            <StatusGroupHeader
                              label={t('conversations.statusGroups.archived')}
                              count={archived.length}
                              colorClass="bg-slate-100/80 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400"
                              icon={Archive}
                            />
                            <div className="space-y-2 px-1">
                              {archived.map((session, idx) => (
                                <ConversationCard key={session.conversation_id} session={session} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              ) : isSidebarCollapsed && filteredSessions.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2 p-2"
                >
                  {filteredSessions.slice(0, 10).map((session, idx) => {
                    const assignedToMe = session.assignee_id === user?.id;
                    return (
                      <motion.button
                        key={session.conversation_id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSessionId(session.conversation_id)}
                        className={`p-2.5 rounded-xl transition-all relative ${
                          selectedSessionId === session.conversation_id
                            ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 shadow-md'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={session.contact_name || t('conversations.card.unknownContact')}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="channel-icon-container w-8 h-8 relative">
                            {getChannelIcon(session.channel)}
                            {assignedToMe && session.is_client_connected && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-white dark:border-slate-800 status-dot status-dot-online" />
                            )}
                            {assignedToMe && !session.is_client_connected && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border border-white dark:border-slate-800" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center h-full p-8"
                >
                  <div className="text-center">
                    <div className="empty-state-icon inline-block mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {searchQuery ? t('conversations.emptyState.noMatches') : 'No conversations'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : `No ${activeTab} conversations at the moment`
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Center - Conversation Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${
            isSidebarCollapsed && isRightSidebarCollapsed ? 'md:col-span-10' :
            isSidebarCollapsed ? 'md:col-span-8' :
            isRightSidebarCollapsed ? 'md:col-span-8' :
            'md:col-span-6'
          }`}
        >
          <AnimatePresence mode="wait">
            {selectedSessionId ? (
              <motion.div
                key={selectedSessionId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ConversationDetail
                  sessionId={selectedSessionId}
                  agentId={1}
                  onSummaryClick={() => setSidebarView(sidebarView === 'summary' ? 'contact' : 'summary')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <Card className="h-full flex items-center justify-center card-shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative">
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
                  </div>

                  <div className="text-center p-8 relative z-10">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="empty-state-icon inline-block mb-6"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                          <MessageSquare className="w-12 h-12 text-white" />
                        </div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute -inset-4 rounded-full border-2 border-dashed border-blue-200 dark:border-blue-800"
                        />
                      </div>
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold mb-3 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                    >
                      {t('conversations.emptyState.noSelection')}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground max-w-sm mx-auto leading-relaxed"
                    >
                      {t('conversations.emptyState.noSelectionDesc')}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-8 flex items-center justify-center gap-4"
                    >
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold ${
                              i === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              i === 1 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                              'bg-gradient-to-br from-pink-500 to-pink-600'
                            }`}
                            style={{ animationDelay: `${i * 0.1}s` }}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">Select a conversation to start</p>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Sidebar - Contact Profile or Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`h-full overflow-hidden transition-all duration-500 ease-out ${isRightSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'}`}
        >
          <Card className="h-full flex flex-col card-shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            {/* Decorative gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            {/* Collapse/Expand Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
              className={`absolute ${isRTL ? '-right-3' : '-left-3'} top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300`}
              title={isRightSidebarCollapsed ? t('conversations.expandSidebar') : t('conversations.collapseSidebar')}
            >
              <motion.div
                animate={{ rotate: isRightSidebarCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isRTL ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence mode="wait">
              {selectedSessionId ? (
                isRightSidebarCollapsed ? (
                  /* Collapsed view - show minimal info */
                  <motion.div
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full p-2 gap-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        {sidebarView === 'summary' ? (
                          <Sparkles className="h-6 w-6 text-white" />
                        ) : (
                          <UserIcon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground text-center font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                        {sidebarView === 'summary' ? 'Summary' : 'Contact'}
                      </span>
                    </motion.div>
                  </motion.div>
                ) : (
                  /* Expanded view - show full content */
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full overflow-hidden"
                  >
                    {sidebarView === 'summary' ? (
                      <ConversationSummary
                        sessionId={selectedSessionId}
                        onBack={() => setSidebarView('contact')}
                      />
                    ) : (
                      <ContactProfile sessionId={selectedSessionId} />
                    )}
                  </motion.div>
                )
              ) : (
                /* No session selected */
                isRightSidebarCollapsed ? (
                  <motion.div
                    key="collapsed-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full p-2"
                  >
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded-empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center justify-center h-full"
                  >
                    <div className="text-center p-8">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="empty-state-icon inline-block mb-6"
                      >
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                            <UserIcon className="w-10 h-10 text-white" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </motion.div>

                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg font-bold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                      >
                        {t('conversations.emptyState.contactDetails')}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-sm max-w-[180px] mx-auto"
                      >
                        {t('conversations.emptyState.contactDetailsDesc')}
                      </motion.p>
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

export default ConversationsPage;
