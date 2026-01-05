import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { MessageSquare, Phone, Globe, Instagram, Mail, Send, Search, Filter, Archive, PanelLeftClose, PanelRightOpen, AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react'; // Icons for channels
import { getWebSocketUrl } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
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

  // Conversation Card Component
  const ConversationCard = ({ session }: { session: Session }) => {
    const assignedToMe = isAssignedToMe(session);
    const isDisconnected = assignedToMe && !session.is_client_connected;
    const isRecentlyReopened = reopenedSessions.has(session.conversation_id);
    const hasBeenReopened = (session.reopen_count ?? 0) > 0;
    const hasPriority = (session.priority || 0) > 0;
    const priorityBorder = getPriorityBorderColor(session.priority);

    return (
      <button
        onClick={() => setSelectedSessionId(session.conversation_id)}
        className={`
          w-full p-4 text-left transition-all flex-shrink-0 border-l-4
          ${selectedSessionId === session.conversation_id
            ? 'bg-blue-100 dark:bg-blue-900 border-l-blue-600 shadow-md'
            : assignedToMe
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-l-amber-500 hover:shadow-md ring-2 ring-amber-200 dark:ring-amber-800'
            : hasPriority && !assignedToMe
            ? `${getStatusColor(session.status)} ${priorityBorder} hover:shadow-sm`
            : `${getStatusColor(session.status)} hover:shadow-sm`
          }
          ${session.status === 'resolved' ? 'hover:opacity-100' : ''}
          ${assignedToMe ? 'font-semibold' : ''}
          ${isDisconnected ? 'opacity-75' : ''}
          ${isRecentlyReopened ? 'conversation-reopened' : ''}
        `}
      >
        <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex-shrink-0 mt-1 relative">
            {getChannelIcon(session.channel)}
            {/* Connection status indicator for assigned conversations - only for web channels */}
            {assignedToMe && isWebChannel(session.channel) && session.is_client_connected && (
              <span className={`absolute -top-1 h-2 w-2 bg-green-500 rounded-full animate-pulse ${isRTL ? '-left-1' : '-right-1'}`} title="Client connected"></span>
            )}
            {assignedToMe && isWebChannel(session.channel) && !session.is_client_connected && (
              <span className={`absolute -top-1 h-2 w-2 bg-red-500 rounded-full ${isRTL ? '-left-1' : '-right-1'}`} title="Client disconnected"></span>
            )}
            {/* Status indicator dot for non-assigned */}
            {!assignedToMe && session.status === 'active' && (
              <span className={`absolute -top-1 h-2 w-2 bg-green-500 rounded-full animate-pulse ${isRTL ? '-left-1' : '-right-1'}`}></span>
            )}
            {!assignedToMe && session.status === 'inactive' && (
              <span className={`absolute -top-1 h-2 w-2 bg-gray-400 rounded-full ${isRTL ? '-left-1' : '-right-1'}`}></span>
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {assignedToMe && (
                  <span className="text-amber-500 dark:text-amber-400 flex-shrink-0 text-base">⭐</span>
                )}
                <h4 className={`font-medium text-sm truncate ${
                  session.status === 'resolved'
                    ? 'text-gray-600 dark:text-gray-400 line-through'
                    : assignedToMe
                    ? 'text-amber-900 dark:text-amber-100'
                    : 'dark:text-white'
                }`}>
                  {session.contact_name || session.contact_phone || t('conversations.card.unknownContact')}
                </h4>
              </div>
              <Badge
                variant={getStatusBadgeVariant(session.status)}
                className={`${isRTL ? 'mr-2' : 'ml-2'} flex-shrink-0 text-xs ${
                  session.status === 'active' ? 'bg-green-500 text-white' : ''
                } ${
                  session.status === 'inactive' ? 'bg-gray-500 text-white' : ''
                } ${
                  session.status === 'resolved' ? 'bg-blue-500 text-white' : ''
                } ${
                  assignedToMe ? 'bg-amber-500 text-white' : ''
                }`}
              >
                {assignedToMe ? t('conversations.status.mine') : session.status}
              </Badge>
              {hasPriority && (
                <PriorityBadge priority={session.priority || 0} />
              )}
              {hasBeenReopened && (
                <Badge className={`${isRTL ? 'mr-1' : 'ml-1'} flex-shrink-0 text-xs reopened-badge border-0`}>
                  🔄 {session.reopen_count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {session.last_message_timestamp ? new Date(session.last_message_timestamp).toLocaleString() : ''}
            </p>
            {session.assignee_id && !assignedToMe && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 truncate flex items-center gap-1">
                <span className="text-sm">💼</span> {t('conversations.card.assignedTo', { email: getAssigneeEmail(session.assignee_id) })}
              </p>
            )}
            {/* Web channel: show online/offline status */}
            {assignedToMe && isWebChannel(session.channel) && session.is_client_connected && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 truncate flex items-center gap-1 font-semibold">
                <span className="text-sm">🟢</span> {t('conversations.card.assignedToYouOnline')}
              </p>
            )}
            {assignedToMe && isWebChannel(session.channel) && !session.is_client_connected && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate flex items-center gap-1 font-semibold">
                <span className="text-sm">🔴</span> {t('conversations.card.clientDisconnected')}
              </p>
            )}
            {/* External channels: show last active time instead */}
            {assignedToMe && !isWebChannel(session.channel) && session.last_message_timestamp && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate flex items-center gap-1 font-semibold">
                <span className="text-sm">⏱️</span> {t('conversations.card.lastActive', { time: formatDistanceToNow(new Date(session.last_message_timestamp), { addSuffix: true }) })}
              </p>
            )}
            {session.status === 'resolved' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate flex items-center gap-1">
                {t('conversations.card.resolvedConversation')}
              </p>
            )}
            {hasBeenReopened && session.last_reopened_at && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 truncate flex items-center gap-1">
                {t('conversations.card.reopened', { time: formatDistanceToNow(new Date(session.last_reopened_at), { addSuffix: true }) })}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">
        {/* Left Sidebar - Conversation List */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'}`}>
          <Card className="h-full flex flex-col card-shadow-lg bg-white dark:bg-slate-800 relative">
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute ${isRTL ? '-left-3' : '-right-3'} top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group`}
              title={isSidebarCollapsed ? t('conversations.expandSidebar') : t('conversations.collapseSidebar')}
            >
              {isSidebarCollapsed ? (
                isRTL ? (
                  <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 scale-x-[-1]" />
                ) : (
                  <PanelRightOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )
              ) : (
                isRTL ? (
                  <PanelRightOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 scale-x-[-1]" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                )
              )}
            </button>

            <CardHeader className={`border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 py-3 ${isSidebarCollapsed ? 'px-2' : 'space-y-3'}`}>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg dark:text-white">{t('conversations.inbox')}</CardTitle>
                    <Badge variant="outline" className={`${isRTL ? 'mr-2' : 'ml-2'} dark:border-slate-600 dark:text-slate-300`}>
                      {sessionCounts?.all || 0}
                    </Badge>
                  </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type="text"
                  placeholder={t('conversations.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${isRTL ? 'pr-10' : 'pl-10'}`}
                />
              </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mine' | 'open' | 'resolved' | 'all')} className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-1 rounded-lg shadow-inner">
                  <TabsTrigger
                    value="open"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{t('conversations.tabs.open')}</span>
                      <span className="font-semibold">({sessionCounts?.open || 0})</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="mine"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 relative"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{t('conversations.tabs.mine')}</span>
                      <span className="font-semibold">({sessionCounts?.mine || 0})</span>
                      {unreadAssignments > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg border-2 border-white dark:border-slate-800">
                          {unreadAssignments}
                        </span>
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{t('conversations.tabs.resolved')}</span>
                      <span className="font-semibold">({sessionCounts?.resolved || 0})</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{t('conversations.tabs.all')}</span>
                      <span className="font-semibold">({sessionCounts?.all || 0})</span>
                    </span>
                  </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </>
              )}

              {/* Collapsed view - show icon tabs only */}
              {isSidebarCollapsed && (
                <div className="flex flex-col gap-2 items-center py-2">
                  <Badge variant="outline" className="text-xs">
                    {sessionCounts?.all || 0}
                  </Badge>
                  {unreadAssignments > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadAssignments}
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className={`flex-1 overflow-y-auto bg-white dark:bg-slate-800 ${isSidebarCollapsed ? 'p-0' : ''}`}>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">{t('conversations.loadingConversations')}</p>
                  </div>
                </div>
              ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
                <div className="space-y-1">
                  {/* Group conversations by status */}
                  {filteredSessions.filter(s => s.status === 'active' && !s.assignee_id).length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-green-100 dark:bg-green-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase">
                          {t('conversations.statusGroups.active')} ({filteredSessions.filter(s => s.status === 'active' && !s.assignee_id).length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'active' && !s.assignee_id).map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'inactive' && !s.assignee_id).length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          {t('conversations.statusGroups.inactive')} ({filteredSessions.filter(s => s.status === 'inactive' && !s.assignee_id).length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'inactive' && !s.assignee_id).map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'assigned' || s.assignee_id != null).length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase">
                          {t('conversations.statusGroups.assigned')} ({filteredSessions.filter(s => s.status === 'assigned' || s.assignee_id != null).length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'assigned' || s.assignee_id != null).map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'pending').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-red-100 dark:bg-red-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase">
                          {t('conversations.statusGroups.pending')} ({filteredSessions.filter(s => s.status === 'pending').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'pending').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'resolved').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase">
                          {t('conversations.statusGroups.resolved')} ({filteredSessions.filter(s => s.status === 'resolved').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'resolved').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'archived').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          {t('conversations.statusGroups.archived')} ({filteredSessions.filter(s => s.status === 'archived').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'archived').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}
                </div>
              ) : isSidebarCollapsed && filteredSessions.length > 0 ? (
                <div className="flex flex-col gap-1 p-1">
                  {filteredSessions.slice(0, 10).map((session) => {
                    const assignedToMe = session.assignee_id === user?.id;
                    return (
                      <button
                        key={session.conversation_id}
                        onClick={() => setSelectedSessionId(session.conversation_id)}
                        className={`p-2 rounded transition-all relative ${
                          selectedSessionId === session.conversation_id
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                        title={session.contact_name || t('conversations.card.unknownContact')}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {getChannelIcon(session.channel)}
                          {assignedToMe && session.is_client_connected && (
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                          )}
                          {assignedToMe && !session.is_client_connected && (
                            <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? t('conversations.emptyState.noMatches') : t('conversations.emptyState.noConversations', { tab: activeTab })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Conversation Detail */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed && isRightSidebarCollapsed ? 'md:col-span-10' :
          isSidebarCollapsed ? 'md:col-span-8' :
          isRightSidebarCollapsed ? 'md:col-span-8' :
          'md:col-span-6'
        }`}>
          {selectedSessionId ? (
            <ConversationDetail
              sessionId={selectedSessionId}
              agentId={1}
              onSummaryClick={() => setSidebarView(sidebarView === 'summary' ? 'contact' : 'summary')}
            />
          ) : (
            <Card className="h-full flex items-center justify-center card-shadow-lg bg-white dark:bg-slate-800">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('conversations.emptyState.noSelection')}</h3>
                <p className="text-muted-foreground">
                  {t('conversations.emptyState.noSelectionDesc')}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Contact Profile or Summary */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${isRightSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'}`}>
          <Card className="h-full flex flex-col card-shadow-lg bg-white dark:bg-slate-800 relative">
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
              className={`absolute ${isRTL ? '-right-3' : '-left-3'} top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group`}
              title={isRightSidebarCollapsed ? t('conversations.expandSidebar') : t('conversations.collapseSidebar')}
            >
              {isRightSidebarCollapsed ? (
                isRTL ? (
                  <PanelRightOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 scale-x-[-1]" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                )
              ) : (
                isRTL ? (
                  <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 scale-x-[-1]" />
                ) : (
                  <PanelRightOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                )
              )}
            </button>

            {selectedSessionId ? (
              isRightSidebarCollapsed ? (
                /* Collapsed view - show minimal info */
                <div className="flex flex-col items-center justify-center h-full p-2 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground text-center writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                      {sidebarView === 'summary' ? t('conversations.detail.summary', { defaultValue: 'Summary' }) : t('conversations.emptyState.contactDetails', { defaultValue: 'Contact' })}
                    </span>
                  </div>
                </div>
              ) : (
                /* Expanded view - show full content */
                <div className="h-full overflow-hidden">
                  {sidebarView === 'summary' ? (
                    <ConversationSummary
                      sessionId={selectedSessionId}
                      onBack={() => setSidebarView('contact')}
                    />
                  ) : (
                    <ContactProfile sessionId={selectedSessionId} />
                  )}
                </div>
              )
            ) : (
              /* No session selected */
              isRightSidebarCollapsed ? (
                <div className="flex flex-col items-center justify-center h-full p-2">
                  <Phone className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 mb-4">
                      <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('conversations.emptyState.contactDetails')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('conversations.emptyState.contactDetailsDesc')}
                    </p>
                  </div>
                </div>
              )
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
