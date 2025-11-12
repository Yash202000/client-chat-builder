import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getChannels,
  createChannel,
  getChannelMessages,
  getChannelMembers,
  createChannelMessage,
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
import { Bot, User, Send, Loader2, Video, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import CreateChannelModal from '@/components/CreateChannelModal';
import ManageChannelMembersModal from '@/components/ManageChannelMembersModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/hooks/use-websocket';
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

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
    presence_status: string;
  };
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
  const [searchParams] = useSearchParams();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isManageMembersModalOpen, setManageMembersModalOpen] = useState(false);
  const [userPresences, setUserPresences] = useState<UserPresence>({});
  const { toast } = useToast();

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
      } else if (wsMessage.type === 'presence_update') {
        const { user_id, status } = wsMessage.payload;
        setUserPresences(prevPresences => ({
          ...prevPresences,
          [user_id]: status,
        }));
      } else if (wsMessage.type === 'video_call_initiated') {
        // When a video call is initiated, update the active call info for all users in the channel
        const { room_name, livekit_token, livekit_url } = wsMessage;
        console.log('Video call initiated via WebSocket:', { room_name, livekit_url });

        // Invalidate the active video call query to fetch fresh data with user's own token
        queryClient.invalidateQueries({ queryKey: ['activeVideoCall', selectedChannel?.id] });

        toast({
          title: t('teamChat.toasts.videoCallStarted'),
          description: t('teamChat.toasts.videoCallStartedDesc'),
        });
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
      try {
        const token = localStorage.getItem('accessToken');
        await axios.get(
          `${API_BASE_URL}/api/v1/video-calls/channels/${selectedChannel!.id}/active`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // If no error, active call exists
        return true;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No active call
          return false;
        }
        throw error;
      }
    },
    enabled: !!selectedChannel?.id,
    // No refetchInterval - rely on WebSocket events to invalidate this query
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
    onSuccess: (data) => {
      const { room_name, livekit_token, livekit_url } = data;
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(room_name)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekit_url)}&channelId=${selectedChannel?.id}`
      );
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
    onSuccess: (data) => {
      const { room_name, livekit_token, livekit_url } = data;
      navigate(
        `/internal-video-call?roomName=${encodeURIComponent(room_name)}&livekitToken=${encodeURIComponent(livekit_token)}&livekitUrl=${encodeURIComponent(livekit_url)}&channelId=${selectedChannel?.id}`
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

  const handleSendMessage = () => {
    if (inputValue.trim() && selectedChannel?.id) {
      createMessageMutation.mutate({ channelId: selectedChannel.id, content: inputValue.trim() });
      setInputValue('');
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-select channel from URL params (e.g., when returning from video call)
  useEffect(() => {
    const channelIdParam = searchParams.get('channelId');
    if (channelIdParam && channels) {
      const channelToSelect = channels.find(ch => ch.id === Number(channelIdParam));
      if (channelToSelect && (!selectedChannel || selectedChannel.id !== channelToSelect.id)) {
        setSelectedChannel(channelToSelect);
      }
    }
  }, [searchParams, channels, selectedChannel]);

  if (isLoadingChannels)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (channelsError)
    return (
      <div className="text-red-500 text-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {t('teamChat.error')}: {channelsError.message}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Left Sidebar: Channel List */}
        <Card className="w-80 flex-shrink-0 border-r dark:border-slate-700 rounded-none bg-white dark:bg-slate-800 shadow-lg flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
            <CardTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              {t('teamChat.channels')}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCreateChannelModalOpen(true)}
                  className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full"
                >
                  <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('teamChat.createChannel')}</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {channels?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{t('teamChat.noChannels')}</p>
                </div>
              ) : (
                channels?.map((channel) => (
                  <div
                    key={channel.id}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={cn(
                      'flex items-center p-4 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-all duration-200',
                      selectedChannel?.id === channel.id
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-l-4 border-l-purple-600 dark:border-l-purple-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-4 border-l-transparent'
                    )}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <Avatar className="h-11 w-11 mr-3 ring-2 ring-slate-200 dark:ring-slate-600">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-lg">
                        {channel.name ? channel.name[0].toUpperCase() : '#'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm dark:text-white truncate">{channel.name || t('teamChat.directMessage')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {channel.description || t('teamChat.noDescription')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 h-full overflow-hidden">
          {selectedChannel ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-sm flex-shrink-0">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-purple-200 dark:ring-purple-800">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-lg">
                        {selectedChannel.name ? selectedChannel.name[0].toUpperCase() : '#'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl font-bold dark:text-white">{selectedChannel.name || t('teamChat.directMessage')}</CardTitle>
                      <div className="flex items-center mt-1 gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {channelMembers?.slice(0, 5).map((member: any, index: number) => (
                            <Avatar key={member.user?.id || `member-${index}`} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800">
                              <AvatarImage src={member.user?.profile_picture_url} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                {member.user?.first_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium">
                          {channelMembers?.length} {channelMembers?.length === 1 ? t('teamChat.member') : t('teamChat.members')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setManageMembersModalOpen(true)}
                        className="hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:border-slate-600 dark:text-white rounded-full"
                      >
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('teamChat.manageMembers')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleVideoCallAction}
                        disabled={initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full w-11 h-11 shadow-md hover:shadow-lg transition-all"
                      >
                        {(initiateVideoCallMutation.isLoading || joinVideoCallMutation.isLoading) ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activeCallExists ? t('teamChat.joinCall') : t('teamChat.startCall')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50 min-h-0">
                <ScrollArea className="flex-1 pr-4 h-full">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">{t('teamChat.loadingMessages')}</p>
                        </div>
                      </div>
                    ) : messagesError ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-red-600 dark:text-red-400 font-medium">{t('teamChat.errorMessages')}</p>
                          <p className="text-sm text-red-500 dark:text-red-400 mt-1">{messagesError.message}</p>
                        </div>
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center py-12">
                          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                            <Send className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">{t('teamChat.noMessages')}</p>
                        </div>
                      </div>
                    ) : (
                      messages?.map((msg) => (
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
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
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
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder={t('teamChat.typeMessage')}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 px-5 py-3 rounded-full bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t('teamChat.selectChannel')}</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">{t('teamChat.selectChannelDesc')}</p>
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
    </TooltipProvider>
  );
};

export default InternalChatPage;
