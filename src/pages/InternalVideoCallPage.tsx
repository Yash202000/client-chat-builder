
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
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWebSocket } from '@/hooks/use-websocket';
import { getWebSocketUrl, API_BASE_URL } from '@/config/api';
import { BACKEND_URL } from '@/config/env';
import axios from 'axios';

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
  const callId = queryParams.get('callId');
  const sessionId = queryParams.get('sessionId'); // For handoff calls

  // Debug: Log the parameters
  console.log('=== [VIDEO CALL - PAGE LOADED] ===');
  console.log('[Video Call] URL Parameters:', {
    livekitToken: livekitToken ? livekitToken.substring(0, 20) + '...' : null,
    livekitUrl,
    roomName,
    channelId,
    callId,
    hasCallId: !!callId,
    callIdType: typeof callId,
    fullSearch: location.search
  });

  if (!callId) {
    console.error('[Video Call] ⚠️⚠️⚠️ CRITICAL: callId is missing from URL!');
    console.error('[Video Call] The call will NOT be ended when leaving!');
    console.error('[Video Call] URL params received:', location.search);
  }

  const [isChatOpen, setChatOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { playCallEndSound } = useNotifications();
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
      } else if (wsMessage.type === 'call_ended') {
        // Call ended - play sound and navigate back to chat
        console.log('[Video Call] Call ended via WebSocket - navigating back to chat');
        playCallEndSound();
        navigate(`/dashboard/internal-chat${channelId ? `?channelId=${channelId}` : ''}`);
      } else if (wsMessage.type === 'user_left_call') {
        // Someone left the call (but call continues)
        console.log('[Video Call] User left call:', wsMessage.left_by_name);
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

  const handleLeave = async () => {
    console.log('=== [VIDEO CALL - LEAVE] ===');
    console.log('[Video Call] handleLeave called');
    console.log('[Video Call] Parameters:', {
      callId,
      channelId,
      roomName,
      sessionId,
      hasCallId: !!callId,
      hasSessionId: !!sessionId,
      callIdType: typeof callId
    });

    // Play call end sound
    playCallEndSound();

    // End the call on the backend if we have a callId
    if (callId) {
      try {
        const token = localStorage.getItem('accessToken');
        const endpoint = `${API_BASE_URL}/api/v1/video-calls/${callId}/end`;

        console.log('[Video Call] Making API request to:', endpoint);
        console.log('[Video Call] With headers:', { hasToken: !!token });

        const response = await axios.post(
          endpoint,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('[Video Call] API response:', response.data);
        console.log('[Video Call] Successfully ended call on backend');
      } catch (error: any) {
        console.error('[Video Call] Failed to end call on backend');
        console.error('[Video Call] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // Still navigate even if the end call fails
      }
    } else {
      console.warn('[Video Call] ⚠️ No callId available - cannot end call on backend');
      console.warn('[Video Call] This means the call status will remain "active" in the database!');
    }

    // End handoff call if this was a handoff (decrement agent's session count)
    if (sessionId) {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('[Video Call] Ending handoff call for session:', sessionId);
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/handoff/end`,
          { session_id: sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[Video Call] Handoff end response:', response.data);
        console.log('[Video Call] Successfully ended handoff - agent session count decremented');
      } catch (error: any) {
        console.error('[Video Call] Failed to end handoff call');
        console.error('[Video Call] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // Still navigate even if the handoff end fails
      }
    }

    // Restore previous presence status
    const previousStatus = localStorage.getItem('previousPresenceStatus');
    console.log('[Video Call] Restoring previous status:', previousStatus || 'none saved, defaulting to online');

    try {
      const token = localStorage.getItem('accessToken');
      const statusToRestore = previousStatus || 'online'; // Default to online if no previous status

      await axios.post(
        `${API_BASE_URL}/api/v1/auth/presence?presence_status=${statusToRestore}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[Video Call] Status restored to:', statusToRestore);

      // Clear the saved status from localStorage
      localStorage.removeItem('previousPresenceStatus');
    } catch (statusError) {
      console.error('[Video Call] Failed to restore previous status:', statusError);
    }

    console.log('[Video Call] Navigating back to chat...');
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
          onDisconnected={() => {
            console.log('[Video Call] LiveKitRoom onDisconnected event fired');
            handleLeave();
          }}
          onError={(error) => {
            console.error('[Video Call] LiveKitRoom error:', error);
          }}
          onConnected={() => {
            console.log('[Video Call] LiveKitRoom connected successfully!');
          }}
        >
          <VideoConference />
          <Button
            onClick={() => {
              console.log('[Video Call] Leave button clicked');
              handleLeave();
            }}
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
