
import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuth } from "@/hooks/useAuth";

interface VideoCallModalProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({ sessionId, userId, onClose }) => {
  const [token, setToken] = useState('');
  const { authFetch } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const resp = await authFetch(
          `http://localhost:8000/api/v1/calls/token?session_id=${sessionId}&user_id=${userId}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [sessionId, userId]);

  if (token === '') {
    return <div>Getting token...</div>;
  }

  return (
    <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
    }}>
        <div style={{ 
            width: '80%', 
            height: '80%', 
            backgroundColor: 'white', 
            borderRadius: '8px' 
        }}>
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                data-lk-theme="default"
                style={{ height: '100%' }}
                onDisconnected={onClose}
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    </div>
  );
};
