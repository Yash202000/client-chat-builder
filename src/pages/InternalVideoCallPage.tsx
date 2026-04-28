import React, { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
import '@livekit/components-styles';
import { useQueryClient } from '@tanstack/react-query';
import { createChannelMessage } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { API_BASE_URL } from '@/config/api';
import axios from 'axios';

// Silently records join/leave activity to the backend channel
function MeetingActivityTracker({ channelId, displayName }: { channelId: number; displayName: string }) {
  const room = useRoomContext();
  const queryClient = useQueryClient();
  const postedJoin = useRef(false);

  const postActivity = useCallback(async (text: string) => {
    try {
      await createChannelMessage(channelId, text, true);
      queryClient.invalidateQueries({ queryKey: ['channelMessages', String(channelId)] });
    } catch { /* ignore */ }
  }, [channelId, queryClient]);

  useEffect(() => {
    if (!room || postedJoin.current) return;
    postedJoin.current = true;
    const timer = setTimeout(() => postActivity(`${displayName} joined the meeting`), 1500);
    const onJoin  = (p: RemoteParticipant) => postActivity(`${p.name || p.identity} joined the meeting`);
    const onLeave = (p: RemoteParticipant) => postActivity(`${p.name || p.identity} left the meeting`);
    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);
    return () => {
      clearTimeout(timer);
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, displayName, postActivity]);

  return null;
}

const InternalVideoCallPage: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const { user }  = useAuth();
  const { playCallEndSound } = useNotifications();

  const queryParams  = new URLSearchParams(location.search);
  const livekitToken = queryParams.get('livekitToken');
  const livekitUrl   = queryParams.get('livekitUrl');
  const channelId    = queryParams.get('channelId');
  const callId       = queryParams.get('callId');
  const sessionId    = queryParams.get('sessionId');
  const returnTo     = (location.state as { returnTo?: string } | null)?.returnTo || '/dashboard/conversations';

  const handleLeave = async () => {
    if (channelId) {
      const name = user?.first_name || user?.email || 'Someone';
      try { await createChannelMessage(Number(channelId), `${name} left the meeting`, true); } catch { /* ignore */ }
    }
    playCallEndSound();
    if (callId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/video-calls/${callId}/end`, {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    if (sessionId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/handoff/end`, { session_id: sessionId },
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      } catch { /* ignore */ }
    }
    try {
      const prev = localStorage.getItem('previousPresenceStatus') || 'online';
      await axios.post(`${API_BASE_URL}/api/v1/auth/presence?presence_status=${prev}`, {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
      localStorage.removeItem('previousPresenceStatus');
    } catch { /* ignore */ }
    navigate(returnTo);
  };

  if (!livekitToken || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading video call...
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-screen h-screen bg-white dark:bg-gray-900 ${theme}`}>
      <LiveKitRoom
        video={true}
        audio={true}
        token={livekitToken}
        serverUrl={livekitUrl}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
        onDisconnected={handleLeave}
        onError={(e) => console.error('[VideoCall]', e)}
      >
        <VideoConference />
        {channelId && (
          <MeetingActivityTracker
            channelId={Number(channelId)}
            displayName={user?.first_name || user?.email || 'Someone'}
          />
        )}
      </LiveKitRoom>
    </div>
  );
};

export default InternalVideoCallPage;
