
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser, Moon, Sun, ChevronsLeft, ChevronsRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import IncomingCallModal from "@/components/IncomingCallModal";
import { BACKEND_URL } from "@/config/env";
import { API_BASE_URL } from "@/config/api";
import {
  Plus,
  MessageSquare,
  Settings,
  BarChart3,
  Bot,
  Users,
  Inbox,
  FileText,
  Sparkles,
  WorkflowIcon as WorkflowIcon,
  Zap,
  Palette,
  Menu,
  X,
  Key,
  BookOpen,
  CreditCard,
  Mic,
  Building,
  Target,
  Send,
  TrendingUp,
  Tag,
  Layers,
  LayoutTemplate
} from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { Permission } from "./Permission";
import { PresenceSelector } from "@/components/PresenceSelector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/hooks/useI18n";
import { useBranding } from "@/hooks/BrandingProvider";

const AppLayout = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout, refetchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const branding = useBranding();
  const { toast } = useToast();
  const { soundEnabled, enableSound, showNotification } = useNotifications();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  console.log("Logged in user:", user);

  // Global incoming call state
  const [incomingCall, setIncomingCall] = useState<{
    callId: number;
    callerId: number;
    callerName: string;
    callerAvatar?: string;
    channelId: number;
    channelName: string;
    roomName: string;
    livekitToken: string;
    livekitUrl: string;
  } | null>(null);

  // Handoff call state (customer -> agent)
  const [handoffCall, setHandoffCall] = useState<{
    sessionId: string;
    customerName: string;
    summary: string;
    priority: string;
    roomName: string;
    livekitUrl: string;
    agentToken: string;
    userToken: string;
  } | null>(null);

  // Global WebSocket connection for company-wide notifications
  const companyWsUrl = user?.company_id
    ? `${BACKEND_URL.replace('http', 'ws')}/ws/${user.company_id}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(companyWsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);

      if (wsMessage.type === 'incoming_call') {
        // Handoff call from customer to agent
        const { agent_id, session_id, customer_name, summary, priority, room_name, livekit_url, agent_token, user_token } = wsMessage;
        console.log('[AppLayout] Handoff call notification received:', { agent_id, session_id, customer_name });

        // Only show notification if this call is for the current user
        if (user && agent_id === user.id) {
          console.log('[AppLayout] Showing handoff call notification for agent:', user.id);
          setHandoffCall({
            sessionId: session_id,
            customerName: customer_name || 'Customer',
            summary: summary || 'Customer requested human support',
            priority: priority || 'normal',
            roomName: room_name,
            livekitUrl: livekit_url,
            agentToken: agent_token,
            userToken: user_token,
          });

          // Show browser notification
          showNotification({
            title: 'Incoming Support Call',
            body: `${customer_name} needs assistance`,
            tag: `handoff-${session_id}`,
          });
        } else {
          console.log('[AppLayout] Ignoring handoff call - not for this agent. Target:', agent_id, 'Current:', user?.id);
        }
      } else if (wsMessage.type === 'video_call_initiated') {
        const { call_id, room_name, livekit_token, livekit_url, channel_id, channel_member_ids, caller_id, caller_name, caller_avatar } = wsMessage;
        console.log('[AppLayout] Global video call notification received:', { call_id, caller_id, channel_id, channel_member_ids });

        // Check if current user is a member of this channel
        const isChannelMember = channel_member_ids && user && channel_member_ids.includes(user.id);

        // Only show notification if user is a channel member AND not the caller
        if (user && caller_id !== user.id && isChannelMember) {
          setIncomingCall({
            callId: call_id,
            callerId: caller_id,
            callerName: caller_name || 'Unknown',
            callerAvatar: caller_avatar,
            channelId: channel_id,
            channelName: `Channel ${channel_id}`, // We'll improve this later
            roomName: room_name,
            livekitToken: livekit_token,
            livekitUrl: livekit_url,
          });

          // Show browser notification
          showNotification({
            title: 'Incoming Video Call',
            body: `${caller_name} is calling...`,
            tag: `call-${call_id}`,
          });
        } else if (user && !isChannelMember) {
          console.log('[AppLayout] Ignoring call - user is not a member of channel', channel_id);
        }
      } else if (wsMessage.type === 'unread_count_update') {
        const { user_id, unread_count } = wsMessage;
        console.log('[AppLayout] Unread count update received:', { user_id, unread_count });

        // Only update if this message is for the current user
        if (user && user_id === user.id) {
          const previousCount = queryClient.getQueryData<number>(['notificationUnreadCount']) || 0;
          queryClient.setQueryData(['notificationUnreadCount'], unread_count);

          // Play notification sound if count increased (new notification)
          if (unread_count > previousCount) {
            console.log('[AppLayout] New notification detected, playing sound');
            showNotification({
              title: 'New Notification',
              body: 'You have a new notification',
              tag: 'notification-update',
            });
          }
        }
      } else if (wsMessage.type === 'presence_update') {
        const { user_id, status } = wsMessage.payload;
        console.log('[AppLayout] Presence update received:', { user_id, status });

        // If the presence update is for the current user, refetch their data
        if (user && user_id === user.id) {
          console.log('[AppLayout] Refetching current user data due to presence update');
          refetchUser();
        }

        // Invalidate users query to update presence status in TeamManagement and other components
        queryClient.invalidateQueries({ queryKey: ['users'] });

        // Also invalidate channel members if needed
        queryClient.invalidateQueries({ queryKey: ['channelMembers'] });
      }
    },
    enabled: !!user?.company_id,
  });

  // Handle accepting a call
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      const token = localStorage.getItem('accessToken');

      // Save current presence status before joining call
      if (user?.presence_status && user.presence_status !== 'in_call') {
        localStorage.setItem('previousPresenceStatus', user.presence_status);
        console.log('[AppLayout Call] Saved previous status:', user.presence_status);
      }

      // Set status to in_call
      try {
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/presence?presence_status=in_call`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[AppLayout Call] Status set to in_call');
      } catch (statusError) {
        console.error('[AppLayout Call] Failed to set in_call status:', statusError);
      }

      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${incomingCall.callId}/accept`;
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { room_name, livekit_token, livekit_url } = response.data;

      // Clear incoming call state
      setIncomingCall(null);

      // Navigate to video call page
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(room_name)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekit_url)}&channelId=${incomingCall.channelId}&callId=${incomingCall.callId}`
      );
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept call',
        variant: 'destructive',
      });
    }
  };

  // Handle rejecting a call
  const handleRejectCall = async () => {
    if (!incomingCall) return;

    try{
      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${incomingCall.callId}/reject`;
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });

      // Clear incoming call state
      setIncomingCall(null);

      toast({
        title: 'Call declined',
        description: 'You declined the call',
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
      setIncomingCall(null);
    }
  };

  // Handle accepting a handoff call (customer support)
  const handleAcceptHandoffCall = async () => {
    if (!handoffCall) return;

    try {
      const token = localStorage.getItem('accessToken');

      // Call the accept endpoint
      const endpoint = `${API_BASE_URL}/api/v1/calls/accept`;
      await axios.post(endpoint, {
        session_id: handoffCall.sessionId,
        room_name: handoffCall.roomName,
        livekit_url: handoffCall.livekitUrl,
        user_token: handoffCall.userToken,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear handoff call state
      setHandoffCall(null);

      // Navigate to LiveKit call page with agent token
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(handoffCall.roomName)}&livekitToken=${encodeURIComponent(handoffCall.agentToken)}&livekitUrl=${encodeURIComponent(handoffCall.livekitUrl)}&sessionId=${handoffCall.sessionId}`
      );

      toast({
        title: 'Call accepted',
        description: `Connected to ${handoffCall.customerName}`,
      });
    } catch (error) {
      console.error('Error accepting handoff call:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept call',
        variant: 'destructive',
      });
      setHandoffCall(null);
    }
  };

  // Handle rejecting a handoff call
  const handleRejectHandoffCall = async () => {
    if (!handoffCall) return;

    try {
      const endpoint = `${API_BASE_URL}/api/v1/calls/reject`;
      await axios.post(endpoint, {
        session_id: handoffCall.sessionId,
        reason: 'Agent declined',
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });

      // Clear handoff call state
      setHandoffCall(null);

      toast({
        title: 'Call declined',
        description: 'Customer will be notified',
      });
    } catch (error) {
      console.error('Error rejecting handoff call:', error);
      setHandoffCall(null);
    }
  };

  // Show prompt to enable notification sounds on first load
  useEffect(() => {
    // Check if user has been prompted for sound before
    const soundPromptDismissed = localStorage.getItem('notificationSoundPromptDismissed');

    // Show prompt to enable notification sounds if not enabled and not previously dismissed
    if (!soundEnabled && soundPromptDismissed !== 'true') {
      // Delay the toast slightly so it doesn't appear immediately on page load
      const timer = setTimeout(() => {
        toast({
          title: "Enable Notification Sounds?",
          description: "Get audio alerts for mentions, replies, reactions, and calls",
          action: (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('[AppLayout] Enable sound button clicked');
                  enableSound();
                  // Auto-dismiss after enabling
                }}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
              >
                Enable
              </button>
              <button
                onClick={() => {
                  console.log('[AppLayout] Dismiss sound prompt button clicked');
                  localStorage.setItem('notificationSoundPromptDismissed', 'true');
                }}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Dismiss
              </button>
            </div>
          ),
          duration: 10000, // Show for 10 seconds
        });
      }, 2000); // Wait 2 seconds after page load

      return () => clearTimeout(timer);
    }
  }, [soundEnabled]);

  const sidebarItems = [
    // Core Operations
    { titleKey: "navigation.activeClients", url: "/dashboard/conversations", icon: Inbox, permission: "conversation:read" },
    { titleKey: "navigation.agents", url: "/dashboard/agents", icon: Bot, permission: "agent:read" },
    { titleKey: "navigation.agentBuilder", url: "/dashboard/builder", icon: Settings, permission: "agent:update" },
    { titleKey: "navigation.widgetDesigner", url: "/dashboard/designer", icon: Palette, permission: "company_settings:update" },

    // Analytics & Monitoring
    { titleKey: "navigation.reports", url: "/dashboard/reports", icon: BarChart3, permission: "analytics:read" },

    // CRM
    { titleKey: "navigation.crm", url: "/dashboard/crm", icon: TrendingUp, permission: "lead:read" },
    { titleKey: "navigation.contacts", url: "/dashboard/crm/contacts", icon: Users, permission: "contact:read" },
    { titleKey: "navigation.leads", url: "/dashboard/crm/leads", icon: Target, permission: "lead:read" },
    { titleKey: "navigation.campaigns", url: "/dashboard/crm/campaigns", icon: Send, permission: "campaign:read" },
    { titleKey: "navigation.tags", url: "/dashboard/crm/tags", icon: Tag, permission: "tag:read" },
    { titleKey: "navigation.segments", url: "/dashboard/crm/segments", icon: Layers, permission: "segment:read" },
    { titleKey: "navigation.templates", url: "/dashboard/crm/templates", icon: LayoutTemplate, permission: "email_template:read" },

    // Configuration & Resources
    { titleKey: "navigation.knowledgeBases", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "knowledgebase:read" },
    { titleKey: "navigation.customTools", url: "/dashboard/tools", icon: Zap, permission: "tool:read" },
    { titleKey: "navigation.customWorkflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "workflow:read" },
    { titleKey: "navigation.voiceLab", url: "/dashboard/voice-lab", icon: Mic, permission: "voice:create" },

    // Team & Communication
    { titleKey: "navigation.teamManagement", url: "/dashboard/team", icon: Users, permission: "user:read" },
    { titleKey: "navigation.teamChat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "chat:read" },
    { titleKey: "navigation.messageTemplates", url: "/dashboard/message-templates", icon: Sparkles, permission: "message_template:read" },

    // AI Features
    { titleKey: "navigation.aiChat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "ai-chat:read" },
    { titleKey: "navigation.aiTools", url: "/dashboard/ai-tools", icon: Sparkles, permission: "ai-tool:read" },
    { titleKey: "navigation.aiImageGenerator", url: "/dashboard/ai-image-generator", icon: Sparkles, permission: "image:create" },
    { titleKey: "navigation.aiImageGallery", url: "/dashboard/ai-image-gallery", icon: FileText, permission: "image:read" },
    { titleKey: "navigation.visionAI", url: "/dashboard/object-detection", icon: Sparkles, permission: "image:create" },

    // System & Administration
    { titleKey: "navigation.settings", url: "/dashboard/settings", icon: FileText, permission: "company_settings:update" },
    { titleKey: "navigation.apiVault", url: "/dashboard/vault", icon: Key, permission: "company_settings:update" },
    { titleKey: "navigation.billing", url: "/dashboard/billing", icon: CreditCard, permission: "billing:manage" },
    { titleKey: "navigation.managePlans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
    { titleKey: "navigation.companies", url: "/dashboard/companies", icon: Building, admin: true },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 z-20">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer lg:cursor-default"
              onClick={() => {
                // Only toggle sidebar on mobile/tablet screens
                if (window.innerWidth < 1024) {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  className="h-10 w-10 object-contain rounded-lg"
                />
              ) : (
                <div className="p-2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{branding.companyName}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )}
              </Button>

              {/* User Info Card with Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.email}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white dark:ring-slate-700">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/profile">{t('navigation.profile')}</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>{t('common.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile User Menu - Show icon on mobile only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full lg:hidden">
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/profile">{t('navigation.profile')}</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>{t('common.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Sidebar with Dark Mode */}
        <aside
          className={`flex-shrink-0 bg-white dark:bg-slate-900 ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-700 transition-all duration-300 relative ${
            sidebarOpen ? '' : '-ml-64 lg:ml-0'
          } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          {/* Collapse/Expand Button for Desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute ${isRTL ? '-left-3' : '-right-3'} top-8 z-20 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group`}
            title={sidebarCollapsed ? t("navigation.expandSidebar") : t("navigation.collapseSidebar")}
          >
            {sidebarCollapsed ? (
              isRTL ? (
                <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 scale-x-[-1]" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              )
            ) : (
              isRTL ? (
                <PanelLeftOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 scale-x-[-1]" />
              ) : (
                <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              )
            )}
          </button>

          <nav className={`p-3 space-y-1 h-full flex flex-col overflow-y-auto ${sidebarCollapsed ? 'items-center' : ''}`}>
            <div className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                // Only show admin items if user is super admin
                if (item.admin && !user?.is_super_admin) return null;

                return (
                  <Permission key={item.url} permission={item.permission}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                          sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`
                      }
                      title={sidebarCollapsed ? t(item.titleKey) : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isActive ? '' : 'group-hover:scale-110'
                            } ${sidebarCollapsed ? 'flex-shrink-0' : ''}`}
                          />
                          {!sidebarCollapsed && <span className="truncate">{t(item.titleKey)}</span>}
                        </>
                      )}
                    </NavLink>
                  </Permission>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content with Background */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors">
          <Outlet />
        </main>
      </div>

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Global Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          isOpen={true}
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          channelName={incomingCall.channelName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Handoff Call Modal (Customer Support) */}
      {handoffCall && (
        <IncomingCallModal
          isOpen={true}
          callerName={handoffCall.customerName}
          channelName={`Support Request - ${handoffCall.summary}`}
          onAccept={handleAcceptHandoffCall}
          onReject={handleRejectHandoffCall}
          callType="audio"
        />
      )}
    </div>
  );
};

export default AppLayout;
