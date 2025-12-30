
import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuth } from "@/hooks/useAuth";
import { LIVEKIT_URL } from "@/config/env";
import { toast } from 'sonner';

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
          `/api/v1/calls/token?session_id=${sessionId}&user_id=${userId}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error('Failed to get video call token:', e);
        toast.error('Failed to start video call');
        onClose();
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
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    }}>
        <div style={{
            width: '90%',
            height: '90%',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={LIVEKIT_URL}
                data-lk-theme="default"
                style={{ height: '100%' }}
                onDisconnected={onClose}
                onError={(error) => {
                  console.error('Video call error:', error);
                  toast.error('Video call connection failed');
                  onClose();
                }}
            >
                <VideoConference />
            </LiveKitRoom>
        </div>
    </div>
  );
};
