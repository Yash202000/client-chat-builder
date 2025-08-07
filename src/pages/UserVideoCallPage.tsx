
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const UserVideoCallPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  const livekitUrl = queryParams.get('livekitUrl');
  const sessionId = queryParams.get('sessionId');

  const [roomToken, setRoomToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setRoomToken(token);
    } else {
      // Optionally, fetch token if not provided in URL (e.g., for direct access)
      // For now, we expect it in the URL
      console.error("LiveKit token not found in URL.");
    }
  }, [token]);

  if (!roomToken || !livekitUrl) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading video call...</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
