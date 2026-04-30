import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getChannels,
  getChannelsSummary,
  createChannel,
  renameChannel,
  getChannelMessages,
  getChannelMembers,
  createChannelMessage,
  uploadFile,
  downloadFile,
  createMessageReply,
  addReaction,
  removeReaction,
  pinMessage,
  unpinMessage,
  markChannelRead,
  createScheduledMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  getChannelReadSummary,
  shareDriveFile,
} from '@/services/chatService';
import { listFolder, searchItems } from '@/services/driveService';
import type { DriveItem } from '@/services/driveService';
import { getUsers } from '@/services/userService';
import { joinMeeting } from '@/services/calendarService';
import { useVideoCall } from '@/contexts/VideoCallContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Video, Plus, Users, MessageSquare, Search, History, PanelLeftClose, Clock, X, Pencil, Check, Phone, PhoneCall, Hash, Voicemail, Pin, Forward, MoreHorizontal, BellOff, UserPlus, UserMinus, VideoOff, HardDrive, FileIcon, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import CreateChannelModal from '@/components/CreateChannelModal';
import NewChatModal from '@/components/NewChatModal';
import ManageChannelMembersModal from '@/components/ManageChannelMembersModal';
import FileUpload from '@/components/FileUpload';
import FileAttachment from '@/components/FileAttachment';
import ThreadPanel from '@/components/ThreadPanel';
import MessageReactions from '@/components/MessageReactions';
import MentionInput from '@/components/MentionInput';
import MentionText from '@/components/MentionText';
import { SlashCommandInput } from '@/components/SlashCommandInput';
import SearchModal from '@/components/SearchModal';
import IncomingCallModal from '@/components/IncomingCallModal';
import CallingModal from '@/components/CallingModal';
import CallHistory from '@/components/CallHistory';
import PinnedMessagesPanel from '@/components/PinnedMessagesPanel';
import ForwardMessageModal from '@/components/ForwardMessageModal';
import ScheduleMessagePicker from '@/components/ScheduleMessagePicker';
import { convertMentionsToApiFormat } from '@/utils/mentions';
import { getChannelDisplayName, getChannelAvatar, getChannelDescription } from '@/utils/channelUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/hooks/use-websocket';
import { useNotifications } from '@/hooks/useNotifications';
import { BACKEND_URL } from '@/config/env';
import { API_BASE_URL } from '@/config/api';
import { useI18n } from '@/hooks/useI18n';
import { motion, AnimatePresence } from 'framer-motion';

// Card animation variants (matching ConversationsPage styling)
const channelCardVariants = {
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

// Message animation variants
const messageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.01,
      delayChildren: 0,
    }
  }
};

// Define types for chat data
interface LastMessagePreview {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  is_activity: boolean;
}

interface ChatChannel {
  id: number;
  name: string | null;
  description: string | null;
  channel_type: string;
  team_id: number | null;
  creator_id: number | null;
  created_at: string;
  participants: {
    user_id: number;
    user?: {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
      profile_picture_url?: string;
    };
  }[];
  messages: ChatMessage[];
  last_message?: LastMessagePreview;
  unread_count?: number;
}

interface ChatAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface MessageReaction {
  id: number;
  emoji: string;
  user_id: number;
  message_id: number;
  created_at: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  parent_message_id?: number | null;
  is_activity?: boolean;
  sender: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
    presence_status: string;
  };
  attachments?: ChatAttachment[];
  reactions?: MessageReaction[];
  reply_count?: number;
}

interface UserPresence {
  [key: number]: 'online' | 'offline';
}

interface ActiveVideoCall {
  room_name: string;
  livekit_token: string;
  livekit_url: string;
}

// ── Drive File Picker ──────────────────────────────────────────────────────────
function DriveFilePicker({ search, onSearchChange, onSelect, onClose }: {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (item: DriveItem) => void;
  onClose: () => void;
}) {
  const { data: rootItems = [] } = useQuery({
    queryKey: ['driveRootFiles'],
    queryFn: async () => {
      const res = await listFolder(null);
      return res.items.filter((i: DriveItem) => !i.is_folder);
    },
    staleTime: 30_000,
  });

  const { data: searchRes } = useQuery({
    queryKey: ['driveSearch', search],
    queryFn: () => searchItems(search),
    enabled: search.length >= 2,
    staleTime: 15_000,
  });

  const items: DriveItem[] = search.length >= 2 ? (searchRes?.items ?? []) : rootItems;

  return (
    <div className="mx-3 mb-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <HardDrive className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground">Attach from Drive</span>
        <div className="flex-1" />
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files…"
          className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{search.length >= 2 ? 'No files found' : 'No files in root'}</p>
        ) : (
          items.slice(0, 20).map((item) => (
            <button key={item.id} onClick={() => onSelect(item)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left">
              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                {item.file_size && <p className="text-[10px] text-muted-foreground">{(item.file_size / 1024).toFixed(0)} KB</p>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const InternalChatPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const { startInternalCall } = useVideoCall();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isNewChatModalOpen, setNewChatModalOpen] = useState(false);
  const [isRenamingChannel, setIsRenamingChannel] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isManageMembersModalOpen, setManageMembersModalOpen] = useState(false);
  const [userPresences, setUserPresences] = useState<UserPresence>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [driveAttachments, setDriveAttachments] = useState<DriveItem[]>([]);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [drivePickerSearch, setDrivePickerSearch] = useState('');
  const [threadParentMessage, setThreadParentMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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
  const [outgoingCall, setOutgoingCall] = useState<{
    callId: number;
    channelId: number;
    channelName: string;
    roomName: string;
    livekitToken: string;
    livekitUrl: string;
    status: 'calling' | 'ringing' | 'connecting';
  } | null>(null);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isPhoneDirectoryOpen, setIsPhoneDirectoryOpen] = useState(false);
  const [isPinnedPanelOpen, setIsPinnedPanelOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [messageActionMenuId, setMessageActionMenuId] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<string | undefined>(undefined);
  const [userStatusMessage, setUserStatusMessage] = useState<string | undefined>(undefined);

  // Extension configs from localStorage (written by TeamManagement)
  const [extConfigs, setExtConfigs] = useState<Record<number, { ext: string; department: string; directNumber: string; status: string; voicemailEnabled: boolean; forwardTo: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('phone_ext_configs') ?? '{}'); } catch { return {}; }
  });
  const [channelSidebarCollapsed, setChannelSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { showNotification: _showNotification, requestPermission, permission, playCallEndSound } = useNotifications();

  // Suppress notifications when user has DND active
  const showNotification = (opts: Parameters<typeof _showNotification>[0]) => {
    if (userStatus === 'dnd') return;
    _showNotification(opts);
  };

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, []);

  const wsUrl = selectedChannel?.id
    ? `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/wschat/${selectedChannel.id}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);
      if (wsMessage.type === 'new_message') {
        const newMessage = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', selectedChannel!.id], (oldMessages = []) => {
          if (oldMessages.some(msg => msg.id === newMessage.id)) {
            return oldMessages;
          }
          return [...oldMessages, newMessage];
        });

        // If a reply lands for the currently-open thread panel, refresh it live
        if (newMessage.parent_message_id && newMessage.parent_message_id === threadParentMessage?.id) {
          queryClient.invalidateQueries({ queryKey: ['messageReplies', newMessage.parent_message_id] });
        }

        // Activity messages that signal a meeting started — flip button to "Join" instantly
        if ((newMessage.is_activity || newMessage.extra_data?.is_activity) &&
            newMessage.content?.toLowerCase().includes('joined')) {
          queryClient.invalidateQueries({ queryKey: ['activeVideoCall', selectedChannel?.id] });
        }

        // Auto-mark as read if the channel is currently open and message is from someone else
        if (user && newMessage.sender_id !== user.id && selectedChannel?.id) {
          markChannelRead(selectedChannel.id).catch(() => {});
        }

        // Show notification if message mentions current user or is a reply to their message
        if (user && newMessage.sender_id !== user.id) {
          const senderName = newMessage.sender?.first_name || newMessage.sender?.email || 'Someone';

          // Check if current user is mentioned
          const mentionPattern = new RegExp(`@user:${user.id}\\b`);
          if (mentionPattern.test(newMessage.content)) {
            showNotification({
              title: `${senderName} mentioned you`,
              body: newMessage.content.substring(0, 100),
              tag: `mention-${newMessage.id}`,
            });
            // Invalidate notifications to update badge count
            queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
          }

          // Check if it's a reply to current user's message
          if (newMessage.parent_message_id) {
            const oldMessages = queryClient.getQueryData<ChatMessage[]>(['channelMessages', selectedChannel!.id]) || [];
            const parentMessage = oldMessages.find(msg => msg.id === newMessage.parent_message_id);
            if (parentMessage && parentMessage.sender_id === user.id) {
              showNotification({
                title: `${senderName} replied to your message`,
                body: newMessage.content.substring(0, 100),
                tag: `reply-${newMessage.id}`,
              });
              // Invalidate notifications to update badge count
              queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
            }
          }
        }
      } else if (wsMessage.type === 'channel_read') {
        // Someone read the channel — refresh read summary so sender sees double tick immediately
        const { channel_id } = wsMessage.payload;
        queryClient.invalidateQueries({ queryKey: ['channelReadSummary', channel_id] });
      } else if (wsMessage.type === 'message_pinned' || wsMessage.type === 'message_unpinned') {
        queryClient.invalidateQueries({ queryKey: ['pinnedMessages', wsMessage.payload?.channel_id] });
      } else if (wsMessage.type === 'presence_update') {
        const { user_id, status } = wsMessage.payload;
        setUserPresences(prevPresences => ({
          ...prevPresences,
          [user_id]: status,
        }));
      } else if (wsMessage.type === 'reaction_added') {
        const { message_id, reaction } = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', selectedChannel!.id], (oldMessages = []) => {
          return oldMessages.map(msg => {
            if (msg.id === message_id) {
              const existingReactions = msg.reactions || [];
              // Check if reaction already exists
              if (!existingReactions.some(r => r.id === reaction.id)) {
                // Show notification if someone reacted to current user's message
                if (user && msg.sender_id === user.id && reaction.user_id !== user.id) {
                  showNotification({
                    title: 'New reaction',
                    body: `Someone reacted ${reaction.emoji} to your message`,
                    tag: `reaction-${message_id}`,
                  });
                }
                return { ...msg, reactions: [...existingReactions, reaction] };
              }
            }
            return msg;
          });
        });
      } else if (wsMessage.type === 'reaction_removed') {
        const { message_id, user_id, emoji } = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', selectedChannel!.id], (oldMessages = []) => {
          return oldMessages.map(msg => {
            if (msg.id === message_id) {
              const filteredReactions = (msg.reactions || []).filter(
                r => !(r.user_id === user_id && r.emoji === emoji)
              );
              return { ...msg, reactions: filteredReactions };
            }
            return msg;
          });
        });
      } else if (wsMessage.type === 'video_call_initiated') {
        // When a video call is initiated, show incoming call modal
        const { call_id, room_name, livekit_token, livekit_url, channel_id, channel_member_ids, caller_id, caller_name, caller_avatar } = wsMessage;
        console.log('Video call initiated via WebSocket:', { call_id, room_name, livekit_url, caller_id, channel_id, channel_member_ids });

        // Check if current user is a member of this channel
        const isChannelMember = channel_member_ids && user && channel_member_ids.includes(user.id);

        // Only show notification if user is a channel member AND not the caller
        if (user && caller_id !== user.id && isChannelMember) {
          // Look up the actual channel using channel_id from the WebSocket message
          const actualChannel = channels?.find(ch => ch.id === channel_id);
          const channelName = actualChannel ? getChannelDisplayName(actualChannel, user.id) : `Channel ${channel_id}`;

          setIncomingCall({
            callId: call_id,
            callerId: caller_id,
            callerName: caller_name || 'Unknown',
            callerAvatar: caller_avatar,
            channelId: channel_id,
            channelName,
            roomName: room_name,
            livekitToken: livekit_token,
            livekitUrl: livekit_url,
          });

          // Show desktop notification too
          showNotification({
            title: `${caller_name || 'Someone'} is calling`,
            body: `Incoming video call in ${channelName}`,
            tag: `video-call-${channel_id}`,
          });
        } else if (user && !isChannelMember) {
          console.log('[InternalChatPage] Ignoring call - user is not a member of channel', channel_id);
        }

        // Invalidate the active video call query to fetch fresh data with user's own token
        queryClient.invalidateQueries({ queryKey: ['activeVideoCall', channel_id] });
        // Invalidate call history to show latest call
        queryClient.invalidateQueries({ queryKey: ['callHistory', channel_id] });
      } else if (wsMessage.type === 'call_accepted') {
        // Call was accepted by someone
        const { call_id, accepted_by_id, accepted_by_name, room_name, livekit_url, caller_id, channel_id } = wsMessage;
        console.log('Call accepted:', {
          call_id,
          accepted_by_id,
          accepted_by_name,
          room_name,
          livekit_url,
          caller_id,
          outgoingCall,
          currentUserId: user?.id,
          isUserCaller: user?.id === caller_id
        });

        // Check if current user is the caller (either by outgoingCall state or caller_id from event)
        const isUserCaller = (outgoingCall && outgoingCall.callId === call_id) || (user?.id === caller_id);

        if (isUserCaller) {
          console.log('[Call Flow] Caller detected - navigating to video room');

          toast({
            title: 'Call accepted',
            description: `${accepted_by_name} joined the call`,
          });

          // If we have outgoingCall state, use it (has the token already)
          if (outgoingCall && outgoingCall.callId === call_id) {
            console.log('[Call Flow] Using existing outgoingCall state');
            navigate(
              `/internal-video-call?roomName=${encodeURIComponent(outgoingCall.roomName)}&livekitToken=${encodeURIComponent(outgoingCall.livekitToken)}&livekitUrl=${encodeURIComponent(outgoingCall.livekitUrl)}&channelId=${outgoingCall.channelId}&callId=${call_id}`
            );
            setOutgoingCall(null);
          } else {
            // State was lost, but we can recover by joining the call with a new token
            console.log('[Call Flow] outgoingCall state lost - requesting new token via join endpoint');

            const token = localStorage.getItem('accessToken');
            axios.post(
              `${API_BASE_URL}/api/v1/video-calls/channels/${channel_id}/join`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(response => {
              const { room_name: roomName, livekit_token, livekit_url: livekitUrl } = response.data;
              console.log('[Call Flow] Got new token - navigating to video room');
              navigate(
                `/internal-video-call?roomName=${encodeURIComponent(roomName)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekitUrl)}&channelId=${channel_id}&callId=${call_id}`
              );
              setOutgoingCall(null);
            })
            .catch(error => {
              console.error('[Call Flow] Failed to get new token:', error);
              toast({
                title: 'Error',
                description: 'Failed to join call',
                variant: 'destructive'
              });
            });
          }
        } else {
          console.log('[Call Flow] NOT the caller - ignoring accept event');
        }

        // Invalidate active call query
        queryClient.invalidateQueries({ queryKey: ['activeVideoCall', selectedChannel?.id] });
        // Invalidate call history to show latest status
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      } else if (wsMessage.type === 'call_rejected') {
        // Call was rejected
        const { call_id, rejected_by_name } = wsMessage;
        console.log('Call rejected:', { call_id, rejected_by_name });

        // If current user is the caller, show notification
        if (outgoingCall && outgoingCall.callId === call_id) {
          toast({
            title: 'Call declined',
            description: `${rejected_by_name} declined the call`,
            variant: 'destructive',
          });

          // Clear outgoing call state
          setOutgoingCall(null);
        }

        // If current user had incoming call, clear it
        if (incomingCall && incomingCall.callId === call_id) {
          setIncomingCall(null);
        }

        // Invalidate call history to show latest status
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      } else if (wsMessage.type === 'call_missed') {
        // Call timed out
        const { call_id } = wsMessage;
        console.log('Call missed (timeout):', { call_id });

        // If current user is the caller, show notification
        if (outgoingCall && outgoingCall.callId === call_id) {
          toast({
            title: 'No answer',
            description: 'The call was not answered',
          });

          // Clear outgoing call state
          setOutgoingCall(null);
        }

        // If current user had incoming call, clear it
        if (incomingCall && incomingCall.callId === call_id) {
          setIncomingCall(null);
        }

        // Invalidate call history to show latest status
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      } else if (wsMessage.type === 'call_ended') {
        // Call ended
        const { call_id, duration_seconds } = wsMessage;
        console.log('Call ended:', { call_id, duration_seconds });

        // Play call end sound
        playCallEndSound();

        // Clear any call states
        if (outgoingCall && outgoingCall.callId === call_id) {
          setOutgoingCall(null);
        }
        if (incomingCall && incomingCall.callId === call_id) {
          setIncomingCall(null);
        }

        // Invalidate active call query
        queryClient.invalidateQueries({ queryKey: ['activeVideoCall', selectedChannel?.id] });
        // Invalidate call history to show latest status
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      } else if (wsMessage.type === 'user_joined_call') {
        // Additional user joined an active call
        const { call_id, accepted_by_name, participant_count } = wsMessage;
        console.log('User joined call:', { call_id, accepted_by_name, participant_count });

        // Show toast notification (but not if current user is the one who joined)
        if (wsMessage.accepted_by_id !== user?.id) {
          toast({
            title: 'User joined',
            description: `${accepted_by_name} joined the call`,
          });
        }

        // If current user has an incoming call for this call_id, dismiss it since call is now active
        // (other users already started the call)
        if (incomingCall && incomingCall.callId === call_id) {
          console.log('[User Joined] Dismissing incoming call modal - call is now active');
          setIncomingCall(null);
        }

        // Invalidate call history to show updated participant info
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      } else if (wsMessage.type === 'user_left_call') {
        // User left an active call (but call continues)
        const { call_id, left_by_name, participant_count } = wsMessage;
        console.log('User left call:', { call_id, left_by_name, participant_count });

        // Show toast notification (but not if current user is the one who left)
        if (wsMessage.left_by_id !== user?.id) {
          toast({
            title: 'User left',
            description: `${left_by_name} left the call`,
          });
        }

        // Invalidate call history to show updated participant info
        queryClient.invalidateQueries({ queryKey: ['callHistory', selectedChannel?.id] });
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: t('common.error'),
        description: t('teamChat.toasts.websocketError'),
        variant: 'destructive',
      });
    }
  });

  // Fetch channels
  const {
    data: channels,
    isLoading: isLoadingChannels,
    error: channelsError,
  } = useQuery<ChatChannel[], Error>({ queryKey: ['chatChannels'], queryFn: getChannelsSummary, refetchInterval: 10_000 });

  // Fetch all users for phone directory panel
  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: isPhoneDirectoryOpen });

  const { data: channelMembers } = useQuery<any[], Error>({
    queryKey: ['channelMembers', selectedChannel?.id],
    queryFn: () => getChannelMembers(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
  });

  // Check for active video call when channel is selected (no polling, only on mount/channel change)
  type ActiveCallInfo = { room_name: string; livekit_url: string; source: 'channel' | 'calendar'; event_id?: number } | null;
  const { data: activeCallInfo } = useQuery<ActiveCallInfo, Error>({
    queryKey: ['activeVideoCall', selectedChannel?.id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/video-calls/channels/${selectedChannel!.id}/active`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data as ActiveCallInfo;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!selectedChannel?.id,
    refetchInterval: 8000,
    staleTime: 0,
  });
  const activeCallExists = !!activeCallInfo;

  // Fetch read receipts for selected channel
  const { data: readSummary = {} } = useQuery<Record<string, { id: number; first_name?: string; last_name?: string; email: string; profile_picture_url?: string }[]>>({
    queryKey: ['channelReadSummary', selectedChannel?.id],
    queryFn: () => getChannelReadSummary(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
    refetchInterval: 15000, // refresh every 15s to pick up new reads
  });

  // Fetch messages for selected channel
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<ChatMessage[], Error>({
    queryKey: ['channelMessages', selectedChannel?.id],
    queryFn: () => getChannelMessages(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
    onSuccess: (data) => {
      console.log("Messages after successful fetch:", data);
      const presences: UserPresence = {};
      data.forEach(msg => {
        presences[msg.sender.id] = msg.sender.presence_status as 'online' | 'offline';
      });
      setUserPresences(presences);
      scrollToBottom();
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: (channelData: { name: string; description: string }) => createChannel({
      name: channelData.name,
      description: channelData.description,
      channel_type: 'TEAM', // Default to team channel for now
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      setCreateChannelModalOpen(false);
      toast({
        title: t('common.success'),
        description: t('teamChat.toasts.channelCreated'),
      });
    },
    onError: (err) => {
      console.error('Failed to create channel:', err);
      toast({
        title: t('common.error'),
        description: t('teamChat.toasts.channelCreateFailed'),
        variant: 'destructive',
      });
    },
  });

  // New chat / DM creation mutation
  const newChatMutation = useMutation({
    mutationFn: (channelData: { name?: string | null; channel_type: string; member_ids: number[] }) =>
      createChannel(channelData),
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      return newChannel;
    },
    onError: (err) => {
      console.error('Failed to create chat:', err);
      toast({
        title: t('common.error'),
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    },
  });

  // Rename channel mutation
  const renameChannelMutation = useMutation({
    mutationFn: ({ channelId, name }: { channelId: number; name: string }) =>
      renameChannel(channelId, name),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      setSelectedChannel((prev) => prev ? { ...prev, name: updated.name } : prev);
      setIsRenamingChannel(false);
      toast({ title: 'Channel renamed' });
    },
    onError: () => {
      toast({ title: t('common.error'), description: 'Failed to rename channel', variant: 'destructive' });
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: number; content: string }) =>
      createChannelMessage(channelId, content),
    onSuccess: () => {
      // The message will be added via WebSocket, so we don't need to invalidate here.
      // queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel?.id] });
    },
    onError: (err) => {
      console.error('Failed to send message:', err);
      toast({
        title: t('common.error'),
        description: t('teamChat.toasts.messageFailed'),
        variant: 'destructive',
      });
    },
  });

  // Initiate video call mutation (creates new call)
  const initiateVideoCallMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_BASE_URL}/api/v1/video-calls/channels/${channelId}/initiate`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      // Save current presence status before initiating call
      if (user?.presence_status && user.presence_status !== 'in_call') {
        localStorage.setItem('previousPresenceStatus', user.presence_status);
        console.log('[Call] Saved previous status:', user.presence_status);
      }

      // Set status to in_call
      try {
        const token = localStorage.getItem('accessToken');
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/presence?presence_status=in_call`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[Call] Status set to in_call');
      } catch (statusError) {
        console.error('[Call] Failed to set in_call status:', statusError);
      }

      // Don't navigate immediately - show calling modal first
      const { room_name, livekit_token, livekit_url, call_id } = data;
      const channelName = selectedChannel ? getChannelDisplayName(selectedChannel, user?.id) : 'Unknown';

      console.log('[Call Flow] Initiating call - setting outgoingCall state:', {
        call_id,
        room_name,
        channelId: selectedChannel?.id,
        hasToken: !!livekit_token,
        hasUrl: !!livekit_url
      });

      setOutgoingCall({
        callId: call_id,
        channelId: selectedChannel?.id || 0,
        channelName,
        roomName: room_name,
        livekitToken: livekit_token,
        livekitUrl: livekit_url,
        status: 'ringing',
      });
    },
    onError: (err) => {
      console.error('Failed to initiate video call:', err);
      toast({
        title: t('common.error'),
        description: t('teamChat.toasts.videoCallFailed'),
        variant: 'destructive',
      });
    },
  });

  // Join existing video call mutation
  const joinVideoCallMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_BASE_URL}/api/v1/video-calls/channels/${channelId}/join`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      // Save current presence status before joining call
      if (user?.presence_status && user.presence_status !== 'in_call') {
        localStorage.setItem('previousPresenceStatus', user.presence_status);
        console.log('[Call] Saved previous status:', user.presence_status);
      }

      // Set status to in_call
      try {
        const token = localStorage.getItem('accessToken');
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/presence?presence_status=in_call`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[Call] Status set to in_call');
      } catch (statusError) {
        console.error('[Call] Failed to set in_call status:', statusError);
      }

      const { call_id, room_name, livekit_token, livekit_url } = data;
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(room_name)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekit_url)}&channelId=${selectedChannel?.id}&callId=${call_id}`
      );
    },
    onError: (err) => {
      console.error('Failed to join video call:', err);
      toast({
        title: t('common.error'),
        description: t('teamChat.toasts.joinCallFailed'),
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = async () => {
    if (!selectedChannel?.id) return;
    if (!inputValue.trim() && selectedFiles.length === 0 && driveAttachments.length === 0) return;

    let messageContent = inputValue.trim() || '📎 File attachment';

    // Convert mentions from display format (@FirstName) to API format (@user:123)
    if (channelMembers && channelMembers.length > 0) {
      messageContent = convertMentionsToApiFormat(messageContent, channelMembers);
    }

    try {
      // Create message or reply
      const newMessage = replyingTo
        ? await createMessageReply(replyingTo.id, messageContent, selectedChannel.id)
        : await createChannelMessage(selectedChannel.id, messageContent);

      // Upload regular file attachments
      if (selectedFiles.length > 0) {
        setIsUploadingFiles(true);
        for (const file of selectedFiles) {
          try {
            await uploadFile(file, newMessage.id, selectedChannel.id);
          } catch (error) {
            console.error('Failed to upload file:', error);
            toast({ title: 'Upload failed', description: `Failed to upload ${file.name}`, variant: 'destructive' });
          }
        }
        setIsUploadingFiles(false);
        setSelectedFiles([]);
      }

      // Share Drive file attachments (each creates its own message)
      if (driveAttachments.length > 0) {
        for (const item of driveAttachments) {
          try {
            await shareDriveFile(selectedChannel.id, item.id, '');
          } catch (error) {
            console.error('Failed to share Drive file:', error);
          }
        }
        setDriveAttachments([]);
      }

      // Clear input and reply context, refresh messages
      setInputValue('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel.id] });

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      setIsUploadingFiles(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadFile = async (attachment: ChatAttachment) => {
    try {
      const fileKey = attachment.file_url.replace('s3://', '').split('/').slice(1).join('/');
      const blob = await downloadFile(fileKey);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleOpenThread = (message: ChatMessage) => {
    setThreadParentMessage((prev) => prev?.id === message.id ? null : message);
  };

  const handleSendReply = async (content: string, parentMessageId: number) => {
    if (!selectedChannel?.id) return;

    try {
      await createMessageReply(parentMessageId, content, selectedChannel.id);
      // Refresh messages to update reply count
      queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel.id] });
    } catch (error) {
      console.error('Failed to send reply:', error);
      throw error;
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      // Real-time update via WebSocket, but also refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel?.id] });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveReaction = async (messageId: number, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
      // Real-time update via WebSocket, but also refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel?.id] });
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive',
      });
    }
  };

  const handleCreateChannel = (name: string, description: string) => {
    createChannelMutation.mutate({ name, description });
  };

  const handleVideoCallAction = async () => {
    if (!selectedChannel?.id) return;

    if (activeCallInfo?.source === 'calendar' && activeCallInfo.event_id) {
      // Calendar meeting already running — join it via the calendar flow
      try {
        const result = await joinMeeting(activeCallInfo.event_id);
        startInternalCall({
          roomName: result.room_name,
          livekitToken: result.token,
          livekitUrl: result.livekit_url,
          channelId: result.channel_id,
          eventId: activeCallInfo.event_id,
        });
      } catch { /* silently fail */ }
    } else if (activeCallInfo?.source === 'channel') {
      // Direct channel call already running — join it
      joinVideoCallMutation.mutate(selectedChannel.id);
    } else {
      // No active call — start a new channel call
      initiateVideoCallMutation.mutate(selectedChannel.id);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      const token = localStorage.getItem('accessToken');

      // Save current presence status before joining call
      if (user?.presence_status && user.presence_status !== 'in_call') {
        localStorage.setItem('previousPresenceStatus', user.presence_status);
        console.log('[Call] Saved previous status:', user.presence_status);
      }

      // Set status to in_call
      try {
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/presence?presence_status=in_call`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[Call] Status set to in_call');
      } catch (statusError) {
        console.error('[Call] Failed to set in_call status:', statusError);
      }

      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${incomingCall.callId}/accept`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { room_name, livekit_token, livekit_url } = response.data;

      // Navigate to video call page
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(room_name)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekit_url)}&channelId=${incomingCall.channelId}&callId=${incomingCall.callId}`
      );

      // Clear incoming call state
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to accept call',
        variant: 'destructive',
      });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;

    // Play call end sound
    playCallEndSound();

    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${incomingCall.callId}/reject`;

      await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Clear incoming call state
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
      // Still clear the modal even if API call fails
      setIncomingCall(null);
    }
  };

  const handleCancelOutgoingCall = async () => {
    if (!outgoingCall) return;

    // Play call end sound
    playCallEndSound();

    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_BASE_URL}/api/v1/video-calls/${outgoingCall.callId}/reject`;

      await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Clear outgoing call state
      setOutgoingCall(null);

      toast({
        title: 'Call cancelled',
        description: 'The call has been cancelled',
      });
    } catch (error) {
      console.error('Failed to cancel call:', error);
      // Still clear the modal even if API call fails
      setOutgoingCall(null);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to change channel and update URL
  const handleChannelSelect = (channel: ChatChannel) => {
    console.log('[Channel Select] Changing to channel:', channel.id);
    setSelectedChannel(channel);
    setIsRenamingChannel(false);
    setIsPinnedPanelOpen(false);
    // Update URL parameter to keep it in sync
    setSearchParams({ channelId: channel.id.toString() });
    // Mark channel as read, then refresh the read summary
    markChannelRead(channel.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['channelReadSummary', channel.id] });
        queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      })
      .catch(() => {});
  };

  // Auto-select channel from URL params (e.g., when returning from video call)
  useEffect(() => {
    const channelIdParam = searchParams.get('channelId');
    console.log('[URL Sync] Checking URL param:', channelIdParam, 'Current channel:', selectedChannel?.id);

    if (channelIdParam && channels) {
      const channelToSelect = channels.find(ch => ch.id === Number(channelIdParam));
      if (channelToSelect && (!selectedChannel || selectedChannel.id !== channelToSelect.id)) {
        console.log('[URL Sync] Switching to channel from URL:', channelToSelect.id);
        setSelectedChannel(channelToSelect);
      } else {
        console.log('[URL Sync] No channel switch needed');
      }
    }
  }, [searchParams, channels, selectedChannel]);

  if (isLoadingChannels)
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading channels…</p>
        </div>
      </div>
    );
  if (channelsError)
    return (
      <div className="flex justify-center items-center h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center p-8 bg-card rounded-xl border border-border max-w-sm">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">{t('teamChat.error')}</p>
          <p className="text-sm text-muted-foreground mt-1">{channelsError.message}</p>
        </div>
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-full bg-background overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div className={cn(
          'flex-shrink-0 flex flex-col h-full bg-card border-r border-border transition-all duration-300 relative',
          channelSidebarCollapsed ? 'w-[52px]' : 'w-64'
        )}>
          {/* Header */}
          <div className={cn(
            'flex-shrink-0 flex items-center border-b border-border h-[52px]',
            channelSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
          )}>
            {!channelSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{t('teamChat.channels')}</span>
              </div>
            )}
            <div className={cn('flex items-center gap-1', channelSidebarCollapsed && 'flex-col gap-1.5 py-2')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setNewChatModalOpen(true)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}><p>New chat</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setChannelSidebarCollapsed(!channelSidebarCollapsed)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <motion.div animate={{ rotate: channelSidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    </motion.div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'}>
                  <p>{channelSidebarCollapsed ? t('conversations.expandSidebar') : t('conversations.collapseSidebar')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Channel list */}
          <ScrollArea className="flex-1">
            <div className={cn('py-2', channelSidebarCollapsed ? 'px-1.5' : 'px-2')}>
              {/* Group channels */}
              {!channelSidebarCollapsed && channels?.some(c => c.channel_type?.toUpperCase() !== 'DM') && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 mb-1 mt-1">
                  Channels
                </p>
              )}
              {channels?.filter(c => c.channel_type?.toUpperCase() !== 'DM').map((channel) => {
                const displayName = getChannelDisplayName(channel, user?.id);
                const avatar = getChannelAvatar(channel, user?.id);
                const isSelected = selectedChannel?.id === channel.id;
                const unread = (channel.unread_count ?? 0) > 0 && !isSelected;
                const lastMsg = channel.last_message;
                return (
                  <Tooltip key={channel.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChannelSelect(channel)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-lg text-left transition-all duration-150 relative group',
                          channelSidebarCollapsed ? 'p-1.5 justify-center' : 'px-2 py-2',
                          isSelected
                            ? 'bg-primary/10 text-foreground'
                            : unread
                            ? 'bg-muted/60 text-foreground hover:bg-muted'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {isSelected && (
                          <span className={cn('absolute inset-y-1 w-0.5 bg-primary rounded-full', isRTL ? 'right-0' : 'left-0')} />
                        )}
                        {/* Avatar */}
                        {(avatar as any).isMeeting ? (
                          <div className={cn('flex-shrink-0 flex items-center justify-center rounded-lg', channelSidebarCollapsed ? 'h-8 w-8' : 'h-8 w-8', isSelected ? 'bg-primary/20' : 'bg-muted')}>
                            <Video className={cn('w-3.5 h-3.5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                          </div>
                        ) : (
                          <Avatar className="flex-shrink-0 h-8 w-8">
                            {avatar.url && <AvatarImage src={avatar.url} />}
                            <AvatarFallback className={cn('text-xs font-semibold', isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                              {avatar.fallback}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {/* Text content */}
                        {!channelSidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn('text-[13px] truncate leading-tight', unread ? 'font-semibold text-foreground' : 'font-medium')}>
                                {displayName}
                              </span>
                              {lastMsg && (
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              {lastMsg ? (
                                <span className={cn('text-[11px] truncate', unread ? 'text-foreground/80' : 'text-muted-foreground')}>
                                  {lastMsg.is_activity ? lastMsg.content : `${lastMsg.sender_name}: ${lastMsg.content}`}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/50 italic">No messages yet</span>
                              )}
                              {unread && (
                                <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                                  {(channel.unread_count ?? 0) > 99 ? '99+' : channel.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Collapsed: unread dot */}
                        {channelSidebarCollapsed && unread && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    {channelSidebarCollapsed && (
                      <TooltipContent side={isRTL ? 'left' : 'right'}>
                        <p className="font-medium">{displayName}</p>
                        {(channel.unread_count ?? 0) > 0 && <p className="text-xs text-muted-foreground">{channel.unread_count} unread</p>}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}

              {/* DM channels */}
              {!channelSidebarCollapsed && channels?.some(c => c.channel_type?.toUpperCase() === 'DM') && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 mb-1 mt-3">
                  Direct Messages
                </p>
              )}
              {channels?.filter(c => c.channel_type?.toUpperCase() === 'DM').map((channel) => {
                const displayName = getChannelDisplayName(channel, user?.id);
                const avatar = getChannelAvatar(channel, user?.id);
                const isSelected = selectedChannel?.id === channel.id;
                const otherUser = channel.participants?.find(p => p.user_id !== user?.id)?.user;
                const isOnline = otherUser && userPresences[otherUser.id] === 'online';
                const unread = (channel.unread_count ?? 0) > 0 && !isSelected;
                const lastMsg = channel.last_message;
                return (
                  <Tooltip key={channel.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChannelSelect(channel)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-lg text-left transition-all duration-150 relative',
                          channelSidebarCollapsed ? 'p-1.5 justify-center' : 'px-2 py-2',
                          isSelected
                            ? 'bg-primary/10 text-foreground'
                            : unread
                            ? 'bg-muted/60 text-foreground hover:bg-muted'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {isSelected && (
                          <span className={cn('absolute inset-y-1 w-0.5 bg-primary rounded-full', isRTL ? 'right-0' : 'left-0')} />
                        )}
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            {avatar.url && <AvatarImage src={avatar.url} />}
                            <AvatarFallback className={cn('text-xs font-semibold', isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                              {avatar.fallback}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />}
                        </div>
                        {!channelSidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={cn('text-[13px] truncate leading-tight', unread ? 'font-semibold text-foreground' : 'font-medium')}>
                                {displayName}
                              </span>
                              {lastMsg && (
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              {lastMsg ? (
                                <span className={cn('text-[11px] truncate', unread ? 'text-foreground/80' : 'text-muted-foreground')}>
                                  {lastMsg.is_activity ? lastMsg.content : lastMsg.content}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/50 italic">No messages yet</span>
                              )}
                              {unread && (
                                <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                                  {(channel.unread_count ?? 0) > 99 ? '99+' : channel.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {channelSidebarCollapsed && unread && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    {channelSidebarCollapsed && (
                      <TooltipContent side={isRTL ? 'left' : 'right'}>
                        <p className="font-medium">{displayName}</p>
                        {(channel.unread_count ?? 0) > 0 && <p className="text-xs text-muted-foreground">{channel.unread_count} unread</p>}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}

              {channels?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  {!channelSidebarCollapsed && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground">{t('teamChat.noChannels')}</p>
                      <button
                        onClick={() => setCreateChannelModalOpen(true)}
                        className="mt-3 text-xs text-primary hover:underline"
                      >
                        Create one
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

        </div>

        {/* ── MAIN CHAT AREA ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {selectedChannel ? (
            <>
              {/* Header */}
              <div className={cn(
                'flex-shrink-0 flex items-center justify-between h-[52px] border-b border-border px-4',
                isRTL ? 'flex-row-reverse' : ''
              )}>
                {/* Left: channel info */}
                <div className={cn('flex items-center gap-3 min-w-0', isRTL ? 'flex-row-reverse' : '')}>
                  {(() => {
                    const avatar = getChannelAvatar(selectedChannel, user?.id);
                    if ((avatar as any).isMeeting) {
                      return (
                        <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                      );
                    }
                    return (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {avatar.url && <AvatarImage src={avatar.url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {avatar.fallback}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className={cn('flex items-center gap-1.5', isRTL ? 'flex-row-reverse' : '')}>
                      {isRenamingChannel && selectedChannel.channel_type?.toUpperCase() !== 'DM' ? (
                        <>
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && renameValue.trim()) {
                                renameChannelMutation.mutate({ channelId: selectedChannel.id, name: renameValue.trim() });
                              } else if (e.key === 'Escape') {
                                setIsRenamingChannel(false);
                              }
                            }}
                            className="text-sm font-semibold text-foreground bg-muted border border-border rounded-md px-2 py-0.5 outline-none focus:border-primary w-40"
                          />
                          <button
                            disabled={!renameValue.trim() || renameChannelMutation.isLoading}
                            onClick={() => renameChannelMutation.mutate({ channelId: selectedChannel.id, name: renameValue.trim() })}
                            className="h-6 w-6 rounded flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40 transition-colors"
                          >
                            {renameChannelMutation.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setIsRenamingChannel(false)}
                            className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <h2 className="text-sm font-semibold text-foreground truncate">
                            {selectedChannel.channel_type?.toUpperCase() === 'TEAM' ? '# ' : ''}{getChannelDisplayName(selectedChannel, user?.id)}
                          </h2>
                          {selectedChannel.channel_type?.toUpperCase() === 'TEAM' && (
                            <button
                              onClick={() => { setRenameValue(selectedChannel.name || ''); setIsRenamingChannel(true); }}
                              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                              title="Rename channel"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {/* Members row */}
                    <div className={cn('flex items-center gap-2 mt-0.5', isRTL ? 'flex-row-reverse' : '')}>
                      <div className={cn('flex -space-x-1.5', isRTL ? 'space-x-reverse' : '')}>
                        {channelMembers?.slice(0, 4).map((member: any, index: number) => (
                          <Avatar key={member?.id || `m-${index}`} className="h-4 w-4 ring-1 ring-background">
                            <AvatarImage src={member?.profile_picture_url} />
                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                              {member?.first_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {channelMembers?.length} {channelMembers?.length === 1 ? t('teamChat.member') : t('teamChat.members')}
                      </span>
                      {(() => {
                        const onlineCount = channelMembers?.filter((m: any) => userPresences[m?.id] === 'online').length || 0;
                        return onlineCount > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {onlineCount} {t('teamChat.online')}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className={cn('flex items-center gap-1 flex-shrink-0', isRTL ? 'flex-row-reverse' : '')}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsSearchModalOpen(true)}
                        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Search className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Search messages</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                        onClick={() => { setIsPinnedPanelOpen(o => !o); setIsCallHistoryOpen(false); setIsPhoneDirectoryOpen(false); }}
                        className={`h-8 w-8 rounded-md hover:bg-muted ${isPinnedPanelOpen ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Pin className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Pinned messages</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setIsCallHistoryOpen(o => !o); setIsPhoneDirectoryOpen(false); }}
                        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                        <History className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Call history</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setManageMembersModalOpen(true)}
                        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Users className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('teamChat.manageMembers')}</p></TooltipContent>
                  </Tooltip>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleVideoCallAction}
                        disabled={initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading}
                        className={cn(
                          'h-8 px-3 rounded-md text-xs font-medium gap-1.5 transition-all',
                          activeCallExists
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        )}
                      >
                        {(initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Video className="h-3.5 w-3.5" />
                        )}
                        {activeCallExists === true ? t('teamChat.joinCall') : t('teamChat.startCall')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activeCallExists === true ? t('teamChat.joinCall') : t('teamChat.startCall')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full">
                  <div className="px-4 py-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{t('teamChat.loadingMessages')}</p>
                        </div>
                      </div>
                    ) : messagesError ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="text-center p-6 bg-card rounded-xl border border-border max-w-sm">
                          <MessageSquare className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                          <p className="font-semibold text-foreground">{t('teamChat.errorMessages')}</p>
                          <p className="text-sm text-muted-foreground mt-1">{messagesError.message}</p>
                        </div>
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                          <MessageSquare className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{t('teamChat.noMessages')}</p>
                        <p className="text-xs text-muted-foreground mt-1">Send the first message to start the conversation</p>
                      </div>
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-0.5"
                      >
                        {messages?.map((msg, msgIdx) => {
                          const prevMsg = msgIdx > 0 ? messages[msgIdx - 1] : null;
                          const isSameSender = !!(
                            prevMsg &&
                            !prevMsg.is_activity &&
                            !(prevMsg as any).extra_data?.is_activity &&
                            !(prevMsg as any).extra_data?.is_system &&
                            prevMsg.sender_id === msg.sender_id &&
                            !msg.parent_message_id &&
                            (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000
                          );

                          if (msg.is_activity || (msg as any).extra_data?.is_activity) {
                            const c = msg.content.toLowerCase();
                            const Icon = c.includes('joined') ? UserPlus
                              : c.includes('left') ? UserMinus
                              : c.includes('ended') || c.includes('end') ? VideoOff
                              : Video;
                            return (
                              <div key={msg.id} className="flex items-center gap-2 py-0.5 px-1 my-0.5">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                                <span className="text-[12px] text-muted-foreground/70">{msg.content}</span>
                              </div>
                            );
                          }

                          if ((msg as any).extra_data?.is_system) {
                            return (
                              <div key={msg.id} className="flex w-full justify-center my-3">
                                <div className="px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs flex items-center gap-2">
                                  <span>{msg.content}</span>
                                  <span className="opacity-60">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          const isOwn = msg.sender_id === user?.id;
                          return (
                            <motion.div
                              key={msg.id}
                              variants={messageVariants}
                              className={cn(
                                'group flex w-full items-end gap-2.5',
                                isSameSender ? 'py-0' : 'py-0.5',
                                isOwn ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {/* Avatar — other */}
                              {!isOwn && (
                                isSameSender
                                  ? <div className="h-7 w-7 flex-shrink-0" />
                                  : (
                                    <Avatar className="h-7 w-7 flex-shrink-0 self-end">
                                      <AvatarImage src={msg.sender?.profile_picture_url} />
                                      <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                        {msg.sender?.first_name?.[0] || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                  )
                              )}

                              <div className={cn('flex flex-col max-w-[58%]', isOwn ? 'items-end' : 'items-start')}>
                                {/* Name + time above bubble — hidden for grouped messages */}
                                {!isSameSender && (
                                  <div className={cn('flex items-center gap-1.5 mb-0.5 px-1', isOwn ? 'flex-row-reverse' : '')}>
                                    {!isOwn && (
                                      <span className="text-[11px] font-semibold text-muted-foreground">
                                        {msg.sender?.first_name || msg.sender?.email}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-muted-foreground/70">
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}

                                {/* Bubble wrapper — relative so toolbar can float above */}
                                <div className="relative">
                                  {/* Hover toolbar — floats above the bubble (Teams style) */}
                                  <div className={cn(
                                    'absolute -top-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto',
                                    'flex items-center gap-0.5 bg-card border border-border shadow-lg rounded-full px-1.5 py-0.5',
                                    isOwn ? 'right-0' : 'left-0'
                                  )}>
                                    <button
                                      onClick={() => {
                                        setReplyingTo(msg);
                                        setTimeout(() => chatInputAreaRef.current?.querySelector('input')?.focus(), 50);
                                      }}
                                      title="Reply"
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (selectedChannel) pinMessage(selectedChannel.id, msg.id)
                                          .then(() => queryClient.invalidateQueries({ queryKey: ['pinnedMessages', selectedChannel.id] }))
                                          .catch(() => {});
                                      }}
                                      title="Pin"
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-amber-400 hover:bg-muted transition-colors"
                                    >
                                      <Pin className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setForwardingMessage(msg)}
                                      title="Forward"
                                      className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                      <Forward className="h-3.5 w-3.5" />
                                    </button>
                                    <MessageReactions
                                      reactions={[]}
                                      currentUserId={user?.id}
                                      onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                      onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                                    />
                                  </div>

                                  {/* Bubble */}
                                  <div className={cn(
                                    'px-3.5 py-2 text-sm leading-relaxed',
                                    isOwn
                                      ? `bg-primary text-primary-foreground rounded-2xl ${isRTL ? 'rounded-bl-md' : 'rounded-br-md'}`
                                      : `bg-card border border-border text-foreground rounded-2xl ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'}`
                                  )}>
                                    <div className={cn(
                                      'prose prose-sm max-w-full prose-p:my-0.5 prose-p:leading-relaxed',
                                      isOwn ? 'prose-invert' : 'dark:prose-invert'
                                    )}>
                                      <MentionText
                                        content={msg.content}
                                        users={channelMembers?.reduce((acc, member) => {
                                          if (member && member.id) {
                                            acc[member.id] = {
                                              id: member.id,
                                              first_name: member.first_name,
                                              last_name: member.last_name,
                                              email: member.email
                                            };
                                          }
                                          return acc;
                                        }, {} as any) || {}}
                                        className={isOwn ? 'text-primary-foreground' : ''}
                                      />
                                    </div>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                      <div className="mt-2 space-y-1.5">
                                        {msg.attachments.map((attachment) => (
                                          <FileAttachment key={attachment.id} attachment={attachment} onDownload={handleDownloadFile} />
                                        ))}
                                      </div>
                                    )}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                      <div className="mt-1.5">
                                        <MessageReactions
                                          reactions={msg.reactions}
                                          currentUserId={user?.id}
                                          onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                          onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                                          users={messages?.reduce((acc, m) => {
                                            acc[m.sender_id] = { first_name: m.sender.first_name, email: m.sender.email };
                                            return acc;
                                          }, {} as any)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Thread reply count — below bubble */}
                                {msg.reply_count && msg.reply_count > 0 ? (
                                  <button
                                    onClick={() => handleOpenThread(msg)}
                                    className="mt-0.5 px-1.5 h-5 rounded text-[10px] gap-1 flex items-center text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                                  </button>
                                ) : null}

                                {/* Group read receipts — reader avatars below last own message */}
                                {isOwn && selectedChannel?.channel_type?.toUpperCase() !== 'DM' && (() => {
                                  const readers = readSummary[String(msg.id)] ?? [];
                                  const isLastOwn = messages && messages.filter(m => m.sender_id === user?.id).at(-1)?.id === msg.id;
                                  const isRecent = (Date.now() - new Date(msg.created_at).getTime()) < 48 * 60 * 60 * 1000;
                                  if (!isLastOwn || !isRecent || readers.length === 0) return null;
                                  return (
                                    <div className="flex items-center gap-1 mt-1 px-1 justify-end">
                                      <span className="text-[10px] text-muted-foreground/60">Seen</span>
                                      <div className="flex -space-x-1">
                                        {readers.slice(0, 5).map((r) => (
                                          <Tooltip key={r.id}>
                                            <TooltipTrigger asChild>
                                              <Avatar className="h-4 w-4 ring-1 ring-background cursor-default">
                                                {r.profile_picture_url && <AvatarImage src={r.profile_picture_url} />}
                                                <AvatarFallback className="text-[7px] bg-muted text-muted-foreground">
                                                  {(r.first_name?.[0] || r.email[0]).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <p className="text-xs">{r.first_name || r.email}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        ))}
                                        {readers.length > 5 && (
                                          <span className="text-[10px] text-muted-foreground/60 ml-1">+{readers.length - 5}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Tick slot — shows on ALL own messages in DMs (WhatsApp-style) */}
                              {isOwn && (() => {
                                const isDM = selectedChannel?.channel_type?.toUpperCase() === 'DM';
                                if (!isDM) return <div className="h-7 w-7 flex-shrink-0" />;
                                const readers = readSummary[String(msg.id)] ?? [];
                                const isRead = readers.length > 0;
                                return (
                                  <div className="h-7 w-7 flex-shrink-0 self-end flex items-center justify-center">
                                    <AnimatePresence mode="wait" initial={false}>
                                      <motion.span
                                        key={isRead ? 'double' : 'single'}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{ duration: 0.2 }}
                                        title={isRead ? 'Seen' : 'Sent'}
                                        className={cn(
                                          'text-sm font-bold leading-none select-none',
                                          isRead ? 'text-primary' : 'text-muted-foreground/40'
                                        )}
                                      >
                                        {isRead ? '✓✓' : '✓'}
                                      </motion.span>
                                    </AnimatePresence>
                                  </div>
                                );
                              })()}
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* ── Composer ─────────────────────────────────────────────── */}
              <div className="flex-shrink-0 px-3 pb-3 pt-1">
                <div className={cn(
                  'rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-colors',
                  replyingTo && 'border-primary/30'
                )}>
                  {/* Reply bar */}
                  <AnimatePresence>
                    {replyingTo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30"
                      >
                        <div className={cn('flex items-center gap-2 min-w-0', isRTL ? 'flex-row-reverse' : '')}>
                          <div className="w-0.5 h-6 bg-primary rounded-full flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-primary mb-0.5">
                              Replying to {replyingTo.sender?.first_name || replyingTo.sender?.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="ml-3 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="px-3 pt-2">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                        selectedFiles={selectedFiles}
                        isUploading={isUploadingFiles}
                      />
                    </div>
                  )}

                  {/* Drive file attachments preview */}
                  {driveAttachments.length > 0 && (
                    <div className="px-3 pt-2 flex flex-wrap gap-2">
                      {driveAttachments.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs">
                          <HardDrive className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="text-foreground max-w-[140px] truncate">{item.name}</span>
                          <button onClick={() => setDriveAttachments(p => p.filter(d => d.id !== item.id))}
                            className="text-muted-foreground hover:text-foreground ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drive file picker dropdown */}
                  {isDrivePickerOpen && (
                    <DriveFilePicker
                      search={drivePickerSearch}
                      onSearchChange={setDrivePickerSearch}
                      onSelect={(item) => {
                        setDriveAttachments(p => p.some(d => d.id === item.id) ? p : [...p, item]);
                        setIsDrivePickerOpen(false);
                        setDrivePickerSearch('');
                      }}
                      onClose={() => { setIsDrivePickerOpen(false); setDrivePickerSearch(''); }}
                    />
                  )}

                  {/* Input row */}
                  <div className={cn('flex items-center gap-2 px-3 py-2', isRTL ? 'flex-row-reverse' : '')}>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      selectedFiles={[]}
                      isUploading={isUploadingFiles}
                      multiple={true}
                    />
                    {/* Attach from Drive */}
                    <button
                      onClick={() => setIsDrivePickerOpen(p => !p)}
                      title="Attach from Drive"
                      className={cn(
                        'h-7 w-7 flex items-center justify-center rounded-md transition-colors flex-shrink-0',
                        isDrivePickerOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <HardDrive className="h-4 w-4" />
                    </button>
                    <div className="flex-1" ref={chatInputAreaRef}>
                      <SlashCommandInput
                        placeholder={t('teamChat.typeMessage')}
                        value={inputValue}
                        onChange={setInputValue}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0 py-0.5"
                        disabled={isUploadingFiles}
                      />
                    </div>
                    {/* Schedule message */}
                    {inputValue.trim() && (
                      <ScheduleMessagePicker
                        disabled={!inputValue.trim() || isUploadingFiles}
                        onSchedule={async (date) => {
                          if (!selectedChannel?.id || !inputValue.trim()) return;
                          try {
                            await createScheduledMessage(selectedChannel.id, inputValue.trim(), date);
                            setInputValue('');
                            toast({ title: 'Message scheduled', description: `Will send on ${date.toLocaleString()}` });
                          } catch {
                            toast({ title: 'Failed to schedule', variant: 'destructive' });
                          }
                        }}
                      />
                    )}
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && selectedFiles.length === 0 && driveAttachments.length === 0) || isUploadingFiles}
                      className={cn(
                        'h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
                        (inputValue.trim() || selectedFiles.length > 0 || driveAttachments.length > 0)
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                      )}
                    >
                      {isUploadingFiles ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no channel selected */
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{t('teamChat.selectChannel')}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">{t('teamChat.selectChannelDesc')}</p>
                <button
                  onClick={() => setCreateChannelModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Channel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedChannel && (
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            channelId={selectedChannel.id}
            onMessageClick={(messageId, targetChannelId) => {
              if (targetChannelId && targetChannelId !== selectedChannel.id) {
                const ch = channels?.find(c => c.id === targetChannelId);
                if (ch) setSelectedChannel(ch);
              }
              setIsSearchModalOpen(false);
            }}
          />
        )}
        {selectedChannel && (
          <ManageChannelMembersModal
            isOpen={isManageMembersModalOpen}
            onClose={() => setManageMembersModalOpen(false)}
            channelId={selectedChannel.id}
            userPresences={userPresences}
          />
        )}

        {/* ── PHONE DIRECTORY PANEL ────────────────────────────────────────── */}
        <div className={cn(
          'h-full flex-shrink-0 flex flex-col border-l border-border bg-card overflow-hidden transition-all duration-300 ease-in-out',
          isPhoneDirectoryOpen ? 'w-72' : 'w-0 border-l-0'
        )}>
          {isPhoneDirectoryOpen && (
            <>
              <div className="flex items-center justify-between px-4 h-[52px] border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-semibold text-foreground font-display">Phone Directory</span>
                </div>
                <button onClick={() => setIsPhoneDirectoryOpen(false)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const usersWithExt = Object.entries(extConfigs).map(([uid, cfg]) => {
                    const u = allUsers.find(u => u.id === Number(uid));
                    return { userId: Number(uid), cfg, user: u };
                  }).filter(e => e.cfg.ext);

                  if (usersWithExt.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-4 text-center">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                          <Phone className="h-5 w-5 opacity-40" />
                        </div>
                        <p className="text-xs font-medium">No extensions configured</p>
                        <p className="text-[11px] text-muted-foreground/60">Assign extensions in Team Management</p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-border/40 py-1">
                      {usersWithExt.map(({ userId, cfg, user }) => {
                        const name = user ? (`${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email) : `Ext ${cfg.ext}`;
                        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div key={userId} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                            <div className="relative flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-semibold text-violet-400">
                                {initials}
                              </div>
                              <span className="absolute -bottom-1 -right-1 h-4 min-w-4 px-0.5 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white font-mono leading-none">
                                {cfg.ext}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                              <p className="text-[10px] text-muted-foreground">{cfg.department}</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={async () => {
                                    // Find existing DM channel with this user, or create one
                                    let dmChannel = channels?.find(c =>
                                      c.channel_type?.toUpperCase() === 'DM' &&
                                      c.participants?.some(p => p.user_id === userId)
                                    );
                                    if (!dmChannel) {
                                      try {
                                        dmChannel = await newChatMutation.mutateAsync({
                                          channel_type: 'DM',
                                          member_ids: [userId],
                                        });
                                        await queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
                                      } catch {
                                        toast({ title: 'Could not reach user', variant: 'destructive' });
                                        return;
                                      }
                                    }
                                    // Switch to that channel and initiate call
                                    handleChannelSelect(dmChannel);
                                    initiateVideoCallMutation.mutate(dmChannel.id);
                                  }}
                                  className="h-7 w-7 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                >
                                  <PhoneCall className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent><p>Call ext {cfg.ext}</p></TooltipContent>
                            </Tooltip>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        {/* ── PINNED MESSAGES PANEL ────────────────────────────────────────── */}
        {isPinnedPanelOpen && selectedChannel && (
          <PinnedMessagesPanel
            channelId={selectedChannel.id}
            currentUserId={user?.id}
            onClose={() => setIsPinnedPanelOpen(false)}
          />
        )}

        {/* ── THREAD PANEL ─────────────────────────────────────────────────── */}
        <ThreadPanel
          parentMessage={threadParentMessage}
          currentUserId={user?.id}
          onClose={() => setThreadParentMessage(null)}
          onSendReply={handleSendReply}
          onDownloadFile={handleDownloadFile}
        />

        {/* ── CALL HISTORY PANEL ───────────────────────────────────────────── */}
        <div className={cn(
          'h-full flex-shrink-0 flex flex-col border-l border-border bg-card overflow-hidden transition-all duration-300 ease-in-out',
          isCallHistoryOpen ? 'w-72' : 'w-0 border-l-0'
        )}>
          <div className="flex items-center justify-between px-4 h-[52px] border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Call History</span>
            </div>
            <button
              onClick={() => setIsCallHistoryOpen(false)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedChannel && isCallHistoryOpen && (
              <CallHistory channelId={selectedChannel.id} currentUserId={user?.id} />
            )}
          </div>
        </div>
      </div>
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setCreateChannelModalOpen(false)}
        onSubmit={handleCreateChannel}
        isLoading={createChannelMutation.isLoading}
      />
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        currentUserId={user?.id}
        existingChannels={channels || []}
        onOpenChannel={(channelId) => {
          const ch = (channels || []).find((c) => c.id === channelId);
          if (ch) handleChannelSelect(ch);
          // If newly created, wait for query invalidation and then select
          else {
            queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
            setSearchParams({ channelId: channelId.toString() });
          }
        }}
        onCreate={async (channelData) => {
          return await newChatMutation.mutateAsync(channelData);
        }}
        isLoading={newChatMutation.isLoading}
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
      {outgoingCall && (
        <CallingModal
          isOpen={true}
          recipientName={outgoingCall.channelName}
          channelName={selectedChannel?.name}
          onCancel={handleCancelOutgoingCall}
          status={outgoingCall.status}
        />
      )}

      <ForwardMessageModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        channels={channels || []}
        currentUserId={user?.id}
      />

    </TooltipProvider>
  );
};

export default InternalChatPage;
