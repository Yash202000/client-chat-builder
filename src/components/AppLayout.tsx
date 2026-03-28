
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser, Moon, Sun, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Wand2,
  Images,
  Mail,
  Phone,
  Globe,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    inbox: true,
    agents: true,
    admin: true,
    crm: false,
    ai: false,
  });
  const { user, logout, refetchUser, authFetch } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const branding = useBranding();
  const { toast } = useToast();
  const { soundEnabled, enableSound, showNotification } = useNotifications();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  console.log("Logged in user:", user);

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
        const { dismiss } = toast({
          title: "Enable Notification Sounds?",
          description: "Get audio alerts for mentions, replies, reactions, and calls",
          action: (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('[AppLayout] Enable sound button clicked');
                  enableSound();
                  localStorage.setItem('notificationSoundPromptDismissed', 'true');
                  dismiss();
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Enable
              </button>
              <button
                onClick={() => {
                  console.log('[AppLayout] Dismiss sound prompt button clicked');
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
    titleKey: string;
    url: string;
    icon: React.ElementType;
    permission?: string;
    admin?: boolean;
  };

  type SidebarGroup = {
    id: string;
    label: string;
    labelKey: string;
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
    {
      id: 'inbox',
      label: 'Inbox',
      labelKey: 'navigation.inbox',
      icon: Inbox,
      collapsible: true,
      items: [
        { titleKey: "navigation.activeClients", url: "/dashboard/conversations", icon: Globe, permission: "page:conversations" },
        ...channelInboxItems,
        { titleKey: "navigation.emailInbox", url: "/dashboard/inbox/email", icon: Mail },
        { titleKey: "navigation.smsInbox", url: "/dashboard/inbox/sms", icon: MessageSquare },
        { titleKey: "navigation.teamChat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "page:team_chat" },
        { titleKey: "navigation.contactHub", url: "/dashboard/contacts", icon: Users },
        { titleKey: "navigation.aiChat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "page:ai_chat" },
        { titleKey: "navigation.messageTemplates", url: "/dashboard/message-templates", icon: Sparkles, permission: "page:message_templates" },
      ],
    },
    {
      id: 'agents',
      label: 'Builder',
      labelKey: 'navigation.builderGroup',
      icon: Bot,
      collapsible: true,
      items: [
        { titleKey: "navigation.agents", url: "/dashboard/agents", icon: Bot, permission: "page:agents" },
        { titleKey: "navigation.widget", url: "/dashboard/designer", icon: Palette, permission: "page:widget_designer" },
        { titleKey: "navigation.content", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "page:knowledge_base" },
        { titleKey: "navigation.tools", url: "/dashboard/tools", icon: Zap, permission: "page:tools" },
        { titleKey: "navigation.workflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "page:workflows" },
      ],
    },
    {
      id: 'admin',
      label: 'Admin',
      labelKey: 'navigation.adminGroup',
      icon: Settings,
      collapsible: true,
      items: [
        { titleKey: "navigation.teamManagement", url: "/dashboard/team", icon: Users, permission: "page:team_management" },
        { titleKey: "navigation.reports", url: "/dashboard/reports", icon: BarChart3, permission: "page:reports" },
        { titleKey: "navigation.settings", url: "/dashboard/settings", icon: Settings, permission: "page:settings" },
        { titleKey: "navigation.apiVault", url: "/dashboard/vault", icon: Key, permission: "page:api_vault" },
        { titleKey: "navigation.billing", url: "/dashboard/billing", icon: CreditCard, permission: "page:billing" },
        { titleKey: "navigation.voices", url: "/dashboard/voices", icon: Mic, permission: "page:voices" },
        { titleKey: "navigation.managePlans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
        { titleKey: "navigation.companies", url: "/dashboard/companies", icon: Building, admin: true },
      ],
    },
    {
      id: 'crm',
      label: 'CRM',
      labelKey: 'navigation.crmGroup',
      icon: TrendingUp,
      collapsible: true,
      items: [
        { titleKey: "navigation.crm", url: "/dashboard/crm", icon: TrendingUp, permission: "page:crm_dashboard" },
        { titleKey: "navigation.contacts", url: "/dashboard/crm/contacts", icon: Users, permission: "page:contacts" },
        { titleKey: "navigation.leads", url: "/dashboard/crm/leads", icon: Target, permission: "page:leads" },
        { titleKey: "navigation.campaigns", url: "/dashboard/crm/campaigns", icon: Send, permission: "page:campaigns" },
        { titleKey: "navigation.tags", url: "/dashboard/crm/tags", icon: Tag, permission: "page:tags" },
        { titleKey: "navigation.segments", url: "/dashboard/crm/segments", icon: Layers, permission: "page:segments" },
        { titleKey: "navigation.templates", url: "/dashboard/crm/templates", icon: LayoutTemplate, permission: "page:crm_templates" },
      ],
    },
    {
      id: 'ai',
      label: 'AI',
      labelKey: 'navigation.aiGroup',
      icon: Sparkles,
      collapsible: true,
      items: [
        { titleKey: "navigation.aiTools", url: "/dashboard/ai-tools", icon: Zap, permission: "page:ai_tools" },
        { titleKey: "navigation.aiImageGenerator", url: "/dashboard/ai-image-generator", icon: Wand2, permission: "page:ai_image_generator" },
        { titleKey: "navigation.aiImageGallery", url: "/dashboard/ai-image-gallery", icon: Images, permission: "page:ai_image_gallery" },
      ],
    },
  ];

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
                  <img
                    src={branding.logoUrl}
                    alt={branding.companyName}
                    className="relative h-11 w-11 object-contain rounded-xl shadow-lg ring-2 ring-white/50 dark:ring-slate-700/50"
                  />
                </div>
              ) : (
                <div className="relative">
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
                  Connect Smarter
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
                        {user?.company_name || 'HeyGenAlly'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white dark:ring-slate-700">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {/* Online Status Indicator */}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-800 rounded-full shadow-sm ${
                        user?.presence_status === 'online' ? 'bg-emerald-500' :
                        user?.presence_status === 'away' ? 'bg-yellow-400' :
                        user?.presence_status === 'busy' ? 'bg-red-500' :
                        user?.presence_status === 'do_not_disturb' ? 'bg-red-600' :
                        user?.presence_status === 'in_call' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`} />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-xl p-2 shadow-xl border-slate-200/80 dark:border-slate-700/80">
                  <div className="px-3 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user?.company_name || 'HeyGenAlly'}
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
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user?.company_name || 'HeyGenAlly'}
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
          className={`flex-shrink-0 bg-white dark:bg-slate-800 ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-700 shadow-[4px_0_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_16px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 relative ${
            sidebarOpen ? '' : '-ml-64 lg:ml-0'
          } ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
        >
          {/* Decorative gradient line */}
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} bottom-0 w-px bg-gradient-to-b from-blue-500/20 via-indigo-500/20 to-blue-500/20`} />

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
                  <div key={group.id}>
                    {/* Section header — hidden when sidebar is icon-only */}
                    {!sidebarCollapsed && (
                      group.collapsible ? (
                        <button
                          onClick={() => toggleGroup(group.id)}
                          // group header styles change when open vs closed 14
                          className={`w-full flex items-center justify-between px-3 py-2 mt-2 text-[16px] font-semibold transition-colors rounded-md ${
                            isGroupOpen
                              ? 'text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/70'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <group.icon className="h-4 w-4 flex-shrink-0" />
                            {t(group.labelKey, { defaultValue: group.label })}
                          </span>
                          {isGroupOpen
                            ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                            : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                          }
                        </button>
                      ) : (
                        // Non-collapsible group header 14
                        <div className="flex items-center gap-3 px-3 py-2 mt-2 text-[16px] font-semibold text-slate-800 dark:text-slate-100">
                          <group.icon className="h-4 w-4 flex-shrink-0" />
                          {t(group.labelKey, { defaultValue: group.label })}
                        </div>
                      )
                    )}

                    {/* Items — always visible when sidebar is collapsed (icon-only), otherwise respect open state */}
                    {(isGroupOpen || sidebarCollapsed) && (
                      <div className={`space-y-0.5 ${!sidebarCollapsed ? 'mt-1 mx-1 p-1' : ''}`}>
                        {visibleItems.map((item) => (
                          <NavLink
                            key={item.url}
                            to={item.url}
                            className={({ isActive }) =>
                              // Active item has a highlighted background and text, with a vertical indicator bar. In collapsed mode, only icons are shown and the active state is indicated by a subtle background change and the indicator bar. 13
                              `relative flex items-center rounded-lg text-[15px] font-medium transition-all duration-200 group ${
                                sidebarCollapsed ? 'justify-center p-2 mx-auto' : `gap-3 py-1.5 ${isActive ? 'pl-4 pr-3' : 'px-3'}`
                              } ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                              }`
                            }
                            title={sidebarCollapsed ? t(item.titleKey) : undefined}
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && !sidebarCollapsed && (
                                  <span className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-full`} />
                                )}
                                <item.icon className="flex-shrink-0 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                {!sidebarCollapsed && (
                                  <span className="truncate">{t(item.titleKey)}</span>
                                )}
                                {sidebarCollapsed && (
                                  <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200">
                                    {t(item.titleKey)}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}

                    {/* Divider between groups (only in expanded mode) */}
                    {!sidebarCollapsed && groupIndex < sidebarGroups.length - 1 && (
                      <div className="mt-2 h-px bg-slate-200/60 dark:bg-slate-700/40" />
                    )}
                  </div>
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

      {/* Twilio Outbound Call Widget */}
      <CallWidget />
    </div>
  );
};

const AppLayoutWithProviders = () => (
  <TwilioCallProvider>
    <AppLayout />
  </TwilioCallProvider>
);

export default AppLayoutWithProviders;
