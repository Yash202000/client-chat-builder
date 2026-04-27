
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useTheme } from '@/hooks/useTheme';

const UserVideoCallPage: React.FC = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const livekitUrl = queryParams.get('livekitUrl');
  const sessionId = queryParams.get('sessionId');

  const [roomToken, setRoomToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setRoomToken(token);
    } else {
      console.error("LiveKit token not found in URL.");
    }
  }, [token]);

  if (!roomToken || !livekitUrl) {
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
        token={roomToken}
        serverUrl={livekitUrl}
        data-lk-theme="default"
        style={{ height: '100%', width: '100%' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default UserVideoCallPage;
