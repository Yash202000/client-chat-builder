
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser, Moon, Sun, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import MessageNotificationPopup, { type MessageNotification } from "@/components/MessageNotificationPopup";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import IncomingCallModal from "@/components/IncomingCallModal";
import { VideoCallModal } from "@/components/VideoCallModal";
import InternalVideoCallModal from "@/components/InternalVideoCallModal";
import EventReminderBanner from "@/components/EventReminderBanner";
import { useVideoCall } from "@/contexts/VideoCallContext";
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

  Sparkles,
  WorkflowIcon as WorkflowIcon,
  Zap,
  Palette,
  Menu,
  X,
  Key,
  BookOpen,
  CreditCard,
  Building,
  Target,
  Send,
  TrendingUp,
  Tag,
  Layers,
  LayoutTemplate,
  Wand2,
  Images,
  Mail,
  Phone,
  PhoneCall,
  Globe,
  Share2,
  PenLine,
  CalendarDays,
  Megaphone,
  Settings2,
  Linkedin,
  Radio,
  Headphones,
  LayoutDashboard,
  Calendar,
  BookUser,
  HardDrive,
  Building2,
  KanbanSquare,
  GitBranch,
  FormInput,
  ClipboardList,
  Ticket,
  LifeBuoy,
  Workflow,
} from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { Permission } from "./Permission";
import { TwilioIcon, ApiIcon } from "@/components/ChannelIcons";
import { TwilioCallProvider } from "@/contexts/TwilioCallContext";
import { CallWidget } from "@/components/CallWidget";
import { PresenceSelector } from "@/components/PresenceSelector";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/hooks/useI18n";
import { useBranding } from "@/hooks/BrandingProvider";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { GreetingBar } from "@/components/GreetingBar";
import { AccentPicker } from "@/components/AccentPicker";
import UserStatusPicker from "@/components/UserStatusPicker";

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

const AppLayout = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth >= 768 && window.innerWidth < 1024);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    tickets: true,
    crm: true,
    campaigns: true,
    marketing: true,
    agents: true,
    ai: true,
    admin: true,
  });
  const { user, logout, refetchUser, authFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const branding = useBranding();
  const { data: systemConfig } = useSystemConfig();
  const isManagedCredentials = systemConfig?.managed_credentials ?? false;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { soundEnabled, enableSound, showNotification } = useNotifications();
  const queryClient = useQueryClient();

  const { data: integrations = [] } = useQuery<{ type: string }[]>({
    queryKey: ['integrations', user?.company_id],
    queryFn: async () => {
      const response = await authFetch('/api/v1/integrations/');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const integrationTypes = new Set(integrations.map(i => i.type));

  const { data: apiIntegrations = [] } = useQuery<{ id: number }[]>({
    queryKey: ['apiIntegrations', user?.company_id],
    queryFn: async () => {
      const response = await authFetch('/api/v1/api-integrations/');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const hasApiIntegration = apiIntegrations.length > 0;

  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([]);

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
    botAgentId?: number;
  } | null>(null);

  // Active calls — stored in context so they persist across navigation
  const { activeCall: activeHandoffCall, startCall: setActiveHandoffCallCtx, endCall: clearActiveHandoffCall, startInternalCall } = useVideoCall();
  const setActiveHandoffCall = (call: { sessionId: string; token: string; livekitUrl: string; botAgentId?: number; } | null) => {
    if (call) {
      setActiveHandoffCallCtx({
        sessionId: call.sessionId,
        userId: 'agent',
        preloadedToken: call.token,
        livekitServerUrl: call.livekitUrl,
        conversationSessionId: call.sessionId,
        conversationAgentId: call.botAgentId,
      });
    } else {
      clearActiveHandoffCall();
    }
  };

  // Global WebSocket connection for company-wide notifications
  const companyWsUrl = user?.company_id
    ? `${BACKEND_URL.replace('http', 'ws')}/ws/${user.company_id}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(companyWsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);

      if (wsMessage.type === 'incoming_call') {
        // Handoff call from customer to agent
        const { agent_id, session_id, customer_name, summary, priority, room_name, livekit_url, agent_token, user_token, bot_agent_id } = wsMessage;
        // Only show notification if this call is for the current user
        if (user && agent_id === user.id) {
          setHandoffCall({
            sessionId: session_id,
            customerName: customer_name || 'Customer',
            summary: summary || 'Customer requested human support',
            priority: priority || 'normal',
            roomName: room_name,
            livekitUrl: livekit_url,
            agentToken: agent_token,
            userToken: user_token,
            botAgentId: bot_agent_id ?? undefined,
          });

          // Show browser notification
          showNotification({
            title: 'Incoming Support Call',
            body: `${customer_name} needs assistance`,
            tag: `handoff-${session_id}`,
          });
        }
      } else if (wsMessage.type === 'video_call_initiated') {
        const { call_id, room_name, livekit_token, livekit_url, channel_id, channel_type, channel_member_ids, caller_id, caller_name, caller_avatar } = wsMessage;
        const isChannelMember = channel_member_ids && user && channel_member_ids.includes(user.id);
        const isDM = channel_type?.toUpperCase() === 'DM' && channel_member_ids?.length === 2;

        if (user && caller_id !== user.id && isChannelMember) {
          if (isDM) {
            // Full ring modal for 1-on-1 calls
            setIncomingCall({
              callId: call_id,
              callerId: caller_id,
              callerName: caller_name || 'Unknown',
              callerAvatar: caller_avatar,
              channelId: channel_id,
              channelName: `Channel ${channel_id}`,
              roomName: room_name,
              livekitToken: livekit_token,
              livekitUrl: livekit_url,
            });
            showNotification({
              title: 'Incoming Video Call',
              body: `${caller_name} is calling...`,
              tag: `call-${call_id}`,
            });
          } else {
            // Gentle toast for team calls
            toast({
              title: `📞 ${caller_name || 'Someone'} started a call`,
              description: `Go to conversations to join`,
              duration: 10000,
            });
            showNotification({
              title: `${caller_name || 'Someone'} started a call`,
              body: `Join the team call in your conversations`,
              tag: `video-call-${channel_id}`,
            });
          }
        }
      } else if (wsMessage.type === 'call_accepted' || wsMessage.type === 'user_joined_call') {
        const { call_id } = wsMessage;
        setIncomingCall((prev) => (prev?.callId === call_id ? null : prev));
      } else if (wsMessage.type === 'call_ended') {
        const { call_id } = wsMessage;
        setIncomingCall((prev) => (prev?.callId === call_id ? null : prev));
      } else if (wsMessage.type === 'call_rejected') {
        // Caller cancelled or callee declined — dismiss ring modal on both sides
        const { call_id } = wsMessage;
        setIncomingCall((prev) => (prev?.callId === call_id ? null : prev));
      } else if (wsMessage.type === 'unread_count_update') {
        const { user_id, unread_count } = wsMessage;

        // Only update if this message is for the current user
        if (user && user_id === user.id) {
          const previousCount = queryClient.getQueryData<number>(['notificationUnreadCount']) || 0;
          queryClient.setQueryData(['notificationUnreadCount'], unread_count);

          // Play notification sound if count increased (new notification)
          if (unread_count > previousCount) {
            showNotification({
              title: 'New Notification',
              body: 'You have a new notification',
              tag: 'notification-update',
            });
          }
        }
      } else if (wsMessage.type === 'presence_update') {
        const { user_id, status } = wsMessage.payload;

        // If the presence update is for the current user, refetch their data
        if (user && user_id === user.id) {
          refetchUser();
        }

        // Invalidate users query to update presence status in TeamManagement and other components
        queryClient.invalidateQueries({ queryKey: ['users'] });

        // Also invalidate channel members if needed
        queryClient.invalidateQueries({ queryKey: ['channelMembers'] });
      } else if (wsMessage.type === 'new_message') {
        const payload = wsMessage.payload;
        if (!payload || payload.is_activity || payload.extra_data?.is_activity) return;
        if (!user || payload.sender_id === user.id) return;
        if (!payload.channel_member_ids?.includes(user.id)) return;
        // Don't show if already viewing this channel
        const params = new URLSearchParams(window.location.search);
        if (location.pathname.includes('/team-chat') && params.get('channelId') === String(payload.channel_id)) return;

        const sender = payload.sender;
        const senderName = sender?.first_name
          ? `${sender.first_name}${sender.last_name ? ' ' + sender.last_name : ''}`
          : sender?.email || 'Someone';
        const channelName = payload.channel_name || `Channel ${payload.channel_id}`;
        const preview = (payload.content || '').replace(/@user:\d+/g, '@').trim().substring(0, 120) || 'Sent an attachment';

        setMessageNotifications((prev) => {
          // Cap at 3 simultaneous notifications
          const next = [...prev.slice(-2), {
            id: `msg-${Date.now()}-${payload.id}`,
            senderId: payload.sender_id,
            senderName,
            senderAvatar: sender?.profile_picture_url,
            channelId: payload.channel_id,
            channelName,
            preview,
          }];
          return next;
        });
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
      }

      // Set status to in_call
      try {
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/presence?presence_status=in_call`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (statusError) {
        console.error('[AppLayout Call] Failed to set in_call status:', statusError);
      }

      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${incomingCall.callId}/accept`;
      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { room_name, livekit_token, livekit_url } = response.data;

      // Clear incoming call state and open floating modal (user stays on current page)
      setIncomingCall(null);
      startInternalCall({
        roomName: room_name,
        livekitToken: livekit_token,
        livekitUrl: livekit_url,
        channelId: incomingCall.channelId ? Number(incomingCall.channelId) : undefined,
        callId: incomingCall.callId ? String(incomingCall.callId) : undefined,
      });
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

      // Clear handoff call state and open floating modal (keeps agent on current page)
      setHandoffCall(null);
      setActiveHandoffCall({
        sessionId: handoffCall.sessionId,
        token: handoffCall.agentToken,
        livekitUrl: handoffCall.livekitUrl,
        botAgentId: handoffCall.botAgentId,
      });

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
        const { dismiss } = toast({
          title: "Enable Notification Sounds?",
          description: "Get audio alerts for mentions, replies, reactions, and calls",
          action: (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  enableSound();
                  localStorage.setItem('notificationSoundPromptDismissed', 'true');
                  dismiss();
                }}
                className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700"
              >
                Enable
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('notificationSoundPromptDismissed', 'true');
                  dismiss();
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

  type SidebarItem = {
    titleKey?: string;
    title?: string;
    url: string;
    icon: React.ElementType;
    permission?: string;
    admin?: boolean;
  };

  type SidebarGroup = {
    id: string;
    label: string;
    labelKey?: string;
    icon: React.ElementType;
    collapsible: boolean;
    items: SidebarItem[];
  };

  const channelInboxItems: SidebarItem[] = [
    ...(integrationTypes.has('whatsapp') ? [{ titleKey: "navigation.whatsappInbox", url: "/dashboard/inbox/whatsapp", icon: WhatsAppIcon }] : []),
    ...(integrationTypes.has('instagram') ? [{ titleKey: "navigation.instagramInbox", url: "/dashboard/inbox/instagram", icon: InstagramIcon }] : []),
    ...(integrationTypes.has('messenger') ? [{ titleKey: "navigation.messengerInbox", url: "/dashboard/inbox/messenger", icon: MessengerIcon }] : []),
    ...(integrationTypes.has('telegram') ? [{ titleKey: "navigation.telegramInbox", url: "/dashboard/inbox/telegram", icon: TelegramIcon }] : []),
    ...(integrationTypes.has('twilio_voice') ? [{ titleKey: "navigation.twilioInbox", url: "/dashboard/inbox/twilio", icon: TwilioIcon }] : []),
    ...(hasApiIntegration ? [{ titleKey: "navigation.apiInbox", url: "/dashboard/inbox/api", icon: ApiIcon }] : []),
  ];

  const sidebarGroups: SidebarGroup[] = [
    // 1. Home — always first
    {
      id: 'home',
      label: 'Home',
      labelKey: 'navigation.home',
      icon: LayoutDashboard,
      collapsible: false,
      items: [
        { titleKey: "navigation.dashboard", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    // 2. Workspace — inbox + voice + team collaboration all in one
    {
      id: 'workspace',
      label: 'Workspace',
      labelKey: 'navigation.workspaceGroup',
      icon: Inbox,
      collapsible: true,
      items: [
        // Inbox
        { titleKey: "navigation.activeClients", url: "/dashboard/conversations", icon: Globe, permission: "page:conversations" },
        ...channelInboxItems,
        ...(integrationTypes.has('gmail') ? [{ titleKey: "navigation.emailInbox", url: "/dashboard/inbox/email", icon: Mail }] : []),
        ...(integrationTypes.has('twilio_voice') ? [{ titleKey: "navigation.smsInbox", url: "/dashboard/inbox/sms", icon: MessageSquare }] : []),
        { titleKey: "navigation.contactHub", url: "/dashboard/contacts", icon: Users },
        // Voice Center
        ...(integrationTypes.has('twilio_voice') ? [
          { titleKey: "navigation.callQueue",        url: "/dashboard/call-queue",     icon: Phone },
          { titleKey: "navigation.callLog",          url: "/dashboard/voice-calls",    icon: PhoneCall },
          { titleKey: "navigation.supervisor",       url: "/dashboard/supervisor",     icon: Radio },
          { titleKey: "navigation.predictiveDialer", url: "/dashboard/dialer",         icon: Headphones },
          { titleKey: "navigation.callAnalytics",    url: "/dashboard/call-analytics", icon: BarChart3 },
        ] : []),
        // Team & files
        { titleKey: "navigation.teamChat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "page:team_chat" },
        { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
        { title: "Drive",    url: "/dashboard/drive",    icon: HardDrive },
      ],
    },
    // 3. Support & Tickets
    {
      id: 'tickets',
      label: 'Support',
      labelKey: 'navigation.supportGroup',
      icon: LifeBuoy,
      collapsible: true,
      items: [
        { title: 'My Tickets',  url: '/dashboard/tickets?assignee=me',         icon: Ticket },
        { title: 'All Projects', url: '/dashboard/tickets',                    icon: KanbanSquare },
        { title: 'Workflows',   url: '/dashboard/tickets/settings/workflows',  icon: Workflow },
      ],
    },
    // 4. CRM — pipeline only
    {
      id: 'crm',
      label: 'CRM',
      labelKey: 'navigation.crmGroup',
      icon: TrendingUp,
      collapsible: true,
      items: [
        { titleKey: "navigation.crm",      url: "/dashboard/crm",              icon: TrendingUp,  permission: "page:crm_dashboard" },
        { titleKey: "navigation.leads",    url: "/dashboard/crm/leads",        icon: Target,      permission: "page:leads" },
        { title: "Deals",                  url: "/dashboard/crm/deals",        icon: KanbanSquare },
        { title: "Companies",              url: "/dashboard/crm/accounts",     icon: Building2 },
        { title: "Booking Links",          url: "/dashboard/crm/booking-links", icon: Calendar },
      ],
    },
    // 5. Campaigns — outreach & engagement
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: Send,
      collapsible: true,
      items: [
        { titleKey: "navigation.campaigns", url: "/dashboard/crm/campaigns",  icon: Send,          permission: "page:campaigns" },
        { title: "Sequences",               url: "/dashboard/crm/sequences",  icon: GitBranch },
        { title: "Forms",                   url: "/dashboard/crm/forms",      icon: FormInput },
        { titleKey: "navigation.tags",      url: "/dashboard/crm/tags",       icon: Tag,           permission: "page:tags" },
        { titleKey: "navigation.segments",  url: "/dashboard/crm/segments",   icon: Layers,        permission: "page:segments" },
        { titleKey: "navigation.templates", url: "/dashboard/crm/templates",  icon: LayoutTemplate, permission: "page:crm_templates" },
      ],
    },
    // 6. Marketing Hub — social media
    {
      id: 'marketing',
      label: 'Marketing Hub',
      icon: Megaphone,
      collapsible: true,
      items: [
        { title: "Social Hub",       url: "/dashboard/social",              icon: Share2 },
        { title: "Post Composer",    url: "/dashboard/social/compose",      icon: PenLine },
        { title: "Trending Posts",   url: "/dashboard/social/trending",     icon: TrendingUp },
        { title: "LinkedIn Leads",   url: "/dashboard/crm/linkedin-leads",  icon: Linkedin },
        { title: "Social Analytics", url: "/dashboard/social/analytics",   icon: BarChart3 },
        { title: "Social Accounts",  url: "/dashboard/social/accounts",    icon: Settings2 },
      ],
    },
    // 7. Builder — agents, knowledge, automation
    {
      id: 'agents',
      label: 'Builder',
      labelKey: 'navigation.builderGroup',
      icon: Bot,
      collapsible: true,
      items: [
        { titleKey: "navigation.agents",          url: "/dashboard/agents",               icon: Bot,          permission: "page:agents" },
        { titleKey: "navigation.widget",          url: "/dashboard/designer",             icon: Palette,      permission: "page:widget_designer" },
        { titleKey: "navigation.content",         url: "/dashboard/knowledge-base/manage", icon: BookOpen,    permission: "page:knowledge_base" },
        { titleKey: "navigation.cms",             url: "/dashboard/cms",                  icon: LayoutTemplate, permission: "page:knowledge_base" },
        { titleKey: "navigation.tools",           url: "/dashboard/tools",                icon: Zap,          permission: "page:tools" },
        { title: "Automations",                   url: "/dashboard/workflows",            icon: WorkflowIcon, permission: "page:workflows" },
        { titleKey: "navigation.messageTemplates", url: "/dashboard/message-templates",   icon: Sparkles,     permission: "page:message_templates" },
      ],
    },
    // 8. AI — on-demand tools
    {
      id: 'ai',
      label: 'AI',
      labelKey: 'navigation.aiGroup',
      icon: Sparkles,
      collapsible: true,
      items: [
        { titleKey: "navigation.aiChat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "page:ai_chat" },
        { titleKey: "navigation.aiTools", url: "/dashboard/ai-tools", icon: Zap, permission: "page:ai_tools" },
        { titleKey: "navigation.aiImageGenerator", url: "/dashboard/ai-image-generator", icon: Wand2, permission: "page:ai_image_generator" },
        { titleKey: "navigation.aiImageGallery", url: "/dashboard/ai-image-gallery", icon: Images, permission: "page:ai_image_gallery" },
      ],
    },
    // 9. Admin — settings, reports, billing (least daily)
    {
      id: 'admin',
      label: 'Admin',
      labelKey: 'navigation.adminGroup',
      icon: Settings,
      collapsible: true,
      items: [
        { titleKey: "navigation.reports", url: "/dashboard/reports", icon: BarChart3, permission: "page:reports" },
        { titleKey: "navigation.auditLogs", url: "/dashboard/audit-logs", icon: ClipboardList, permission: "page:settings" },
        { titleKey: "navigation.teamManagement", url: "/dashboard/team", icon: Users, permission: "page:team_management" },
        { titleKey: "navigation.settings", url: "/dashboard/settings", icon: Settings, permission: "page:settings" },
        { titleKey: "navigation.customFields", url: "/dashboard/settings/custom-fields", icon: FormInput, permission: "page:settings" },
        { titleKey: "navigation.routingRules", url: "/dashboard/settings/routing-rules", icon: GitBranch, permission: "page:settings" },
        { titleKey: "navigation.hierarchy", url: "/dashboard/settings/hierarchy", icon: WorkflowIcon, permission: "page:settings" },
        { titleKey: "navigation.departments", url: "/dashboard/settings/departments", icon: Building2, permission: "page:settings" },
        ...(!isManagedCredentials ? [{ titleKey: "navigation.apiVault", url: "/dashboard/vault", icon: Key, permission: "page:api_vault" }] : []),
        { titleKey: "navigation.billing", url: "/dashboard/billing", icon: CreditCard, permission: "page:billing" },
        { titleKey: "navigation.managePlans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
        { titleKey: "navigation.companies", url: "/dashboard/companies", icon: Building, admin: true },
      ],
    },
  ];

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Breadcrumb — find the best-matching sidebar item for the current path
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    let bestMatch: { groupLabel: string; itemLabel: string; url: string } | null = null;
    for (const group of sidebarGroups) {
      for (const item of group.items) {
        if (path === item.url || path.startsWith(item.url + '/')) {
          if (!bestMatch || item.url.length > bestMatch.url.length) {
            bestMatch = {
              groupLabel: group.labelKey ? t(group.labelKey, { defaultValue: group.label }) : group.label,
              itemLabel: item.title ?? (item.titleKey ? t(item.titleKey) : ''),
              url: item.url,
            };
          }
        }
      }
    }
    return bestMatch;
  }, [location.pathname, sidebarGroups]);

  // Auto-open the group that contains the current route
  useEffect(() => {
    sidebarGroups.forEach(group => {
      if (group.collapsible) {
        const isActive = group.items.some(item => location.pathname.startsWith(item.url));
        if (isActive) {
          setOpenGroups(prev => ({ ...prev, [group.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  // Unlock the global ringtone audio element on first user gesture so it can
  // play later without a gesture (e.g. incoming call after hard refresh + idle)
  useEffect(() => {
    const unlock = () => {
      const el = document.getElementById('global-ringtone') as HTMLAudioElement | null;
      if (!el) return;
      el.volume = 0;
      el.play().then(() => {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      }).catch(() => {});
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── SIDEBAR — full height, aurora atmosphere ─── */}
        <aside
          className={`flex flex-col bg-sidebar transition-all duration-300 overflow-hidden z-40 ${
            sidebarOpen
              ? `fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} translate-x-0 md:relative md:flex-shrink-0`
              : `fixed inset-y-0 ${isRTL ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'} md:relative md:flex-shrink-0 md:translate-x-0`
          } ${sidebarCollapsed ? 'w-[60px]' : 'w-[240px]'}`}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-purple-400/20 blur-[80px]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-300/10 blur-[60px]" />
          </div>
          {/* Right border */}
          <div className={`pointer-events-none absolute ${isRTL ? 'left-0' : 'right-0'} top-0 bottom-0 w-px z-10 bg-gradient-to-b from-white/10 via-white/5 to-transparent`} />

          {/* ── Logo / Brand ── */}
          <div className={`h-11 flex items-center flex-shrink-0 px-3 border-b border-white/10 relative z-10 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt={branding.companyName} className="h-6 w-6 rounded-lg object-contain flex-shrink-0" />
                  ) : (
                    <img src="/icon.png" alt="HeyGenAlly" className="h-6 w-6 rounded-xl object-contain flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-white truncate">{branding.companyName}</span>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex h-6 w-6 rounded-md items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                  title={t('navigation.collapseSidebar')}
                >
                  {isRTL ? <PanelLeftOpen className="h-3.5 w-3.5 scale-x-[-1]" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                </button>
              </>
            ) : (
              <>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.companyName} className="h-6 w-6 rounded-lg object-contain" />
                ) : (
                  <img src="/icon.png" alt="HeyGenAlly" className="h-6 w-6 rounded-xl object-contain" />
                )}
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:flex absolute -right-3 top-3 h-6 w-6 rounded-full bg-violet-900 border border-white/10 items-center justify-center text-white/50 hover:text-white shadow-lg z-10 transition-colors"
                  title={t('navigation.expandSidebar')}
                >
                  {isRTL ? <PanelLeftClose className="h-3 w-3 scale-x-[-1]" /> : <PanelLeftOpen className="h-3 w-3" />}
                </button>
              </>
            )}
          </div>

          {/* ── Nav items ── */}
          <nav className={`sidebar-nav flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-border ${sidebarCollapsed ? 'px-1.5' : 'px-2'}`}>
            {sidebarGroups.map((group, groupIndex) => {
              const userPermissions = user?.role?.permissions?.map((p: any) => p.name) || [];
              const visibleItems = group.items.filter(item => {
                if (item.admin && !user?.is_super_admin) return false;
                if (item.permission && !user?.is_super_admin && !userPermissions.includes(item.permission)) return false;
                return true;
              });
              if (visibleItems.length === 0) return null;

              const isGroupOpen = !group.collapsible || !!openGroups[group.id];

              return (
                <div key={group.id} className={groupIndex > 0 && !sidebarCollapsed ? 'mt-1' : ''}>

                  {/* Group label */}
                  {!sidebarCollapsed && (
                    group.collapsible ? (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 mt-2 rounded-md text-white/35 hover:text-white/70 transition-colors group/label"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-white/25 group-hover/label:bg-white/50 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {group.labelKey ? t(group.labelKey, { defaultValue: group.label }) : group.label}
                          </span>
                        </div>
                        {isGroupOpen
                          ? <ChevronDown className="h-3 w-3 opacity-40" />
                          : <ChevronRight className="h-3 w-3 opacity-40" />
                        }
                      </button>
                    ) : (
                      <div className="px-2 py-1.5 mt-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-white/25" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                          {group.labelKey ? t(group.labelKey, { defaultValue: group.label }) : group.label}
                        </span>
                      </div>
                    )
                  )}

                  {/* Collapsed divider between groups */}
                  {sidebarCollapsed && groupIndex > 0 && (
                    <div className="mx-2 my-1.5 h-px bg-white/10" />
                  )}

                  {(isGroupOpen || sidebarCollapsed) && (
                    <div className={`space-y-0.5 ${!sidebarCollapsed ? 'mt-0.5' : ''}`}>
                      {visibleItems.map((item) => (
                        <NavLink
                          key={item.url}
                          to={item.url}
                          title={sidebarCollapsed ? (item.title ?? t(item.titleKey!)) : undefined}
                          className={({ isActive }) =>
                            `relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 group ${
                              sidebarCollapsed
                                ? 'justify-center p-2'
                                : 'gap-2.5 px-2.5 py-1.5'
                            } ${
                              isActive
                                ? 'bg-gradient-to-r from-white/[0.18] to-white/[0.04] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
                                : 'text-white/55 hover:text-white hover:bg-white/[0.07]'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && !sidebarCollapsed && (
                                <span className={`sidebar-active-bar absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-white shadow-[0_0_8px_rgb(255_255_255/0.7)]`} />
                              )}
                              <item.icon className={`flex-shrink-0 h-3.5 w-3.5 ${isActive ? 'text-white drop-shadow-[0_0_6px_rgb(255_255_255/0.4)]' : ''}`} />
                              {!sidebarCollapsed && (
                                <span className="truncate">{item.title ?? t(item.titleKey!)}</span>
                              )}
                              {sidebarCollapsed && (
                                <span className={`absolute ${isRTL ? 'right-full mr-2' : 'left-full ml-2'} px-2 py-1 bg-popover border border-border text-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md transition-opacity duration-150`}>
                                  {item.title ?? t(item.titleKey!)}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── ⌘K hint (only when sidebar expanded) ── */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="sidebar-search-hint relative z-10"
              title="Open command palette"
            >
              <span>Search anywhere</span>
              <kbd>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl+K'}</kbd>
            </button>
          )}

          {/* ── Powered by ── */}
          {!sidebarCollapsed && (
            <a
              href="https://heygenally.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 flex items-center justify-center gap-1.5 mx-3 mb-3 py-1.5 rounded-md border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] transition-colors group"
            >
              <img src="/icon.png" alt="" className="h-3.5 w-3.5 rounded-sm opacity-50 group-hover:opacity-80 transition-opacity" />
              <span className="text-[10px] font-medium text-white/30 group-hover:text-white/55 transition-colors tracking-wide">
                Powered by <span className="font-semibold">HeyGenAlly</span>
              </span>
            </a>
          )}

        </aside>

        {/* ── Right column: header + main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Slim top bar — right side only, sidebar logo is top-left */}
          <header className="flex-shrink-0 h-11 bg-background border-b border-border/50 flex items-center px-3 justify-between gap-2 relative">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            {/* Left: hamburger (mobile/tablet) + breadcrumb (desktop) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(prev => !prev);
                  } else {
                    setSidebarCollapsed(prev => !prev);
                  }
                }}
                className="lg:hidden h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span className="md:hidden">
                  {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </span>
                <span className="hidden md:block">
                  {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </span>
              </button>

              {/* Mobile brand */}
              <div className="flex items-center gap-2 lg:hidden">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.companyName} className="h-5 w-5 rounded-md object-contain" />
                ) : (
                  <img src="/icon.png" alt="HeyGenAlly" className="h-5 w-5 rounded-lg object-contain" />
                )}
                <span className="text-base font-semibold text-foreground">{branding.companyName}</span>
              </div>

              {/* Desktop breadcrumb */}
              {breadcrumb && (
                <nav className="hidden lg:flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground/60 font-medium">{breadcrumb.groupLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  <span className="text-foreground font-semibold">{breadcrumb.itemLabel}</span>
                </nav>
              )}
            </div>

            {/* Centre: search */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <CommandPaletteTrigger />
            </div>

            {/* Right: utility actions */}
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark'
                  ? <Sun className="h-4 w-4 text-violet-400" />
                  : <Moon className="h-4 w-4" />
                }
              </button>
              {/* User status — visible on all screen sizes */}
              <UserStatusPicker
                user={{
                  ...user,
                  presence_status: user?.presence_status,
                  status_message: (user as any)?.status_message,
                }}
                onStatusChange={() => refetchUser()}
                onLogout={logout}
                compact
              />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background transition-colors">
            <GreetingBar />
            <Outlet />
          </main>
        </div>

      <CreateAgentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

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

      <InternalVideoCallModal />

      {activeHandoffCall && (
        <VideoCallModal
          sessionId={activeHandoffCall.sessionId}
          userId={activeHandoffCall.userId ?? String(user?.id ?? '')}
          preloadedToken={activeHandoffCall.preloadedToken}
          livekitServerUrl={activeHandoffCall.livekitServerUrl}
          conversationSessionId={activeHandoffCall.conversationSessionId}
          conversationAgentId={activeHandoffCall.conversationAgentId}
          onClose={clearActiveHandoffCall}
        />
      )}

      <CallWidget />

      {/* ⌘K — global command palette, always mounted */}
      <CommandPalette />

      {/* Calendar event reminders — shown globally like Teams notifications */}
      <EventReminderBanner />

      {/* Teams-style message notification popups */}
      <MessageNotificationPopup
        notifications={messageNotifications}
        onDismiss={(id) => setMessageNotifications((prev) => prev.filter((n) => n.id !== id))}
        onNavigate={(channelId) => navigate(`/dashboard/team-chat?channelId=${channelId}`)}
      />

      {/* Global ringtone — pre-loaded at app level so it's always ready to play */}
      <audio id="global-ringtone" src="/microsoft_teams_default.mp3" preload="auto" loop style={{ display: 'none' }} />
    </div>
  );
};

const AppLayoutWithProviders = () => (
  <TwilioCallProvider>
    <AppLayout />
  </TwilioCallProvider>
);

export default AppLayoutWithProviders;
