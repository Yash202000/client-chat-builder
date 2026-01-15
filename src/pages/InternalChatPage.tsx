import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getChannels,
  createChannel,
  getChannelMessages,
  getChannelMembers,
  createChannelMessage,
  uploadFile,
  downloadFile,
  createMessageReply,
  addReaction,
  removeReaction,
} from '@/services/chatService';
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
import { Bot, User, Send, Loader2, Video, Plus, Users, MessageSquare, Search, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import CreateChannelModal from '@/components/CreateChannelModal';
import ManageChannelMembersModal from '@/components/ManageChannelMembersModal';
import FileUpload from '@/components/FileUpload';
import FileAttachment from '@/components/FileAttachment';
import MessageThreadModal from '@/components/MessageThreadModal';
import MessageReactions from '@/components/MessageReactions';
import MentionInput from '@/components/MentionInput';
import MentionText from '@/components/MentionText';
import { SlashCommandInput } from '@/components/SlashCommandInput';
import SearchModal from '@/components/SearchModal';
import IncomingCallModal from '@/components/IncomingCallModal';
import CallingModal from '@/components/CallingModal';
import CallHistory from '@/components/CallHistory';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { convertMentionsToApiFormat } from '@/utils/mentions';
import { getChannelDisplayName, getChannelAvatar, getChannelDescription } from '@/utils/channelUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/hooks/use-websocket';
import { useNotifications } from '@/hooks/useNotifications';
import { BACKEND_URL } from '@/config/env';
import { API_BASE_URL } from '@/config/api';
import { useI18n } from '@/hooks/useI18n';

// Define types for chat data
interface ChatChannel {
  id: number;
  name: string | null;
  description: string | null;
  channel_type: string;
  team_id: number | null;
  creator_id: number | null;
  created_at: string;
  participants: { user_id: number }[];
  messages: ChatMessage[];
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

const InternalChatPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isManageMembersModalOpen, setManageMembersModalOpen] = useState(false);
  const [userPresences, setUserPresences] = useState<UserPresence>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [threadParentMessage, setThreadParentMessage] = useState<ChatMessage | null>(null);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
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
  const [channelSidebarCollapsed, setChannelSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const { showNotification, requestPermission, permission, playCallEndSound } = useNotifications();

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
  } = useQuery<ChatChannel[], Error>({ queryKey: ['chatChannels'], queryFn: getChannels });

  const { data: channelMembers } = useQuery<any[], Error>({
    queryKey: ['channelMembers', selectedChannel?.id],
    queryFn: () => getChannelMembers(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
  });

  // Check for active video call when channel is selected (no polling, only on mount/channel change)
  const { data: activeCallExists } = useQuery<boolean, Error>({
    queryKey: ['activeVideoCall', selectedChannel?.id],
    queryFn: async () => {
      console.log('[Active Call Query] Fetching active call status for channel:', selectedChannel?.id);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/video-calls/channels/${selectedChannel!.id}/active`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[Active Call Query] Active call found:', response.data);
        // If no error, active call exists
        return true;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('[Active Call Query] No active call (404) - returning false');
          // No active call
          return false;
        }
        console.error('[Active Call Query] Error checking active call:', error);
        throw error;
      }
    },
    enabled: !!selectedChannel?.id,
    // No refetchInterval - rely on WebSocket events to invalidate this query
  });

  // Debug: Log activeCallExists value
  useEffect(() => {
    console.log('[Active Call State] activeCallExists changed to:', activeCallExists);
  }, [activeCallExists]);

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
    if (!inputValue.trim() && selectedFiles.length === 0) return;

    let messageContent = inputValue.trim() || '📎 File attachment';

    // Convert mentions from display format (@FirstName) to API format (@user:123)
    if (channelMembers && channelMembers.length > 0) {
      messageContent = convertMentionsToApiFormat(messageContent, channelMembers);
    }

    try {
      // First, create the message
      const newMessage = await createChannelMessage(selectedChannel.id, messageContent);

      // If there are files, upload them and attach to the message
      if (selectedFiles.length > 0) {
        setIsUploadingFiles(true);

        for (const file of selectedFiles) {
          try {
            await uploadFile(file, newMessage.id, selectedChannel.id);
          } catch (error) {
            console.error('Failed to upload file:', error);
            toast({
              title: 'Upload failed',
              description: `Failed to upload ${file.name}`,
              variant: 'destructive',
            });
          }
        }

        setIsUploadingFiles(false);
        setSelectedFiles([]);
      }

      // Clear input and refresh messages
      setInputValue('');
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
    setThreadParentMessage(message);
    setIsThreadModalOpen(true);
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

  const handleVideoCallAction = () => {
    if (!selectedChannel?.id) return;

    if (activeCallExists) {
      // Join existing call
      joinVideoCallMutation.mutate(selectedChannel.id);
    } else {
      // Initiate new call
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
    // Update URL parameter to keep it in sync
    setSearchParams({ channelId: channel.id.toString() });
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
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl blur-xl opacity-40 animate-pulse" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading channels...</p>
        </div>
      </div>
    );
  if (channelsError)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-rose-50/30 dark:from-slate-900 dark:via-red-950/20 dark:to-rose-950/20" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-red-200/80 dark:border-red-800/60 shadow-xl shadow-red-500/10 max-w-md">
          <div className="h-14 w-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg">{t('teamChat.error')}</p>
          <p className="text-sm text-red-500 dark:text-red-400 mt-2">{channelsError.message}</p>
        </div>
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-indigo-950/20 text-gray-800 dark:text-gray-200 font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Left Sidebar: Channel List */}
        <Card className={cn(
          "flex-shrink-0 border-r border-slate-200/80 dark:border-slate-700/60 rounded-none bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl shadow-purple-500/5 flex flex-col h-full relative transition-all duration-300",
          channelSidebarCollapsed ? "w-20" : "w-80"
        )}>
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setChannelSidebarCollapsed(!channelSidebarCollapsed)}
            className={cn(
              "absolute -right-3.5 top-8 z-20 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full p-2 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 transform hover:scale-110 group ring-4 ring-white dark:ring-slate-800",
              isRTL && "-left-3.5 -right-auto"
            )}
            title={channelSidebarCollapsed ? t("navigation.expandSidebar") : t("navigation.collapseSidebar")}
          >
            {channelSidebarCollapsed ? (
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

          <CardHeader className={cn(
            "flex flex-row items-center justify-between p-5 pb-4 border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-slate-50/80 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-slate-800/50 flex-shrink-0",
            channelSidebarCollapsed && "justify-center p-3"
          )}>
            {!channelSidebarCollapsed && (
              <CardTitle className="text-xl font-bold dark:text-white flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-md opacity-40" />
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t('teamChat.channels')}</span>
              </CardTitle>
            )}
            {channelSidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreateChannelModalOpen(true)}
                    className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                  >
                    <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t('teamChat.createChannel')}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreateChannelModalOpen(true)}
                    className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                  >
                    <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('teamChat.createChannel')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {channels?.length === 0 ? (
                <div className={cn(
                  "flex flex-col items-center justify-center py-12",
                  channelSidebarCollapsed ? "px-2" : "px-4"
                )}>
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl blur-lg opacity-30" />
                    <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-lg">
                      <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                    </div>
                  </div>
                  {!channelSidebarCollapsed && (
                    <>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">{t('teamChat.noChannels')}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1">Create a channel to start chatting</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {channels?.map((channel) => {
                    const displayName = getChannelDisplayName(channel, user?.id);
                    const avatar = getChannelAvatar(channel, user?.id);
                    const description = getChannelDescription(channel, user?.id);

                    return (
                      <Tooltip key={channel.id}>
                        <TooltipTrigger asChild>
                          <div
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className={cn(
                              'flex items-center cursor-pointer transition-all duration-200 rounded-xl mx-1',
                              channelSidebarCollapsed ? 'p-2 justify-center' : 'p-3',
                              selectedChannel?.id === channel.id
                                ? 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 shadow-md shadow-purple-500/10 ring-1 ring-purple-200 dark:ring-purple-700'
                                : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/50'
                            )}
                            onClick={() => handleChannelSelect(channel)}
                          >
                            <div className="relative">
                              <Avatar className={cn(
                                "ring-2 ring-white dark:ring-slate-700 shadow-sm",
                                channelSidebarCollapsed ? "h-10 w-10" : "h-11 w-11",
                                !channelSidebarCollapsed && (isRTL ? "ml-3" : "mr-3")
                              )}>
                                {avatar.url && <AvatarImage src={avatar.url} />}
                                <AvatarFallback className={cn(
                                  "font-bold text-lg text-white",
                                  avatar.isUser ? "bg-gradient-to-br from-blue-400 to-purple-500" : "bg-gradient-to-br from-purple-500 to-indigo-600"
                                )}>
                                  {avatar.fallback}
                                </AvatarFallback>
                              </Avatar>
                              {selectedChannel?.id === channel.id && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                              )}
                            </div>
                            {!channelSidebarCollapsed && (
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-semibold text-sm truncate",
                                  selectedChannel?.id === channel.id
                                    ? "text-purple-700 dark:text-purple-300"
                                    : "text-slate-700 dark:text-white"
                                )}>{displayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {description}
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        {channelSidebarCollapsed && (
                          <TooltipContent side="right" className="rounded-xl">
                            <div>
                              <p className="font-semibold">{displayName}</p>
                              <p className="text-xs text-slate-400">{description}</p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl h-full overflow-hidden">
          {selectedChannel ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/30 dark:from-slate-800 dark:via-purple-900/20 dark:to-indigo-900/20 shadow-sm flex-shrink-0">
                <div className="flex-1">
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {(() => {
                      const avatar = getChannelAvatar(selectedChannel, user?.id);
                      return (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl blur-md opacity-30" />
                          <Avatar className="relative h-14 w-14 ring-3 ring-white dark:ring-slate-700 shadow-lg">
                            {avatar.url && <AvatarImage src={avatar.url} />}
                            <AvatarFallback className={cn(
                              "font-bold text-xl text-white",
                              avatar.isUser ? "bg-gradient-to-br from-blue-400 to-purple-500" : "bg-gradient-to-br from-purple-500 to-indigo-600"
                            )}>
                              {avatar.fallback}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      );
                    })()}
                    <div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {getChannelDisplayName(selectedChannel, user?.id)}
                      </CardTitle>
                      <div className={`flex items-center mt-2 gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex ${isRTL ? 'space-x-reverse' : ''} -space-x-2 overflow-hidden`}>
                          {channelMembers?.slice(0, 5).map((member: any, index: number) => (
                            <Avatar key={member?.id || `member-${index}`} className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm">
                              <AvatarImage src={member?.profile_picture_url} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white font-medium">
                                {member?.first_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 text-purple-700 dark:text-purple-300 font-semibold shadow-sm">
                          {channelMembers?.length} {channelMembers?.length === 1 ? t('teamChat.member') : t('teamChat.members')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSearchModalOpen(true)}
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/30 dark:border-slate-600 dark:text-white rounded-xl h-10 w-10 border-slate-200/80 transition-colors"
                      >
                        <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl">
                      <p>Search Messages</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCallHistoryOpen(true)}
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/30 dark:border-slate-600 dark:text-white rounded-xl h-10 w-10 border-slate-200/80 transition-colors"
                      >
                        <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl">
                      <p>Call History</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setManageMembersModalOpen(true)}
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/30 dark:border-slate-600 dark:text-white rounded-xl h-10 w-10 border-slate-200/80 transition-colors"
                      >
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl">
                      <p>{t('teamChat.manageMembers')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleVideoCallAction}
                        disabled={initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl w-11 h-11 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all"
                      >
                        {(initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading) ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl">
                      <p>
                        {(() => {
                          const text = activeCallExists === true ? t('teamChat.joinCall') : t('teamChat.startCall');
                          console.log('[Tooltip Render] activeCallExists:', activeCallExists, '-> showing:', text);
                          return text;
                        })()}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 min-h-0">
                <ScrollArea className="flex-1 pr-4 h-full">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-lg opacity-30 animate-pulse" />
                            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                              <Loader2 className="h-7 w-7 animate-spin text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('teamChat.loadingMessages')}</p>
                        </div>
                      </div>
                    ) : messagesError ? (
                      <div className="flex justify-center items-center h-full py-20">
                        <div className="text-center p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200/80 dark:border-red-800/60 shadow-lg shadow-red-500/10">
                          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="h-6 w-6 text-red-500 dark:text-red-400" />
                          </div>
                          <p className="text-red-600 dark:text-red-400 font-semibold">{t('teamChat.errorMessages')}</p>
                          <p className="text-sm text-red-500 dark:text-red-400 mt-1">{messagesError.message}</p>
                        </div>
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="flex justify-center items-center h-full py-20">
                        <div className="text-center">
                          <div className="relative mb-5 mx-auto w-fit">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl blur-lg opacity-30" />
                            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-lg">
                              <Send className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                            </div>
                          </div>
                          <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">{t('teamChat.noMessages')}</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages?.map((msg) => {
                        // Render system messages differently
                        if (msg.extra_data?.is_system) {
                          return (
                            <div key={msg.id} className="flex w-full justify-center my-4 animate-fade-in">
                              <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
                                <span>{msg.content}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Regular message rendering
                        return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex w-full items-end gap-2.5 animate-fade-in',
                            msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.sender_id !== user?.id && (
                            <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-800 flex-shrink-0">
                              <AvatarImage src={msg.sender?.profile_picture_url} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                {msg.sender?.first_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col gap-1 max-w-[70%]">
                            <div
                              className={cn(
                                'p-3.5 rounded-2xl shadow-sm',
                                msg.sender_id === user?.id
                                  ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-br-md'
                                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-slate-200 dark:border-slate-700'
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={cn(
                                  "text-xs font-semibold",
                                  msg.sender_id === user?.id
                                    ? "text-purple-100"
                                    : "text-purple-600 dark:text-purple-400"
                                )}>
                                  {msg.sender_id === user?.id
                                    ? t('teamChat.you')
                                    : msg.sender?.first_name || msg.sender?.email}
                                </span>
                                <span className={cn(
                                  "text-xs",
                                  msg.sender_id === user?.id
                                    ? "text-purple-200"
                                    : "text-slate-400 dark:text-slate-500"
                                )}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className={cn(
                                "prose prose-sm max-w-full",
                                msg.sender_id === user?.id
                                  ? "prose-invert"
                                  : "dark:prose-invert"
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
                                  className={msg.sender_id === user?.id ? "text-white" : ""}
                                />
                              </div>

                              {/* Display attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {msg.attachments.map((attachment) => (
                                    <FileAttachment
                                      key={attachment.id}
                                      attachment={attachment}
                                      onDownload={handleDownloadFile}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="mt-2">
                                  <MessageReactions
                                    reactions={msg.reactions}
                                    currentUserId={user?.id}
                                    onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                    onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                                    users={messages?.reduce((acc, m) => {
                                      acc[m.sender_id] = {
                                        first_name: m.sender.first_name,
                                        email: m.sender.email
                                      };
                                      return acc;
                                    }, {} as any)}
                                  />
                                </div>
                              )}

                              {/* Reply button */}
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenThread(msg)}
                                  className={cn(
                                    "h-7 text-xs gap-1",
                                    msg.sender_id === user?.id
                                      ? "text-purple-100 hover:text-white hover:bg-purple-600/50"
                                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                                  )}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  {msg.reply_count && msg.reply_count > 0 ? (
                                    <span>{msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}</span>
                                  ) : (
                                    <span>Reply</span>
                                  )}
                                </Button>

                                {/* Show emoji picker when no reactions yet */}
                                {(!msg.reactions || msg.reactions.length === 0) && (
                                  <MessageReactions
                                    reactions={[]}
                                    currentUserId={user?.id}
                                    onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                    onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                          {msg.sender_id === user?.id && (
                            <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-800 flex-shrink-0">
                              <AvatarImage src={user?.profile_picture_url} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-white via-purple-50/20 to-indigo-50/20 dark:from-slate-800 dark:via-purple-900/10 dark:to-indigo-900/10 flex-shrink-0">
                <div className="flex flex-col gap-3">
                  {/* File Upload Component */}
                  {selectedFiles.length > 0 && (
                    <div className="px-2 py-2 bg-slate-100/80 dark:bg-slate-900/50 rounded-xl">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                        selectedFiles={selectedFiles}
                        isUploading={isUploadingFiles}
                      />
                    </div>
                  )}

                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* File Attach Button */}
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      selectedFiles={[]}
                      isUploading={isUploadingFiles}
                      multiple={true}
                    />

                    <div className="flex-1 relative">
                      <SlashCommandInput
                        placeholder={t('teamChat.typeMessage')}
                        value={inputValue}
                        onChange={setInputValue}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="w-full px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm hover:shadow-md transition-shadow"
                        disabled={isUploadingFiles}
                      />
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && selectedFiles.length === 0) || isUploadingFiles}
                      className="rounded-xl w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                    >
                      {isUploadingFiles ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900/50 dark:via-purple-950/20 dark:to-indigo-950/20">
              <div className="text-center py-12">
                <div className="relative mb-6 mx-auto w-fit">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
                  <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-xl shadow-purple-500/20">
                    <MessageSquare className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {t('teamChat.selectChannel')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                  {t('teamChat.selectChannelDesc')}
                </p>
                <Button
                  onClick={() => setCreateChannelModalOpen(true)}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setCreateChannelModalOpen(false)}
        onSubmit={handleCreateChannel}
        isLoading={createChannelMutation.isLoading}
      />
      {selectedChannel && (
        <ManageChannelMembersModal
          isOpen={isManageMembersModalOpen}
          onClose={() => setManageMembersModalOpen(false)}
          channelId={selectedChannel.id}
          userPresences={userPresences}
        />
      )}
      {threadParentMessage && (
        <MessageThreadModal
          isOpen={isThreadModalOpen}
          onClose={() => setIsThreadModalOpen(false)}
          parentMessage={threadParentMessage}
          currentUserId={user?.id}
          onSendReply={handleSendReply}
          onDownloadFile={handleDownloadFile}
        />
      )}
      {selectedChannel && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          channelId={selectedChannel.id}
          onMessageClick={(messageId) => {
            // Optionally scroll to message or open thread
            console.log('Navigate to message:', messageId);
          }}
        />
      )}
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

      {/* Call History Sheet */}
      <Sheet open={isCallHistoryOpen} onOpenChange={setIsCallHistoryOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-950/20 border-l border-slate-200/80 dark:border-slate-700/60">
          <SheetHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <SheetTitle className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                <History className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                Call History
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 mt-4 overflow-hidden">
            {selectedChannel && (
              <CallHistory channelId={selectedChannel.id} currentUserId={user?.id} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};

export default InternalChatPage;
