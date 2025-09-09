import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isManageMembersModalOpen, setManageMembersModalOpen] = useState(false);
  const [userPresences, setUserPresences] = useState<UserPresence>({});
  const [activeVideoCallInfo, setActiveVideoCallInfo] = useState<ActiveVideoCall | null>(null);
  const { toast } = useToast();

  const wsUrl = selectedChannel?.id
    ? `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws')}/api/v1/ws/wschat/${selectedChannel.id}?token=${localStorage.getItem('accessToken')}`
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
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'WebSocket Error',
        description: 'Failed to connect to real-time chat. Please refresh.',
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
        title: 'Channel Created',
        description: 'Your new channel has been created successfully.',
      });
    },
    onError: (err) => {
      console.error('Failed to create channel:', err);
      toast({
        title: 'Error',
        description: 'Failed to create channel. Please try again.',
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
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Initiate video call mutation
  const initiateVideoCallMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_URL}/api/v1/video-calls/channels/${channelId}/initiate`;

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
        `/internal-video-call?roomName=${room_name}&livekitToken=${livekit_token}&livekitUrl=${livekit_url}&channelId=${selectedChannel?.id}`
      );
    },
    onError: (err) => {
      console.error('Failed to initiate video call:', err);
      alert('Failed to initiate video call. Please try again.');
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
    if (activeVideoCallInfo) {
      navigate(
        `/internal-video-call?roomName=${activeVideoCallInfo.room_name}&livekitToken=${activeVideoCallInfo.livekit_token}&livekitUrl=${activeVideoCallInfo.livekit_url}&channelId=${selectedChannel?.id}`
      );
    } else if (selectedChannel?.id) {
      initiateVideoCallMutation.mutate(selectedChannel.id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoadingChannels)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (channelsError)
    return (
      <div className="text-red-500 text-center p-4">
        Error loading channels: {channelsError.message}
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Left Sidebar: Channel List */}
        <Card className="w-80 flex-shrink-0 border-r dark:border-gray-700 rounded-none">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-lg">Channels</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setCreateChannelModalOpen(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Channel</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-80px)]">
              {channels?.map((channel) => (
                <div
                  key={channel.id}
                  className={cn(
                    'flex items-center p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800',
                    selectedChannel?.id === channel.id &&
                      'bg-blue-100 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900'
                  )}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {channel.name ? channel.name[0].toUpperCase() : '#'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{channel.name || 'Direct Message'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.description || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b dark:border-gray-700 transition-all duration-300 ease-in-out">
                <div>
                  <CardTitle className="text-2xl font-bold">{selectedChannel.name || 'Direct Message'}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedChannel.description || 'No description'}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {channelMembers?.length}
                    </div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{channelMembers?.length} members</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setManageMembersModalOpen(true)}
                      >
                        <Users className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage Members</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleVideoCallAction}
                        disabled={initiateVideoCallMutation.isLoading}
                      >
                        {initiateVideoCallMutation.isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activeVideoCallInfo ? "Join Call" : "Start Call"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : messagesError ? (
                      <div className="text-red-500 text-center p-4">
                        Error loading messages: {messagesError.message}
                      </div>
                    ) : (
                      messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex w-full',
                            msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] p-3 rounded-lg',
                              msg.sender_id === user?.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={msg.sender?.profile_picture_url} />
                                  <AvatarFallback className="bg-transparent text-xs">
                                    {msg.sender_id === user?.id ? (
                                      <User size={14} />
                                    ) : (
                                      <Bot size={14} />
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-semibold">
                                  {msg.sender_id === user?.id
                                    ? 'You'
                                    : msg.sender?.first_name || msg.sender?.email}
                                </span>
                                <div className={cn('h-2 w-2 rounded-full', userPresences[msg.sender_id] === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="prose prose-sm max-w-full dark:prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <Button
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a channel to start chatting
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
