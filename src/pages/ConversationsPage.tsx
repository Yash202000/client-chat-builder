import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Session, User } from '@/types';
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Phone, Globe, Instagram, Mail, Send, Search, Filter, Archive, PanelLeftClose, PanelRightOpen } from 'lucide-react'; // Icons for channels
import { getWebSocketUrl } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

const ConversationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, token, authFetch, isLoading: isAuthLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'open' | 'resolved' | 'all'>('open');
  const [unreadAssignments, setUnreadAssignments] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [reopenedSessions, setReopenedSessions] = useState<Set<string>>(new Set());

  const companyId = useMemo(() => user?.company_id, [user]);

  // Update browser tab title with unread count
  React.useEffect(() => {
    if (unreadAssignments > 0) {
      document.title = `(${unreadAssignments}) New Assignments - AgentConnect`;
    } else {
      document.title = 'Conversations - AgentConnect';
    }
  }, [unreadAssignments]);

  // Clear unread counter when viewing 'mine' tab
  React.useEffect(() => {
    if (activeTab === 'mine') {
      setUnreadAssignments(0);
    }
  }, [activeTab]);

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

      // Also fetch all sessions to count "mine" (only status='assigned' conversations assigned to me)
      const sessionsResponse = await authFetch(`/api/v1/conversations/sessions?status_filter=open`);
      const allSessions = await sessionsResponse.json();
      const mineCount = allSessions.filter(s =>
        s.status === 'assigned' && s.assignee_id === user?.id
      ).length;

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

      // For 'mine' tab, fetch all open and filter to assigned conversations only
      if (activeTab === 'mine') {
        const response = await authFetch(`/api/v1/conversations/sessions?status_filter=open`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const allSessions = await response.json();
        // Filter to only show sessions with status='assigned' AND assigned to current user
        return allSessions.filter(s =>
          s.status === 'assigned' && s.assignee_id === user?.id
        );
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

  const wsUrl = companyId ? `${getWebSocketUrl()}/api/v1/ws/updates/ws/${companyId}?token=${token}` : null;

  // Memoize WebSocket options to prevent unnecessary reconnections
  const wsOptions = useMemo(() => ({
    onMessage: (event) => {
        const eventData = JSON.parse(event.data);
        console.log('[WebSocket] Received event:', eventData.type, eventData);

        if (eventData.type === 'new_session') {
          console.log('[WebSocket] 🆕 New session created:', eventData.session);
          toast({
            title: "New Conversation",
            description: `A new conversation has started`,
            variant: "info",
          });
          // Invalidate queries to refetch session list and counts
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          queryClient.invalidateQueries({ queryKey: ['sessionCounts', companyId] });
        } else if (eventData.type === 'new_message') {
          toast({
            title: "New Message",
            description: `New message received in conversation`,
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
                  <span className="font-bold">New Assignment!</span>
                </div>
              ) as any,
              description: (
                <div className="space-y-1">
                  <p className="font-semibold">{eventData.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Channel: {eventData.channel} • {eventData.is_client_connected ? '🟢 Client Online' : '🔴 Client Offline'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSessionId(eventData.session_id);
                      setActiveTab('mine');
                      setUnreadAssignments(0);
                    }}
                    className="mt-2 text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
                  >
                    View Conversation →
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
              const response = await authFetch(`/api/v1/conversations/${eventData.session_id}/assignee`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
              });
              if (response.ok) {
                toast({
                  title: "Assigned Successfully",
                  description: "Conversation has been assigned to you",
                  variant: "default",
                });
                queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
              }
            } catch (error) {
              console.error('Failed to assign conversation:', error);
            }
          };

          // Determine if this is assigned to current user
          const isAssignedToCurrentUser = eventData.status === 'assigned' && eventData.assignee_id === user?.id;

          // Show enhanced toast notification with quick actions
          toast({
            title: (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                <span className="font-bold">
                  {isAssignedToCurrentUser ? 'Your Conversation Reopened!' : 'Conversation Reopened!'}
                </span>
              </div>
            ) as any,
            description: (
              <div className="space-y-2">
                <p className="font-semibold">
                  {isAssignedToCurrentUser
                    ? 'A customer assigned to you has returned to a resolved conversation'
                    : 'Customer has returned to a resolved conversation'}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Reopened: {timeSinceResolution}</p>
                  <p>• Reopen count: {eventData.reopen_count || 1} time(s)</p>
                  {eventData.contact_name && (
                    <p>• Contact: {eventData.contact_name}</p>
                  )}
                  {isAssignedToCurrentUser && (
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">⭐ Assigned to you</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSelectedSessionId(eventData.session_id);
                      // If status is 'assigned' and assigned to me, go to 'mine', otherwise 'open'
                      if (eventData.status === 'assigned' && eventData.assignee_id === user?.id) {
                        setActiveTab('mine');
                      } else {
                        setActiveTab('open');
                      }
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 font-medium transition-colors"
                  >
                    📋 View Now
                  </button>
                  {(!eventData.assignee_id || eventData.assignee_id !== user?.id) && (
                    <button
                      onClick={handleAssignToMe}
                      className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600 font-medium transition-colors"
                    >
                      ✋ Assign to Me
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
              const isAssignedToMe = eventData.status === 'assigned' && eventData.assignee_id === user?.id;

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
      case 'whatsapp': return <Phone className="h-4 w-4 text-green-500" />;
      case 'messenger': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'gmail': return <Mail className="h-4 w-4 text-red-500" />;
      case 'telegram': return <Send className="h-4 w-4 text-blue-400" />;
      case 'web':
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
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

  // Filter sessions by search query only (tab filtering is done server-side)
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    // Filter by search query (client-side for instant feedback)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return sessions.filter(session =>
        session.contact_name?.toLowerCase().includes(query) ||
        session.contact_phone?.toLowerCase().includes(query) ||
        session.first_message_content?.toLowerCase().includes(query)
      );
    }

    // Sessions are already sorted by the backend
    return sessions;
  }, [sessions, searchQuery]);

  // Check if conversation is assigned to current user
  const isAssignedToMe = (session: Session) => {
    return session.assignee_id === user?.id && session.status === 'assigned';
  };

  // Conversation Card Component
  const ConversationCard = ({ session }: { session: Session }) => {
    const assignedToMe = isAssignedToMe(session);
    const isDisconnected = assignedToMe && !session.is_client_connected;
    const isRecentlyReopened = reopenedSessions.has(session.conversation_id);
    const hasBeenReopened = (session.reopen_count ?? 0) > 0;

    return (
      <button
        onClick={() => setSelectedSessionId(session.conversation_id)}
        className={`
          w-full p-4 text-left transition-all flex-shrink-0 border-l-4
          ${selectedSessionId === session.conversation_id
            ? 'bg-blue-100 dark:bg-blue-900 border-l-blue-600 shadow-md'
            : assignedToMe
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-l-amber-500 hover:shadow-md ring-2 ring-amber-200 dark:ring-amber-800'
            : `${getStatusColor(session.status)} hover:shadow-sm`
          }
          ${session.status === 'resolved' ? 'hover:opacity-100' : ''}
          ${assignedToMe ? 'font-semibold' : ''}
          ${isDisconnected ? 'opacity-75' : ''}
          ${isRecentlyReopened ? 'conversation-reopened' : ''}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1 relative">
            {getChannelIcon(session.channel)}
            {/* Connection status indicator for assigned conversations */}
            {assignedToMe && session.is_client_connected && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" title="Client connected"></span>
            )}
            {assignedToMe && !session.is_client_connected && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" title="Client disconnected"></span>
            )}
            {/* Status indicator dot for non-assigned */}
            {!assignedToMe && session.status === 'active' && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
            {!assignedToMe && session.status === 'inactive' && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-gray-400 rounded-full"></span>
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
                  {session.contact_name || session.contact_phone || 'Unknown Contact'}
                </h4>
              </div>
              <Badge
                variant={getStatusBadgeVariant(session.status)}
                className={`ml-2 flex-shrink-0 text-xs ${
                  session.status === 'active' ? 'bg-green-500 text-white' : ''
                } ${
                  session.status === 'inactive' ? 'bg-gray-500 text-white' : ''
                } ${
                  session.status === 'resolved' ? 'bg-blue-500 text-white' : ''
                } ${
                  assignedToMe ? 'bg-amber-500 text-white' : ''
                }`}
              >
                {assignedToMe ? 'Mine' : session.status}
              </Badge>
              {hasBeenReopened && (
                <Badge className="ml-1 flex-shrink-0 text-xs reopened-badge border-0">
                  🔄 {session.reopen_count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {new Date(Number(session.conversation_id)).toLocaleString()}
            </p>
            {session.status === 'assigned' && !assignedToMe && (
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 truncate flex items-center gap-1">
                <span className="text-sm">💼</span> Assigned to {getAssigneeEmail(session.assignee_id)}
              </p>
            )}
            {assignedToMe && session.is_client_connected && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 truncate flex items-center gap-1 font-semibold">
                <span className="text-sm">🟢</span> Assigned to you - Client online
              </p>
            )}
            {assignedToMe && !session.is_client_connected && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate flex items-center gap-1 font-semibold">
                <span className="text-sm">🔴</span> Client disconnected
              </p>
            )}
            {session.status === 'resolved' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate flex items-center gap-1">
                ✓ Resolved conversation
              </p>
            )}
            {hasBeenReopened && session.last_reopened_at && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 truncate flex items-center gap-1">
                🔄 Reopened {formatDistanceToNow(new Date(session.last_reopened_at), { addSuffix: true })}
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
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelRightOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              ) : (
                <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              )}
            </button>

            <CardHeader className={`border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 py-3 ${isSidebarCollapsed ? 'px-2' : 'space-y-3'}`}>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg dark:text-white">Inbox</CardTitle>
                    <Badge variant="outline" className="ml-2 dark:border-slate-600 dark:text-slate-300">
                      {sessionCounts?.all || 0}
                    </Badge>
                  </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
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
                      <span>Open</span>
                      <span className="font-semibold">({sessionCounts?.open || 0})</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="mine"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 relative"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Mine</span>
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
                      <span>Resolved</span>
                      <span className="font-semibold">({sessionCounts?.resolved || 0})</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>All</span>
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
                    <p className="text-sm text-muted-foreground">Loading conversations...</p>
                  </div>
                </div>
              ) : filteredSessions.length > 0 && !isSidebarCollapsed ? (
                <div className="space-y-1">
                  {/* Group conversations by status */}
                  {filteredSessions.filter(s => s.status === 'active').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-green-100 dark:bg-green-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase">
                          🟢 Active ({filteredSessions.filter(s => s.status === 'active').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'active').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'inactive').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          ⚫ Inactive ({filteredSessions.filter(s => s.status === 'inactive').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'inactive').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'assigned').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase">
                          👤 Assigned ({filteredSessions.filter(s => s.status === 'assigned').length})
                        </p>
                      </div>
                      {filteredSessions.filter(s => s.status === 'assigned').map((session) => (
                        <ConversationCard key={session.conversation_id} session={session} />
                      ))}
                    </>
                  )}

                  {filteredSessions.filter(s => s.status === 'pending').length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-red-100 dark:bg-red-900 sticky top-0 z-10">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase">
                          🔴 Pending ({filteredSessions.filter(s => s.status === 'pending').length})
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
                          ✓ Resolved ({filteredSessions.filter(s => s.status === 'resolved').length})
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
                          📁 Archived ({filteredSessions.filter(s => s.status === 'archived').length})
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
                    const assignedToMe = session.assignee_id === user?.id && session.status === 'assigned';
                    return (
                      <button
                        key={session.conversation_id}
                        onClick={() => setSelectedSessionId(session.conversation_id)}
                        className={`p-2 rounded transition-all relative ${
                          selectedSessionId === session.conversation_id
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                        title={session.contact_name || 'Unknown Contact'}
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
                      {searchQuery ? 'No conversations match your search' : `No ${activeTab} conversations`}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Conversation Detail */}
        <div className={`h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:col-span-8' : 'md:col-span-6'}`}>
          {selectedSessionId ? (
            <ConversationDetail sessionId={selectedSessionId} agentId={1} />
          ) : (
            <Card className="h-full flex items-center justify-center card-shadow-lg bg-white dark:bg-slate-800">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">No conversation selected</h3>
                <p className="text-muted-foreground">
                  Select a conversation from the list to view messages
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Contact Profile */}
        <div className="md:col-span-3 h-full overflow-hidden">
          {selectedSessionId ? (
            <ContactProfile sessionId={selectedSessionId} />
          ) : (
            <Card className="h-full flex items-center justify-center card-shadow-lg bg-white dark:bg-slate-800">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 mb-4">
                  <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Contact Details</h3>
                <p className="text-muted-foreground text-sm">
                  Select a conversation to view contact information
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
