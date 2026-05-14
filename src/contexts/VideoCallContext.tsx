import { createContext, useContext, useState, ReactNode } from 'react';

export interface ActiveVideoCall {
  sessionId: string;
  userId?: string;
  preloadedToken?: string;
  livekitServerUrl?: string;
  conversationSessionId?: string;
  conversationAgentId?: number;
}

export interface ActiveInternalCall {
  roomName: string;
  livekitToken: string;
  livekitUrl: string;
  channelId?: number;
  callId?: string;
  eventId?: number;
}

interface VideoCallContextValue {
  activeCall: ActiveVideoCall | null;
  startCall: (call: ActiveVideoCall) => void;
  endCall: () => void;
  activeInternalCall: ActiveInternalCall | null;
  startInternalCall: (call: ActiveInternalCall) => void;
  endInternalCall: () => void;
  updateInternalCall: (patch: Partial<ActiveInternalCall>) => void;
}

const VideoCallContext = createContext<VideoCallContextValue>({
  activeCall: null,
  startCall: () => {},
  endCall: () => {},
  activeInternalCall: null,
  startInternalCall: () => {},
  endInternalCall: () => {},
  updateInternalCall: () => {},
});

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveVideoCall | null>(null);
  const [activeInternalCall, setActiveInternalCall] = useState<ActiveInternalCall | null>(null);

  return (
    <VideoCallContext.Provider value={{
      activeCall,
      startCall: setActiveCall,
      endCall: () => setActiveCall(null),
      activeInternalCall,
      startInternalCall: setActiveInternalCall,
      endInternalCall: () => setActiveInternalCall(null),
      updateInternalCall: (patch) => setActiveInternalCall(prev => prev ? { ...prev, ...patch } : prev),
    }}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  return useContext(VideoCallContext);
}
