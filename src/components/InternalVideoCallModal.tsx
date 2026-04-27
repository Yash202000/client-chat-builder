import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChannelMessages, createChannelMessage } from '@/services/chatService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useWebSocket } from '@/hooks/use-websocket';
import { API_BASE_URL } from '@/config/api';
import { BACKEND_URL } from '@/config/env';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

const InternalVideoCallModal: React.FC = () => {
  const { activeInternalCall, endInternalCall } = useVideoCall();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { playCallEndSound } = useNotifications();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isChatOpen, setChatOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isMaximized, setIsMaximized] = useState(true);
  const [isRoomReady, setIsRoomReady] = useState(false);

  const { roomName, livekitToken, livekitUrl, channelId, callId } = activeInternalCall ?? {};

  useEffect(() => {
    if (livekitToken && livekitUrl && roomName) {
      const timer = setTimeout(() => setIsRoomReady(true), 100);
      return () => clearTimeout(timer);
    }
    setIsRoomReady(false);
  }, [livekitToken, livekitUrl, roomName]);

  const wsUrl = channelId
    ? `${BACKEND_URL.replace('http', 'ws')}/api/v1/ws/wschat/${channelId}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);
      if (wsMessage.type === 'new_message') {
        const newMessage = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', channelId], (old = []) => {
          if (old.some(m => m.id === newMessage.id)) return old;
          return [...old, newMessage];
        });
      } else if (wsMessage.type === 'call_ended') {
        playCallEndSound();
        handleLeave();
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
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() && channelId) {
      createMessageMutation.mutate({ channelId, content: inputValue.trim() });
      setInputValue('');
    }
  };

  const handleLeave = async () => {
    playCallEndSound();

    if (callId) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.post(
          `${API_BASE_URL}/api/v1/video-calls/${callId}/end`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error('[InternalVideoCallModal] Failed to end call on backend:', e);
      }
    }

    // Restore previous presence status
    try {
      const token = localStorage.getItem('accessToken');
      const prevStatus = localStorage.getItem('previousPresenceStatus') || 'online';
      await axios.post(
        `${API_BASE_URL}/api/v1/auth/presence?presence_status=${prevStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem('previousPresenceStatus');
    } catch (e) {
      console.error('[InternalVideoCallModal] Failed to restore presence:', e);
    }

    endInternalCall();
  };

  if (!activeInternalCall) return null;

  const content = (
    <div className={`w-full h-full flex bg-white dark:bg-black text-gray-900 dark:text-white ${theme}`}>
      {/* Video area */}
      <div className="flex-1 relative">
        {!isRoomReady ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Connecting…
          </div>
        ) : (
          <LiveKitRoom
            video={true}
            audio={true}
            token={livekitToken!}
            serverUrl={livekitUrl!}
            data-lk-theme="default"
            connectOptions={{ autoSubscribe: true }}
            onDisconnected={handleLeave}
          >
            <VideoConference />
          </LiveKitRoom>
        )}

        {/* Top-left controls */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <Button size="sm" variant="destructive" onClick={handleLeave}>
            <PhoneOff className="h-4 w-4 mr-1" />
            Leave
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsMaximized(v => !v)}>
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setChatOpen(v => !v)}>
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat sidebar */}
      {isChatOpen && (
        <div className="w-[300px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold">Team Chat</h2>
          </div>
          <ScrollArea className="flex-1 p-3">
            {isLoadingMessages ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : (
              messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex w-full mb-2', msg.sender_id === user?.id ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[85%] p-2 rounded-lg text-sm',
                    msg.sender_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  )}>
                    <div className="text-xs font-semibold mb-0.5">
                      {msg.sender.first_name || msg.sender.email}
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <Input
              placeholder="Type a message…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(
    isMaximized ? (
      <div className={`fixed inset-0 z-[99999] ${theme}`}>{content}</div>
    ) : (
      <div
        className={`fixed bottom-4 right-4 z-[99999] rounded-2xl overflow-hidden shadow-2xl ${theme}`}
        style={{ width: 480, height: 320 }}
      >
        {content}
      </div>
    ),
    document.body
  );
};

export default InternalVideoCallModal;
