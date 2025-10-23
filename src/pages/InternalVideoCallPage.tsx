
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChannelMessages, createChannelMessage } from '@/services/chatService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, PhoneOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/hooks/use-websocket';
import { getWebSocketUrl } from '@/config/api';
import { BACKEND_URL } from '@/config/env';

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
  };
}

const InternalVideoCallPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const livekitToken = queryParams.get('livekitToken');
  const livekitUrl = queryParams.get('livekitUrl');
  const roomName = queryParams.get('roomName');
  const channelId = queryParams.get('channelId');

  // Debug: Log the parameters
  console.log('Video Call Page Parameters:', {
    livekitToken,
    livekitUrl,
    roomName,
    channelId,
    fullSearch: location.search
  });

  const [isChatOpen, setChatOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRoomReady, setIsRoomReady] = useState(false);

  // Ensure parameters are stable before rendering LiveKitRoom
  useEffect(() => {
    if (livekitToken && livekitUrl && roomName) {
      // Small delay to ensure navigation is complete
      const timer = setTimeout(() => {
        setIsRoomReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [livekitToken, livekitUrl, roomName]);

  const wsUrl = channelId
    ? `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/wschat/${channelId}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);
      if (wsMessage.type === 'new_message') {
        const newMessage = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', channelId], (oldMessages = []) => {
          if (oldMessages.some(msg => msg.id === newMessage.id)) {
            return oldMessages;
          }
          return [...oldMessages, newMessage];
        });
      }
    },
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery<ChatMessage[], Error>({
    queryKey: ['channelMessages', channelId],
    queryFn: () => getChannelMessages(Number(channelId)),
    enabled: !!channelId,
  });

  const createMessageMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: number; content: string }) =>
      createChannelMessage(channelId, content),
    onSuccess: () => {
      // Message will be added via WebSocket
    },
  });

  const handleSendMessage = () => {
    if (inputValue.trim() && channelId) {
      createMessageMutation.mutate({ channelId: Number(channelId), content: inputValue.trim() });
      setInputValue('');
    }
  };

  const handleLeave = () => {
    // Navigate back to the internal chat page with the same channel selected
    navigate(`/dashboard/internal-chat${channelId ? `?channelId=${channelId}` : ''}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!livekitToken || !livekitUrl || !roomName) {
    console.error('Missing required parameters for video call:', { livekitToken: !!livekitToken, livekitUrl: !!livekitUrl, roomName: !!roomName });
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading internal video call...</div>;
  }

  if (!isRoomReady) {
    console.log('Waiting for room to be ready...');
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Connecting to video call...</div>;
  }

  console.log('Rendering LiveKitRoom with:', {
    token: livekitToken.substring(0, 20) + '...',
    serverUrl: livekitUrl,
    roomName
  });

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="flex-1 flex flex-col relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={livekitToken}
          serverUrl={livekitUrl}
          data-lk-theme="default"
          connectOptions={{ autoSubscribe: true }}
          onDisconnected={handleLeave}
          onError={(error) => {
            console.error('LiveKitRoom error:', error);
          }}
          onConnected={() => {
            console.log('LiveKitRoom connected successfully!');
          }}
        >
          <VideoConference />
          <Button 
            onClick={handleLeave} 
            className="absolute top-4 left-4 bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            Leave
          </Button>
        </LiveKitRoom>
      </div>
      {isChatOpen && (
        <div className="w-[350px] bg-gray-900 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Chat</h2>
          </div>
          <ScrollArea className="flex-1 p-4">
            {isLoadingMessages ? (
              <div>Loading messages...</div>
            ) : (
              messages?.map((msg) => (
                <div key={msg.id} className={cn('flex w-full mb-2', msg.sender_id === user?.id ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[85%] p-2 rounded-lg', msg.sender_id === user?.id ? 'bg-blue-600' : 'bg-gray-700')}>
                    <div className="text-xs font-semibold">
                      {msg.sender.first_name || msg.sender.email}
                    </div>
                    <div className="text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="bg-gray-800 border-gray-600"
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <Button 
        onClick={() => setChatOpen(!isChatOpen)} 
        className="absolute top-4 right-4"
        style={{ right: isChatOpen ? '370px' : '1rem' }}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default InternalVideoCallPage;
