
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
  LayoutTemplate,
  Database
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
    { titleKey: "navigation.activeClients", url: "/dashboard/conversations", icon: Inbox, permission: "page:conversations" },
    { titleKey: "navigation.agents", url: "/dashboard/agents", icon: Bot, permission: "page:agents" },
    { titleKey: "navigation.agentBuilder", url: "/dashboard/builder", icon: Settings, permission: "page:agent_builder" },
    { titleKey: "navigation.widgetDesigner", url: "/dashboard/designer", icon: Palette, permission: "page:widget_designer" },

    // Analytics & Monitoring
    { titleKey: "navigation.reports", url: "/dashboard/reports", icon: BarChart3, permission: "page:reports" },

    // CRM - Individual permissions for each section
    { titleKey: "navigation.crm", url: "/dashboard/crm", icon: TrendingUp, permission: "page:crm_dashboard" },
    { titleKey: "navigation.contacts", url: "/dashboard/crm/contacts", icon: Users, permission: "page:contacts" },
    { titleKey: "navigation.leads", url: "/dashboard/crm/leads", icon: Target, permission: "page:leads" },
    { titleKey: "navigation.campaigns", url: "/dashboard/crm/campaigns", icon: Send, permission: "page:campaigns" },
    { titleKey: "navigation.tags", url: "/dashboard/crm/tags", icon: Tag, permission: "page:tags" },
    { titleKey: "navigation.segments", url: "/dashboard/crm/segments", icon: Layers, permission: "page:segments" },
    { titleKey: "navigation.templates", url: "/dashboard/crm/templates", icon: LayoutTemplate, permission: "page:crm_templates" },

    // Knowledge & Content (CMS is now inside Knowledge Bases)
    { titleKey: "navigation.knowledgeBases", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "page:knowledge_base" },
    { titleKey: "navigation.customTools", url: "/dashboard/tools", icon: Zap, permission: "page:tools" },
    { titleKey: "navigation.customWorkflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "page:workflows" },
    { titleKey: "navigation.voiceLab", url: "/dashboard/voice-lab", icon: Mic, permission: "page:voice_lab" },

    // Team & Communication
    { titleKey: "navigation.teamManagement", url: "/dashboard/team", icon: Users, permission: "page:team_management" },
    { titleKey: "navigation.teamChat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "page:team_chat" },
    { titleKey: "navigation.messageTemplates", url: "/dashboard/message-templates", icon: Sparkles, permission: "page:message_templates" },

    // AI Features - Individual permissions
    { titleKey: "navigation.aiChat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "page:ai_chat" },
    { titleKey: "navigation.aiTools", url: "/dashboard/ai-tools", icon: Sparkles, permission: "page:ai_tools" },
    { titleKey: "navigation.aiImageGenerator", url: "/dashboard/ai-image-generator", icon: Sparkles, permission: "page:ai_image_generator" },
    { titleKey: "navigation.aiImageGallery", url: "/dashboard/ai-image-gallery", icon: FileText, permission: "page:ai_image_gallery" },
    { titleKey: "navigation.visionAI", url: "/dashboard/object-detection", icon: Sparkles, permission: "page:vision_ai" },

    // System & Administration
    { titleKey: "navigation.settings", url: "/dashboard/settings", icon: FileText, permission: "page:settings" },
    { titleKey: "navigation.apiVault", url: "/dashboard/vault", icon: Key, permission: "page:api_vault" },
    { titleKey: "navigation.billing", url: "/dashboard/billing", icon: CreditCard, permission: "page:billing" },
    { titleKey: "navigation.managePlans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
    { titleKey: "navigation.companies", url: "/dashboard/companies", icon: Building, admin: true },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-700/80 z-20 shadow-sm">
        <div className="px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer lg:cursor-default group"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
            >
              {branding.logoUrl ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <img
                    src={branding.logoUrl}
                    alt={branding.companyName}
                    className="relative h-11 w-11 object-contain rounded-xl shadow-lg ring-2 ring-white/50 dark:ring-slate-700/50"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
                  <div className="relative p-2.5 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/25">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {branding.companyName}
                </h1>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wide uppercase">
                  AI Platform
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-xl h-10 w-10 bg-slate-100/80 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/50 dark:border-slate-600/50 transition-all hover:scale-105"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-indigo-600" />
                )}
              </Button>

              {/* User Info Card with Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden lg:flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-xl bg-gradient-to-r from-slate-100/80 to-slate-50 dark:from-slate-700/80 dark:to-slate-800 border border-slate-200/80 dark:border-slate-600/60 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-all" />
                      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white dark:ring-slate-700">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {/* Online Status Indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-xl p-2 shadow-xl border-slate-200/80 dark:border-slate-700/80">
                  <div className="px-3 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user?.company_name || 'AgentConnect'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-2 py-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wide">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <NavLink to="/dashboard/profile" className="flex items-center gap-2">
                      <CircleUser className="h-4 w-4" />
                      {t('navigation.profile')}
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl lg:hidden h-10 w-10 bg-slate-100/80 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/50 dark:border-slate-600/50">
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-xl p-2 shadow-xl">
                  <div className="px-3 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user?.company_name || 'AgentConnect'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-2 py-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2 uppercase tracking-wide">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <NavLink to="/dashboard/profile" className="flex items-center gap-2">
                      <CircleUser className="h-4 w-4" />
                      {t('navigation.profile')}
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Premium Sidebar */}
        <aside
          className={`flex-shrink-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 ${isRTL ? 'border-l' : 'border-r'} border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 relative ${
            sidebarOpen ? '' : '-ml-64 lg:ml-0'
          } ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
        >
          {/* Decorative gradient line */}
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} bottom-0 w-px bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-pink-500/20`} />

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute ${isRTL ? '-left-3' : '-right-3'} top-6 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
            title={sidebarCollapsed ? t("navigation.expandSidebar") : t("navigation.collapseSidebar")}
          >
            {sidebarCollapsed ? (
              isRTL ? (
                <PanelLeftClose className="h-3.5 w-3.5 scale-x-[-1]" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              )
            ) : (
              isRTL ? (
                <PanelLeftOpen className="h-3.5 w-3.5 scale-x-[-1]" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )
            )}
          </button>

          <nav className={`p-3 h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 ${sidebarCollapsed ? 'items-center' : ''}`}>
            <div className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                // Only show admin items if user is super admin
                if (item.admin && !user?.is_super_admin) return null;

                return (
                  <Permission key={item.url} permission={item.permission}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `relative flex items-center rounded-lg text-[15px] font-medium transition-all duration-200 group ${
                          sidebarCollapsed ? 'justify-center p-2 mx-auto' : 'gap-3 px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`
                      }
                      title={sidebarCollapsed ? t(item.titleKey) : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          {/* Active indicator bar */}
                          {isActive && !sidebarCollapsed && (
                            <span className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full`} />
                          )}
                          <item.icon
                            className={`flex-shrink-0 transition-all duration-200 ${
                              isActive ? 'h-4 w-4' : 'h-4 w-4 group-hover:scale-110'
                            }`}
                          />
                          {!sidebarCollapsed && (
                            <span className="truncate">{t(item.titleKey)}</span>
                          )}
                          {/* Hover tooltip for collapsed state */}
                          {sidebarCollapsed && (
                            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200">
                              {t(item.titleKey)}
                            </span>
                          )}
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
